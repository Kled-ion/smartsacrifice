/**
 * ============================================================
 * BEACON PROJECT — Agent 8: Hourly Uptime Monitor
 * ============================================================
 * File:      scripts/agent-8-uptime.js
 * Purpose:   Lightweight hourly ping of both site homepages.
 *            Only checks HTTP 200 — nothing more.
 *            If either site is down, fails immediately so
 *            GitHub emails you within the hour.
 *            Deliberately minimal — runs fast, uses no quota.
 * Schedule:  Hourly via GitHub Actions
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { pingUrl }   = require("./http");
const { verifyAll } = require("./verify");
const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { SITES }     = require("./config");

const AGENT_NAME = "Agent 8: Hourly Uptime Monitor";

async function run() {
  printHeader(AGENT_NAME);

  const rawFindings = [];
  const passed      = [];
  let   totalChecks = 0;

  // Only ping homepages — fastest possible check
  for (const [, site] of Object.entries(SITES)) {
    const url = site.baseUrl + "/";
    totalChecks++;

    const result = await pingUrl(url);

    if (!result.ok) {
      rawFindings.push(createFinding({
        agent:       AGENT_NAME,
        name:        `${site.name} uptime`,
        type:        "http_error",
        description: `${site.name} is DOWN — ${url} returned ${result.status || result.error || "no response"}`,
        severity:    "RED",
        url,
        phrase:      "",
        action:      "Check Vercel dashboard immediately — site may be down for all users",
      }));
      printFlag(`${site.name}`, `DOWN — HTTP ${result.status || "error"}`);
    } else {
      passed.push(site.name);
      printPass(site.name, `HTTP 200 — up ✓`);
    }
  }

  // Always verify before crying wolf — network blips are common
  const confirmed = await verifyAll(rawFindings, true);

  console.log("── Result ──\n");
  confirmed.forEach(f => printFinding(f));

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings: confirmed, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
