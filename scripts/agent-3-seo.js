/**
 * ============================================================
 * BEACON PROJECT — Agent 3: SEO Monitor
 * ============================================================
 * File:      scripts/agent-3-seo.js
 * Purpose:   Checks on-page SEO signals for both sites weekly.
 *            Validates canonical URLs, meta tags, schema markup,
 *            sitemap accessibility, and keyword targeting.
 *            All failures verified twice before reporting.
 * Schedule:  Weekly Monday 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { fetchUrl }  = require("./http");
const { verifyAll } = require("./verify");
const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { SITES }     = require("./config");

const AGENT_NAME = "Agent 3: SEO Monitor";

// SEO checks per page — what must be present and correct
const SEO_CHECKS = [
  {
    siteKey: "smartSacrifice",
    path:    "/",
    checks: [
      { type: "title",       expected: "Salary Sacrifice Calculator", desc: "Title contains primary keyword"   },
      { type: "description", expected: "salary sacrifice",            desc: "Meta description contains keyword" },
      { type: "canonical",   expected: "smartsacrifice.co.uk",        desc: "Canonical URL correct domain"     },
      { type: "schema",      expected: "WebApplication",              desc: "Schema markup present"             },
      { type: "h1",          expected: "Salary Sacrifice",            desc: "H1 contains primary keyword"       },
    ],
  },
  {
    siteKey: "ukFirstHomeGuide",
    path:    "/",
    checks: [
      { type: "title",       expected: "First Home",                  desc: "Title present"                    },
      { type: "description", expected: "stamp duty",                  desc: "Meta description relevant"         },
      { type: "canonical",   expected: "ukfirsthomeguide.co.uk",      desc: "Canonical URL correct domain"     },
      { type: "schema",      expected: "WebSite",                     desc: "Schema markup present"             },
    ],
  },
  {
    siteKey: "ukFirstHomeGuide",
    path:    "/stamp-duty-calculator.html",
    checks: [
      { type: "title",       expected: "Stamp Duty",                  desc: "Title contains primary keyword"   },
      { type: "canonical",   expected: "ukfirsthomeguide.co.uk",      desc: "Canonical URL correct domain"     },
      { type: "schema",      expected: "FAQ",                         desc: "FAQ schema for rich results"       },
    ],
  },
];

// Extract SEO signals from raw HTML
function extractSignals(html) {
  return {
    title:       (html.match(/<title[^>]*>([^<]+)<\/title>/i)         || [])[1]?.trim() || "",
    description: (html.match(/name="description"\s+content="([^"]+)"/i) || html.match(/content="([^"]+)"\s+name="description"/i) || [])[1] || "",
    canonical:   (html.match(/rel="canonical"\s+href="([^"]+)"/i)     || [])[1] || "",
    h1:          (html.match(/<h1[^>]*>([^<]+)<\/h1>/i)               || [])[1]?.trim() || "",
    schemaTypes: (html.match(/"@type":\s*"([^"]+)"/g) || []).map(m => m.replace(/"@type":\s*"/, "").replace(/"$/, "")),
  };
}

async function run() {
  printHeader(AGENT_NAME);

  const rawFindings = [];
  const passed      = [];
  let   totalChecks = 0;

  for (const pageCheck of SEO_CHECKS) {
    const site = SITES[pageCheck.siteKey];
    const url  = site.baseUrl + pageCheck.path;

    console.log(`\n── ${site.name}${pageCheck.path} ──\n`);

    const res = await fetchUrl(url);
    if (!res.ok) {
      rawFindings.push(createFinding({
        agent: AGENT_NAME, name: `${site.name}${pageCheck.path} fetch`,
        type: "http_error", description: `Cannot fetch for SEO check: HTTP ${res.status}`,
        severity: "RED", url, phrase: "",
      }));
      continue;
    }

    const signals = extractSignals(res.body);

    for (const check of pageCheck.checks) {
      totalChecks++;
      let value = "", ok = false;

      switch (check.type) {
        case "title":       value = signals.title;       ok = value.toLowerCase().includes(check.expected.toLowerCase()); break;
        case "description": value = signals.description; ok = value.toLowerCase().includes(check.expected.toLowerCase()); break;
        case "canonical":   value = signals.canonical;   ok = value.includes(check.expected); break;
        case "h1":          value = signals.h1;          ok = value.toLowerCase().includes(check.expected.toLowerCase()); break;
        case "schema":      ok = signals.schemaTypes.some(t => t.toLowerCase().includes(check.expected.toLowerCase())); value = signals.schemaTypes.join(", ") || "none"; break;
      }

      if (!ok) {
        const severity = check.type === "canonical" || check.type === "title" ? "RED" : "AMBER";
        rawFindings.push(createFinding({
          agent: AGENT_NAME, name: `${site.name}${pageCheck.path} ${check.type}`,
          type: "missing_phrase",
          description: `${site.name}${pageCheck.path} — ${check.desc} | Expected: "${check.expected}" | Found: "${value}"`,
          severity, url, phrase: check.expected,
          action: `Fix ${check.type} on ${pageCheck.path}`,
        }));
        printFlag(check.desc, `expected "${check.expected}", found "${value}"`);
      } else {
        passed.push(`${site.name}${pageCheck.path} ${check.type}`);
        printPass(check.desc);
      }
    }

    // Check sitemap
    totalChecks++;
    const sitemapUrl = site.baseUrl + "/sitemap.xml";
    const sitemapRes = await fetchUrl(sitemapUrl);
    if (!sitemapRes.ok || !sitemapRes.body.includes("<urlset")) {
      rawFindings.push(createFinding({
        agent: AGENT_NAME, name: `${site.name} sitemap`,
        type: "http_error", description: `${site.name} sitemap not returning valid XML`,
        severity: "AMBER", url: sitemapUrl, phrase: "",
      }));
      printFlag(`${site.name} sitemap`);
    } else {
      passed.push(`${site.name} sitemap`);
      printPass(`${site.name} sitemap accessible`);
    }
  }

  const confirmed = await verifyAll(rawFindings, true);
  console.log("── Final report ──\n");
  confirmed.forEach(f => printFinding(f));

  // Keyword reminder
  console.log("\n── Target keywords (monitor in Google Search Console) ──\n");
  Object.values(SITES).forEach(site => {
    console.log(`  ${site.name}:`);
    site.seoKeywords.forEach(kw => console.log(`  • "${kw}"`));
  });

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings: confirmed, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
