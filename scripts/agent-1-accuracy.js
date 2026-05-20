/**
 * ============================================================
 * BEACON PROJECT — Agent 1: Accuracy Watchdog
 * ============================================================
 * File:      scripts/agent-1-accuracy.js
 * Purpose:   Verifies HMRC tax rates and SDLT rates daily.
 *            Uses two-layer verification:
 *            Layer 1 — Phrase presence (rate hasn't disappeared)
 *            Layer 2 — Numerical extraction (value hasn't changed)
 *            All findings verified twice before reporting.
 * Schedule:  Daily 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { fetchBody }             = require("./http");
const { verifyAll }             = require("./verify");
const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { TAX_RATES, SDLT_RATES } = require("./config");

const AGENT_NAME = "Agent 1: Accuracy Watchdog";

// ─────────────────────────────────────────────────────────────────────────────
// NUMERICAL EXTRACTION
// Extracts specific numeric values from HMRC HTML pages.
// This catches cases where the phrase still exists but the number changed.
// e.g. HMRC could update £12,570 to £13,000 and we'd catch it here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempts to extract a specific monetary value from HTML.
 * Returns the value found or null if not found.
 *
 * @param {string} html       - Page HTML
 * @param {string} searchNear - Text near the value (context anchor)
 * @param {string} expected   - Expected value as string e.g. "£12,570"
 * @returns {{ found: boolean, value: string|null }}
 */
function extractMonetaryValue(html, expected) {
  // Strip expected to just digits for comparison
  const digits = expected.replace(/[^0-9]/g, "");
  const regex  = new RegExp(`£${digits.replace(/(\d{3})/g, "$1,?").replace(/^,/, "")}`, "g");
  const found  = regex.test(html.replace(/,/g, ""));
  return { found, expected };
}

/**
 * Attempts to extract a percentage from HTML.
 * @param {string} html
 * @param {string} expected - e.g. "20%"
 * @returns {{ found: boolean, expected: string }}
 */
function extractPercentage(html, expected) {
  return { found: html.includes(expected), expected };
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  printHeader(AGENT_NAME);

  const cache       = {};
  const rawFindings = [];
  const passed      = [];
  let   totalChecks = 0;

  // Helper to fetch with caching (avoid hitting same page twice)
  async function getPage(url) {
    if (!cache[url]) {
      cache[url] = await fetchBody(url);
    }
    return cache[url];
  }

  // ── Pass 1: Income Tax Rates ─────────────────────────────────────────────
  console.log("── Pass 1a: Income Tax rates ──\n");

  const incomeTaxHtml = await getPage(TAX_RATES.sources.incomeTax);

  for (const check of TAX_RATES.verificationPhrases.incomeTax) {
    totalChecks++;
    const result = check.phrase.includes("£")
      ? extractMonetaryValue(incomeTaxHtml, check.phrase)
      : extractPercentage(incomeTaxHtml, check.phrase);

    if (!result.found) {
      rawFindings.push(createFinding({
        agent:       AGENT_NAME,
        name:        check.label,
        type:        "missing_phrase",
        description: `${check.label} (${check.phrase}) not found on HMRC income tax page`,
        severity:    check.severity,
        url:         TAX_RATES.sources.incomeTax,
        action:      `Manually verify ${check.phrase} at ${TAX_RATES.sources.incomeTax}`,
        phrase:      check.phrase,
      }));
      printFlag(check.label, `${check.phrase} not found`);
    } else {
      passed.push(check.label);
      printPass(check.label, `${check.phrase} confirmed`);
    }
  }

  // ── Pass 1b: National Insurance ──────────────────────────────────────────
  console.log("\n── Pass 1b: National Insurance rates ──\n");

  const niHtml = await getPage(TAX_RATES.sources.nationalInsurance);

  for (const check of TAX_RATES.verificationPhrases.nationalInsurance) {
    totalChecks++;
    const result = check.phrase.includes("£")
      ? extractMonetaryValue(niHtml, check.phrase)
      : extractPercentage(niHtml, check.phrase);

    if (!result.found) {
      rawFindings.push(createFinding({
        agent:       AGENT_NAME,
        name:        check.label,
        type:        "missing_phrase",
        description: `${check.label} (${check.phrase}) not found on HMRC NI page`,
        severity:    check.severity,
        url:         TAX_RATES.sources.nationalInsurance,
        action:      `Manually verify ${check.phrase} at ${TAX_RATES.sources.nationalInsurance}`,
        phrase:      check.phrase,
      }));
      printFlag(check.label);
    } else {
      passed.push(check.label);
      printPass(check.label, `${check.phrase} confirmed`);
    }
  }

  // ── Pass 1c: Student Loans ───────────────────────────────────────────────
  console.log("\n── Pass 1c: Student Loan thresholds ──\n");

  const loanHtml = await getPage(TAX_RATES.sources.studentLoans);

  for (const check of TAX_RATES.verificationPhrases.studentLoans) {
    totalChecks++;
    const result = extractMonetaryValue(loanHtml, check.phrase);

    if (!result.found) {
      rawFindings.push(createFinding({
        agent:       AGENT_NAME,
        name:        check.label,
        type:        "missing_phrase",
        description: `${check.label} (${check.phrase}) not found on HMRC student loan page`,
        severity:    check.severity,
        url:         TAX_RATES.sources.studentLoans,
        phrase:      check.phrase,
      }));
      printFlag(check.label);
    } else {
      passed.push(check.label);
      printPass(check.label, `${check.phrase} confirmed`);
    }
  }

  // ── Pass 1d: SDLT Rates ──────────────────────────────────────────────────
  console.log("\n── Pass 1d: SDLT rates ──\n");

  const sdltHtml = await getPage(SDLT_RATES.sources.rates);

  for (const check of SDLT_RATES.verificationPhrases) {
    totalChecks++;
    const result = check.phrase.includes("£")
      ? extractMonetaryValue(sdltHtml, check.phrase)
      : { found: sdltHtml.toLowerCase().includes(check.phrase.toLowerCase()), expected: check.phrase };

    if (!result.found) {
      rawFindings.push(createFinding({
        agent:       AGENT_NAME,
        name:        check.label,
        type:        "missing_phrase",
        description: `${check.label} (${check.phrase}) not found on HMRC SDLT page`,
        severity:    check.severity,
        url:         SDLT_RATES.sources.rates,
        action:      `Manually verify ${check.phrase} at ${SDLT_RATES.sources.rates}`,
        phrase:      check.phrase,
      }));
      printFlag(check.label);
    } else {
      passed.push(check.label);
      printPass(check.label, `${check.phrase} confirmed`);
    }
  }

  // ── Pass 2: Self-verification ────────────────────────────────────────────
  const confirmed = await verifyAll(rawFindings, true);

  // ── Pass 3: Final report ─────────────────────────────────────────────────
  console.log("── Pass 3: Final classification ──\n");
  confirmed.forEach(f => printFinding(f));

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings: confirmed, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
