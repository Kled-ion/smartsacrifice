/**
 * ============================================================
 * BEACON PROJECT — Agent 4: Affiliate Health Monitor
 * ============================================================
 * File:      scripts/agent-4-affiliate.js
 * Purpose:   Verifies affiliate partner homepages are live,
 *            checks for placeholder Awin IDs in live code,
 *            and monitors partner fee accuracy.
 *            All failures verified twice before reporting.
 * Schedule:  Weekly Monday 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { fetchUrl, pingUrl } = require("./http");
const { verifyAll }         = require("./verify");
const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { SITES, AFFILIATE_PARTNERS } = require("./config");

const AGENT_NAME = "Agent 4: Affiliate Health Monitor";

async function run() {
  printHeader(AGENT_NAME);

  const rawFindings = [];
  const passed      = [];
  let   totalChecks = 0;

  // Check 1: Partner homepages are live
  console.log("── Checking partner homepages ──\n");
  for (const [key, partner] of Object.entries(AFFILIATE_PARTNERS)) {
    totalChecks++;
    const result = await pingUrl(partner.homepage);
    if (!result.ok) {
      rawFindings.push(createFinding({
        agent: AGENT_NAME, name: `${partner.name} homepage`,
        type: "http_error",
        description: `${partner.name} homepage DOWN — ${partner.homepage} returned HTTP ${result.status || result.error}`,
        severity: "RED", url: partner.homepage, phrase: "",
        action: `Check ${partner.name} manually — may affect affiliate earnings`,
      }));
      printFlag(`${partner.name}`, `HTTP ${result.status || "error"}`);
    } else {
      passed.push(`${partner.name} homepage`);
      printPass(`${partner.name}`, "live ✓");
    }
  }

  // Check 2: Partner fee accuracy
  console.log("\n── Checking partner fee accuracy ──\n");
  for (const [, partner] of Object.entries(AFFILIATE_PARTNERS)) {
    if (!partner.feePageUrl || !partner.feePhrase) continue;
    totalChecks++;
    const res = await fetchUrl(partner.feePageUrl);
    if (res.ok && !res.body.includes(partner.feePhrase)) {
      rawFindings.push(createFinding({
        agent: AGENT_NAME, name: `${partner.name} fee accuracy`,
        type: "missing_phrase",
        description: `${partner.name} fee page no longer shows "${partner.feePhrase}" — our stated fee "${partner.currentFees}" may be outdated`,
        severity: "AMBER", url: partner.feePageUrl, phrase: partner.feePhrase,
        action: `Check ${partner.name} pricing at ${partner.feePageUrl} and update site content if changed`,
      }));
      printFlag(`${partner.name} fees`, `"${partner.feePhrase}" not found — may have changed`);
    } else if (res.ok) {
      passed.push(`${partner.name} fees`);
      printPass(`${partner.name} fees`, `"${partner.feePhrase}" confirmed`);
    }
  }

  // Check 3: No placeholder Awin IDs in live sites
  console.log("\n── Checking live sites for placeholder affiliate links ──\n");
  for (const [, site] of Object.entries(SITES)) {
    totalChecks++;
    const res = await fetchUrl(site.baseUrl + "/");
    if (res.ok && res.body.includes("YOUR_AWIN_ID")) {
      rawFindings.push(createFinding({
        agent: AGENT_NAME, name: `${site.name} Awin ID`,
        type: "forbidden_phrase",
        description: `${site.name} — Awin placeholder ID found in live code. Affiliate links NOT tracking. Zero commission being earned.`,
        severity: "RED", url: site.baseUrl, phrase: "YOUR_AWIN_ID",
        action: "Update affiliate links with real Awin publisher ID",
      }));
      printFlag(`${site.name}`, "Awin placeholder found — not earning");
    } else if (res.ok) {
      passed.push(`${site.name} affiliate links`);
      printPass(`${site.name}`, "no placeholder detected ✓");
    }
  }

  const confirmed = await verifyAll(rawFindings, true);
  console.log("── Final report ──\n");
  confirmed.forEach(f => printFinding(f));

  console.log("\n── Revenue reminder ──\n");
  console.log("  To check commissions: Awin dashboard → Reports → Transaction Reports");
  console.log("  No commissions after 2+ weeks live → verify Awin tracking URL format");

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings: confirmed, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
