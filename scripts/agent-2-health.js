/**
 * ============================================================
 * BEACON PROJECT — Agent 2: Site Health Monitor
 * ============================================================
 * File:      scripts/agent-2-health.js
 * Purpose:   Checks every page on both sites returns HTTP 200,
 *            contains required content, has no forbidden
 *            phrases, and passes all compliance signals.
 *            All failures verified twice before reporting.
 * Schedule:  Daily 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { fetchUrl }  = require("./http");
const { verifyAll } = require("./verify");
const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { SITES }     = require("./config");

const AGENT_NAME = "Agent 2: Site Health Monitor";

async function run() {
  printHeader(AGENT_NAME);

  const rawFindings = [];
  const passed      = [];
  let   totalChecks = 0;

  for (const [, site] of Object.entries(SITES)) {
    console.log(`\n── ${site.name} (${site.domain}) ──\n`);

    for (const page of site.pages) {
      const url = site.baseUrl + page.path;
      totalChecks++;

      // Fetch the page
      const res = await fetchUrl(url);

      // Check 1: HTTP 200
      if (!res.ok) {
        rawFindings.push(createFinding({
          agent:       AGENT_NAME,
          name:        `${site.name}${page.path} HTTP status`,
          type:        "http_error",
          description: `${site.name}${page.path} returned HTTP ${res.status || "error"} — expected 200`,
          severity:    page.critical ? "RED" : "AMBER",
          url,
          action:      page.critical ? "Check Vercel deployment immediately" : "Investigate page deployment",
          phrase:      "",
        }));
        printFlag(`${page.name}`, `HTTP ${res.status || "error"}`);
        continue; // No point checking content if page is down
      }

      let pageOk = true;

      // Check 2: Required phrases (homepage only)
      if (page.path === "/" && site.requiredPhrases) {
        for (const phrase of site.requiredPhrases) {
          totalChecks++;
          if (!res.body.includes(phrase)) {
            rawFindings.push(createFinding({
              agent:       AGENT_NAME,
              name:        `${site.name}/ required phrase`,
              type:        "missing_phrase",
              description: `${site.name}/ — required phrase missing: "${phrase}"`,
              severity:    "RED",
              url,
              phrase,
              action:      `Find and restore phrase "${phrase}" on homepage`,
            }));
            printFlag(`${page.name} required phrase`, `"${phrase}" missing`);
            pageOk = false;
          }
        }
      }

      // Check 3: Forbidden phrases (all pages)
      if (site.forbiddenPhrases) {
        for (const phrase of site.forbiddenPhrases) {
          totalChecks++;
          if (res.body.includes(phrase)) {
            rawFindings.push(createFinding({
              agent:       AGENT_NAME,
              name:        `${site.name}${page.path} forbidden phrase`,
              type:        "forbidden_phrase",
              description: `${site.name}${page.path} — forbidden phrase found: "${phrase}"`,
              severity:    "RED",
              url,
              phrase,
              action:      `Remove "${phrase}" from page — placeholder or wrong domain`,
            }));
            printFlag(`${page.name} forbidden phrase`, `"${phrase}" found`);
            pageOk = false;
          }
        }
      }

      // Check 4: SSL — confirm HTTPS not HTTP
      if (res.url && res.url.startsWith("http://")) {
        totalChecks++;
        rawFindings.push(createFinding({
          agent:       AGENT_NAME,
          name:        `${site.name}${page.path} SSL`,
          type:        "missing_phrase",
          description: `${site.name}${page.path} — serving over HTTP not HTTPS`,
          severity:    "RED",
          url,
          phrase:      "https",
          action:      "Check Vercel domain settings — HTTPS must be enforced",
        }));
        printFlag(`${page.name} SSL`, "HTTP not HTTPS");
        pageOk = false;
      }

      if (pageOk) {
        passed.push(`${site.name}${page.path}`);
        printPass(`${page.name}`, `HTTP 200 ✓`);
      }
    }
  }

  // Verify all findings
  const confirmed = await verifyAll(rawFindings, true);

  console.log("── Final report ──\n");
  confirmed.forEach(f => printFinding(f));

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings: confirmed, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
