/**
 * ============================================================
 * BEACON PROJECT — Agent 10: Domain Renewal Monitor
 * ============================================================
 * File:      scripts/agent-10-domains.js
 * Purpose:   Checks how many days remain before each domain
 *            expires. Alerts at 60, 30, 14, and 7 days.
 *            With a newborn arriving, missing a domain renewal
 *            email could cost everything built. This catches
 *            it automatically, long before Namecheap notices.
 * Schedule:  Monthly 1st of month 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const MS_PER_DAY = 1000 * 60 * 60 * 24; // Milliseconds in one day

const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { DOMAINS } = require("./config");

const AGENT_NAME = "Agent 10: Domain Renewal Monitor";

/**
 * Calculates days remaining until a date string.
 * @param {string} dateStr - Format: "YYYY-MM-DD"
 * @returns {number} Days remaining (negative if expired)
 */
function daysUntil(dateStr) {
  const expiry  = new Date(dateStr);
  const now     = new Date();
  const diffMs  = expiry.getTime() - now.getTime();
  return Math.floor(diffMs / MS_PER_DAY);
}

/**
 * Returns the severity based on days remaining.
 * @param {number} days
 * @param {Array}  alertDays - Alert thresholds from config
 * @returns {string} "RED" | "AMBER" | "INFO" | null
 */
function getSeverity(days, alertDays) {
  if (days <= 0)         return "RED";    // Already expired
  if (days <= 7)         return "RED";    // Less than a week
  if (days <= 14)        return "AMBER";  // Two weeks
  if (days <= 30)        return "AMBER";  // One month
  if (days <= 60)        return "INFO";   // Two months — early warning
  return null;                            // No alert needed
}

async function run() {
  printHeader(AGENT_NAME);

  const findings    = [];
  const passed      = [];
  let   totalChecks = 0;

  for (const domain of DOMAINS) {
    totalChecks++;
    const days     = daysUntil(domain.expiryDate);
    const severity = getSeverity(days, domain.alertDays);

    if (days <= 0) {
      findings.push(createFinding({
        agent:       AGENT_NAME,
        name:        `${domain.domain} renewal`,
        type:        "http_error",
        description: `${domain.domain} — EXPIRED ${Math.abs(days)} days ago`,
        severity:    "RED",
        url:         domain.renewalUrl,
        action:      `Renew immediately at ${domain.renewalUrl}`,
        phrase:      "",
        confidence:  "HIGH",
        confirmed:   true,
      }));
      console.log(`🔴 EXPIRED: ${domain.domain} — expired ${Math.abs(days)} days ago`);

    } else if (severity) {
      findings.push({
        ...createFinding({
          agent:       AGENT_NAME,
          name:        `${domain.domain} renewal`,
          type:        "http_error",
          description: `${domain.domain} — expires in ${days} days (${domain.expiryDate})`,
          severity,
          url:         domain.renewalUrl,
          action:      `Renew at ${domain.renewalUrl} before ${domain.expiryDate}`,
          phrase:      "",
        }),
        confidence: "HIGH",
        confirmed:  true,
      });

      const icon = severity === "RED" ? "🔴" : severity === "AMBER" ? "🟠" : "🟡";
      console.log(`${icon} ${domain.domain} — expires in ${days} days (${domain.expiryDate})`);

    } else {
      passed.push(domain.domain);
      printPass(domain.domain, `${days} days until expiry (${domain.expiryDate})`);
    }
  }

  // Domain expiry is deterministic — no need to re-verify with HTTP calls
  // Confidence is HIGH for all findings (calculated from our own data)

  console.log("── Final report ──\n");
  findings.forEach(f => printFinding(f));

  // Reminder regardless of status
  console.log("\n── Renewal checklist ──\n");
  DOMAINS.forEach(d => {
    const days = daysUntil(d.expiryDate);
    console.log(`  ${d.domain}: ${days} days remaining → Renew at ${d.renewalUrl}`);
  });

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
