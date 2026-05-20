/**
 * ============================================================
 * BEACON PROJECT — Agent 6: Content Freshness Auditor
 * ============================================================
 * File:      scripts/agent-6-freshness.js
 * Purpose:   Monthly audit detecting stale year references,
 *            broken external links, and seasonal content
 *            opportunities. All findings verified twice.
 * Schedule:  Monthly 1st of month 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { fetchUrl, pingUrl } = require("./http");
const { verifyAll }         = require("./verify");
const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { SITES, OFFICIAL_LINKS, STALE_PHRASES } = require("./config");

const AGENT_NAME = "Agent 6: Content Freshness Auditor";

function getSeasonalOpportunities() {
  const m = new Date().getMonth() + 1;
  const ops = [];
  if (m === 3)        ops.push("Tax year-end: 'Maximise salary sacrifice before 5 April'");
  if (m === 4)        ops.push("New tax year: Update all 2026/27 labels");
  if (m === 10)       ops.push("Autumn Budget: Monitor for stamp duty or pension changes");
  if (m === 11||m===12) ops.push("Year-end: Tax planning content for both sites");
  if (m === 1)        ops.push("New year: 'New year, new home' content for FHG");
  return ops;
}

async function run() {
  printHeader(AGENT_NAME);

  const rawFindings = [];
  const passed      = [];
  let   totalChecks = 0;

  // Check 1: Stale content on live pages
  console.log("── Scanning live pages for stale content ──\n");
  for (const [, site] of Object.entries(SITES)) {
    for (const page of site.pages) {
      if (page.path.endsWith(".xml") || page.path.endsWith(".txt")) continue;
      totalChecks++;
      const url = site.baseUrl + page.path;
      const res = await fetchUrl(url);
      if (!res.ok) continue;

      let pageStale = false;
      for (const stale of STALE_PHRASES) {
        if (res.body.includes(stale.find)) {
          rawFindings.push(createFinding({
            agent: AGENT_NAME, name: `${site.name}${page.path} stale`,
            type: "forbidden_phrase",
            description: `${site.name}${page.path} — stale content: "${stale.find}" should be "${stale.replace}"`,
            severity: stale.severity, url, phrase: stale.find,
            action: `Replace "${stale.find}" with "${stale.replace}" in ${page.path}`,
          }));
          printFlag(`${site.name}${page.path}`, `"${stale.find}" still present`);
          pageStale = true;
        }
      }
      if (!pageStale) {
        passed.push(`${site.name}${page.path}`);
        printPass(`${site.name}${page.path}`, "content current");
      }
    }
  }

  // Check 2: External links
  console.log("\n── Verifying official external links ──\n");
  for (const link of OFFICIAL_LINKS) {
    totalChecks++;
    const result = await pingUrl(link.url);
    if (!result.ok) {
      rawFindings.push(createFinding({
        agent: AGENT_NAME, name: `External link: ${link.name}`,
        type: "http_error",
        description: `Broken external link: ${link.name} — ${link.url} (HTTP ${result.status || result.error})`,
        severity: "RED", url: link.url, phrase: "",
        action: `Update or remove broken link to ${link.url}`,
      }));
      console.log(`🔴 BROKEN: ${link.name} (${link.url})`);
    } else {
      passed.push(link.name);
      printPass(link.name, "live ✓");
    }
  }

  const confirmed = await verifyAll(rawFindings, true);

  const seasonal = getSeasonalOpportunities();
  if (seasonal.length > 0) {
    console.log("\n── Seasonal opportunities this month ──\n");
    seasonal.forEach(s => console.log(`🟡 ${s}`));
  }

  console.log("\n── Final report ──\n");
  confirmed.forEach(f => printFinding(f));

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings: confirmed, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
