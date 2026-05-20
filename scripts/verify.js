/**
 * ============================================================
 * BEACON PROJECT — Self-Verification Module
 * ============================================================
 * File:     scripts/verify.js
 * Purpose:  Every finding from every agent must be verified
 *           independently before being reported. This module
 *           re-checks each finding and assigns a confidence
 *           level. LOW confidence findings cannot be RED.
 *           Transient errors are dismissed automatically.
 *
 * The loop:
 *   Pass 1 (in agent)  — Initial detection
 *   Pass 2 (here)      — Independent re-fetch after 2s delay
 *   Pass 3 (here)      — If still failing, mark as confirmed HIGH
 *
 * Rules:
 *   - LOW confidence   → downgraded to INFO regardless of severity
 *   - MEDIUM/HIGH RED  → reported as RED
 *   - Never cry wolf   → unconfirmed findings are silently dismissed
 *
 * Owner:    Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { fetchUrl }           = require("./http");
const { THRESHOLDS }         = require("./config");

/**
 * Verifies a single finding by re-fetching the source independently.
 *
 * @param {object} finding            - Finding object from createFinding()
 * @param {string} finding.url        - URL to re-check
 * @param {string} finding.type       - "http_error" | "missing_phrase" | "forbidden_phrase" | "seo_missing"
 * @param {string} finding.phrase     - The phrase to check for (if applicable)
 * @param {string} finding.severity   - Original severity
 * @returns {Promise<object>}         - Finding with confidence and confirmed flag set
 */
async function verifyFinding(finding) {
  let confirmCount = 0;

  for (let attempt = 1; attempt <= THRESHOLDS.verifyAttempts; attempt++) {

    // Wait between attempts — avoids hitting same edge cache twice
    if (attempt > 1) {
      await new Promise(res => setTimeout(res, THRESHOLDS.verifyDelayMs));
    }

    const res = await fetchUrl(finding.url);

    switch (finding.type) {
      case "http_error":
        // Confirm: page still not returning 200
        if (!res.ok) confirmCount++;
        break;

      case "missing_phrase":
        // Confirm: phrase still absent
        if (res.ok && finding.phrase && !res.body.includes(finding.phrase)) confirmCount++;
        // Also confirm if page is down (can't check phrase but issue exists)
        if (!res.ok) confirmCount++;
        break;

      case "forbidden_phrase":
        // Confirm: forbidden phrase still present
        if (res.ok && finding.phrase && res.body.includes(finding.phrase)) confirmCount++;
        break;

      case "seo_missing":
        // Confirm: SEO element still absent
        if (res.ok && finding.phrase && !res.body.toLowerCase().includes(finding.phrase.toLowerCase())) confirmCount++;
        break;

      default:
        // Unknown type — treat as confirmed to be safe
        confirmCount++;
    }
  }

  // Determine confidence
  const confidence =
    confirmCount >= THRESHOLDS.verifyAttempts ? "HIGH"   :
    confirmCount >= 1                          ? "MEDIUM" :
                                                "LOW";

  // LOW confidence findings cannot be RED — downgrade to INFO
  const adjustedSeverity =
    confidence === "LOW" && finding.severity === "RED" ? "INFO" : finding.severity;

  return {
    ...finding,
    confidence,
    severity:  adjustedSeverity,
    confirmed: confirmCount >= 1,
  };
}

/**
 * Verifies an array of findings.
 * Silently dismisses findings that cannot be confirmed.
 * Returns only confirmed findings with updated confidence levels.
 *
 * @param {Array}   findings  - Raw findings from an agent
 * @param {boolean} verbose   - Whether to log verification progress
 * @returns {Promise<Array>}  - Verified findings only
 */
async function verifyAll(findings, verbose = true) {
  if (findings.length === 0) return [];

  if (verbose) {
    console.log(`\n  🔍 Pass 2: Verifying ${findings.length} finding(s) independently...`);
  }

  const verified  = [];
  let   dismissed = 0;

  for (const finding of findings) {
    const result = await verifyFinding(finding);

    if (verbose) {
      const icon =
        result.confidence === "HIGH"   ? "✅" :
        result.confidence === "MEDIUM" ? "⚠️ " :
                                         "❓";
      console.log(`  ${icon} [${result.confidence}] ${finding.name}`);
    }

    if (result.confirmed) {
      verified.push(result);
    } else {
      dismissed++;
      if (verbose) {
        console.log(`     └─ Dismissed — not confirmed on re-check (transient or false positive)`);
      }
    }
  }

  if (verbose) {
    console.log(`  Verification complete: ${verified.length} confirmed, ${dismissed} dismissed\n`);
  }

  return verified;
}

module.exports = { verifyFinding, verifyAll };
