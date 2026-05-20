/**
 * ============================================================
 * BEACON PROJECT — Agent 11: Broken Link Crawler
 * ============================================================
 * File:      scripts/agent-11-links.js
 * Purpose:   Crawls every page on both sites and checks every
 *            internal and external link returns a valid
 *            response. Catches broken GOV.UK links, partner
 *            pages that have moved, and internal 404s before
 *            Google penalises them.
 * Schedule:  Weekly Monday 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { fetchUrl, pingUrl } = require("./http");
const { verifyAll }         = require("./verify");
const { createFinding, createReport, printHeader, printPass, printFlag, printFinding, printSummary, exitWithCode } = require("./output");
const { SITES }             = require("./config");

const AGENT_NAME = "Agent 11: Broken Link Crawler";

// ─────────────────────────────────────────────────────────────────────────────
// LINK EXTRACTION
// Extracts all href values from HTML, classifies as internal or external
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts all links from HTML content.
 * Filters out anchors, javascript:, mailto:, and tel: links.
 *
 * @param {string} html     - Page HTML
 * @param {string} baseUrl  - Site base URL for resolving relative links
 * @param {string} pageUrl  - Current page URL
 * @returns {Array<{url: string, text: string, type: "internal"|"external"}>}
 */
function extractLinks(html, baseUrl, pageUrl) {
  const links  = [];
  const seen   = new Set();
  const regex  = /href="([^"#]+)"/g;
  let   match;

  while ((match = regex.exec(html)) !== null) {
    let href = match[1].trim();

    // Skip non-navigable hrefs
    if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) continue;

    // Resolve relative URLs
    let fullUrl = href;
    if (href.startsWith("/")) {
      fullUrl = baseUrl + href;
    } else if (!href.startsWith("http")) {
      // Relative to current page
      const base = pageUrl.substring(0, pageUrl.lastIndexOf("/") + 1);
      fullUrl = base + href;
    }

    // Deduplicate
    if (seen.has(fullUrl)) continue;
    seen.add(fullUrl);

    const isInternal = fullUrl.includes(baseUrl.replace("https://www.", "").replace("https://", ""));

    links.push({
      url:  fullUrl,
      type: isInternal ? "internal" : "external",
    });
  }

  return links;
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  printHeader(AGENT_NAME);

  const rawFindings = [];
  const passed      = [];
  let   totalChecks = 0;

  for (const [, site] of Object.entries(SITES)) {
    console.log(`\n── Crawling: ${site.name} ──\n`);

    const allLinks  = new Map(); // url → {type, foundOn}

    // First pass — collect all links from all pages
    for (const page of site.pages) {
      if (page.path.endsWith(".xml") || page.path.endsWith(".txt")) continue;

      const url = site.baseUrl + page.path;
      const res = await fetchUrl(url);
      if (!res.ok) continue;

      const links = extractLinks(res.body, site.baseUrl, url);
      links.forEach(link => {
        if (!allLinks.has(link.url)) {
          allLinks.set(link.url, { type: link.type, foundOn: page.path });
        }
      });
    }

    console.log(`Found ${allLinks.size} unique links to check on ${site.name}\n`);

    // Second pass — check each link
    for (const [linkUrl, meta] of allLinks) {
      totalChecks++;

      // Skip checking external links we've already verified in other agents
      // to save quota — only check if the domain looks like a partner or GOV.UK
      const isGovernment = linkUrl.includes("gov.uk") || linkUrl.includes("fca.org") || linkUrl.includes("ico.org");
      const isPartner    = ["pensionbee", "nutmeg", "vanguard", "habito", "landc", "reallymoving"].some(p => linkUrl.includes(p));
      const isInternal   = meta.type === "internal";

      if (!isInternal && !isGovernment && !isPartner) {
        // Skip non-critical external links (social media, general sites)
        continue;
      }

      const result = await pingUrl(linkUrl);

      if (!result.ok && result.status !== 999) { // 999 = filtered
        const severity = isInternal ? "RED" : isGovernment ? "AMBER" : "INFO";

        rawFindings.push(createFinding({
          agent:       AGENT_NAME,
          name:        `Broken link: ${linkUrl}`,
          type:        "http_error",
          description: `Broken ${meta.type} link on ${site.name}${meta.foundOn}: ${linkUrl} (HTTP ${result.status || result.error})`,
          severity,
          url:         linkUrl,
          action:      isInternal
            ? `Fix or remove broken internal link on ${meta.foundOn}`
            : `Update or remove broken external link on ${meta.foundOn}`,
          phrase:      "",
        }));
        printFlag(`${meta.type} link`, `${linkUrl} — ${result.status || "error"}`);
      } else if (result.ok) {
        passed.push(linkUrl);
        // Only print passes for internal links — too verbose for externals
        if (isInternal) printPass(linkUrl.replace(site.baseUrl, ""));
      }
    }
  }

  // Verify all findings — network blips are common for external links
  const confirmed = await verifyAll(rawFindings, true);

  console.log("── Final report ──\n");
  confirmed.forEach(f => printFinding(f));

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings: confirmed, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
