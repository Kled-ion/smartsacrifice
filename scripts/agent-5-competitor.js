/**
 * ============================================================
 * BEACON PROJECT — Agent 5: Competitor Monitor
 * ============================================================
 * File:      scripts/agent-5-competitor.js
 * Purpose:   Monitors competitor pages weekly for new tools,
 *            content changes, and opportunities. Also checks
 *            HMRC RSS for policy announcements that may
 *            require our content to update.
 *            Informational only — never fails the pipeline.
 * Schedule:  Weekly Monday 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { fetchUrl }              = require("./http");
const { verifyAll }             = require("./verify");
const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { COMPETITORS }           = require("./config");

const AGENT_NAME = "Agent 5: Competitor Monitor";

const CHECKS = [
  { name: "MoneySavingExpert — Salary Sacrifice", url: COMPETITORS.moneySavingExpert.salaryPage, mustFind: ["salary sacrifice", "pension"], flagIf: ["2026/27"], purpose: "New calculator features or tax year updates" },
  { name: "MoneySavingExpert — First-Time Buyers", url: COMPETITORS.moneySavingExpert.ftbPage,   mustFind: ["stamp duty", "first-time"],    flagIf: ["£300,000"], purpose: "FTB content updates to match"             },
  { name: "MoneySupermarket — Stamp Duty",         url: COMPETITORS.moneySupermarket.sdltPage,   mustFind: ["stamp duty", "calculator"],    flagIf: [],           purpose: "UX changes and new features"            },
  { name: "Which? — First-Time Buyers",            url: COMPETITORS.which.ftbPage,               mustFind: ["first-time", "mortgage"],      flagIf: [],           purpose: "Content gaps we can fill"               },
];

async function run() {
  printHeader(AGENT_NAME);
  console.log("ℹ️  Informational only — never fails the pipeline.\n");

  const rawFindings = [];
  const passed      = [];
  const alerts      = [];
  const unreachable = [];
  let   totalChecks = 0;

  console.log("── Pass 1: Competitor page scan ──\n");

  for (const check of CHECKS) {
    totalChecks++;
    console.log(`── ${check.name} ──`);

    const res = await fetchUrl(check.url);
    if (!res.ok) {
      unreachable.push(`${check.name} — HTTP ${res.status || "error"}`);
      console.log(`🔴 Unreachable: HTTP ${res.status || "error"}`);
      console.log(`   URL: ${check.url}\n`);
      continue;
    }

    const html    = res.body.toLowerCase();
    const missing = check.mustFind.filter(p => !html.includes(p.toLowerCase()));

    if (missing.length > 0) {
      rawFindings.push(createFinding({
        agent: AGENT_NAME, name: check.name,
        type: "missing_phrase",
        description: `${check.name}: page may have changed — "${missing.join('", "')}" no longer found`,
        severity: "INFO", url: check.url, phrase: missing[0],
      }));
      printFlag(check.name, `"${missing.join('", "')}" not found`);
    } else {
      passed.push(check.name);
      printPass(check.name, "content stable");
    }

    const triggered = check.flagIf.filter(p => html.includes(p.toLowerCase()));
    if (triggered.length > 0) {
      alerts.push(`${check.name}: mentions "${triggered.join('", "')}" — verify our content covers this`);
      console.log(`🟠 Alert: competitor mentions "${triggered.join('", "')}"`);
    }
    console.log(`   Purpose: ${check.purpose}\n`);
  }

  console.log(`── Pass 2: Verification (${rawFindings.length} finding(s)) ──`);
  const confirmed = await verifyAll(rawFindings, true);

  console.log("── Content gap opportunities ──\n");
  [
    "Salary sacrifice vs personal pension — direct comparison article",
    "Stamp duty calculator for limited company purchases",
    "Shared ownership stamp duty calculator (specialist, under-served)",
    "'How much tax do I actually pay?' personalised calculator",
  ].forEach((r, i) => console.log(`🟡 ${i + 1}. ${r}`));

  console.log("\n── Final report ──\n");
  confirmed.forEach(f => printFinding(f));
  if (alerts.length > 0) { console.log("\n🟠 Alerts:"); alerts.forEach(a => console.log(`  • ${a}`)); }
  if (unreachable.length > 0) { console.log("\n⚠️  Unreachable:"); unreachable.forEach(u => console.log(`  • ${u}`)); }

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings: confirmed, passed });
  printSummary(report);
  process.exit(0); // Always exits 0 — informational only
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(0); });
