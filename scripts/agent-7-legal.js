/**
 * ============================================================
 * BEACON PROJECT — Agent 7: Legal Compliance Monitor
 * ============================================================
 * File:      scripts/agent-7-legal.js
 * Purpose:   Monthly check that both sites remain legally
 *            compliant: financial disclaimers, affiliate
 *            disclosures, privacy policies, FCA perimeter.
 *            All failures verified twice before reporting.
 * Schedule:  Monthly 1st of month 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { fetchUrl }  = require("./http");
const { verifyAll } = require("./verify");
const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { LEGAL_CHECKS } = require("./config");

const AGENT_NAME = "Agent 7: Legal Compliance Monitor";

const MANUAL_CHECKS = [
  "ICO registration — ico.org.uk/fee — £52/yr — check if processing personal data",
  "Awin T&Cs — publisher.awin.com → Resources → Publisher Terms for updates",
  "FCA perimeter — does any new content constitute regulated advice?",
  "ASA CAP — are all promotional claims still accurate for our partners?",
];

async function run() {
  printHeader(AGENT_NAME);

  // Cache pages to avoid duplicate requests
  const cache = {};
  async function getPage(url) {
    if (!cache[url]) {
      const res = await fetchUrl(url);
      cache[url] = { ok: res.ok, body: res.body };
    }
    return cache[url];
  }

  const rawFindings = [];
  const passed      = [];
  let   totalChecks = 0;

  console.log("── Automated compliance checks ──\n");

  for (const check of LEGAL_CHECKS) {
    totalChecks++;
    const page = await getPage(check.url);

    if (!page.ok) {
      rawFindings.push(createFinding({
        agent: AGENT_NAME, name: check.name,
        type: "http_error",
        description: `${check.name} — page not accessible`,
        severity: "RED", url: check.url, phrase: "",
        action: `Page down: ${check.url} — restore immediately`,
      }));
      printFlag(check.name, "page not accessible");
      continue;
    }

    const missing = check.phrases.filter(p => !page.body.toLowerCase().includes(p.toLowerCase()));

    if (missing.length > 0) {
      rawFindings.push(createFinding({
        agent: AGENT_NAME, name: check.name,
        type: "missing_phrase",
        description: `${check.name} — missing required text: "${missing.join('", "')}"`,
        severity: check.severity, url: check.url, phrase: missing[0],
        action: `Required for: ${check.reason} — restore missing text`,
      }));
      printFlag(check.name, `missing: "${missing.join('", "')}"`);
    } else {
      passed.push(check.name);
      printPass(check.name);
    }
  }

  const confirmed = await verifyAll(rawFindings, true);

  console.log("\n── Manual checks (do monthly) ──\n");
  MANUAL_CHECKS.forEach((c, i) => console.log(`${i + 1}. ${c}`));

  console.log("\n── Final report ──\n");
  confirmed.forEach(f => printFinding(f));

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings: confirmed, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
