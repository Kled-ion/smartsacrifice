/**
 * ============================================================
 * BEACON PROJECT — Weekly Digest
 * ============================================================
 * File:      scripts/weekly-digest.js
 * Purpose:   Runs all agents sequentially and produces one
 *            consolidated digest. Output formatted for email
 *            delivery via GitHub Actions. Designed to take
 *            under 3 minutes to read and act on.
 *
 *            Rule: if digest takes > 5 mins to read, something
 *            is wrong with the reporting, not the sites.
 *
 * Schedule:  Monday 9am UTC (after daily agents at 8am)
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { execSync }  = require("child_process");
const path          = require("path");
const { AGENTS }    = require("./config");

const DIGEST_NAME  = "Beacon Weekly Digest";
const SCRIPTS_DIR  = __dirname;

// Weekly digest runs daily + weekly agents (monthly agents run on their own schedule)
const DIGEST_AGENTS = AGENTS.filter(a => ["daily", "weekly"].includes(a.schedule));

// ─────────────────────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs a single agent and captures output and exit code.
 * @param {object} agent
 * @returns {{ success: boolean, output: string, exitCode: number }}
 */
function runAgent(agent) {
  try {
    const output = execSync(`node ${path.join(SCRIPTS_DIR, agent.file)}`, {
      encoding:  "utf8",
      timeout:   90_000, // 90 second timeout per agent
      stdio:     "pipe",
    });
    return { success: true, output, exitCode: 0 };
  } catch (err) {
    return {
      success:  false,
      output:   err.stdout || "",
      error:    err.stderr || err.message,
      exitCode: err.status || 1,
    };
  }
}

/**
 * Extracts RED and AMBER lines from agent output.
 * @param {string} output
 * @returns {{ red: string[], amber: string[], info: string[], passed: number }}
 */
function parseOutput(output) {
  const lines  = (output || "").split("\n");
  const red    = lines.filter(l => l.includes("🔴") && !l.includes("Summary")).map(l => l.trim());
  const amber  = lines.filter(l => l.includes("🟠") && !l.includes("Summary")).map(l => l.trim());
  const info   = lines.filter(l => l.includes("🟡")).map(l => l.trim());
  const passed = (lines.filter(l => l.includes("✅ PASS")).length);
  return { red, amber, info, passed };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIGEST FORMATTER
// ─────────────────────────────────────────────────────────────────────────────

function formatDigest(results, startTime) {
  const today   = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  const elapsed  = Math.round((Date.now() - startTime) / 1000);
  const divider  = "═".repeat(52);

  const allRed   = [];
  const allAmber = [];
  const allInfo  = [];
  let   totalPassed = 0;

  results.forEach(r => {
    const parsed = parseOutput(r.output);
    parsed.red.forEach(line => allRed.push(`[${r.agent.name}] ${line}`));
    parsed.amber.forEach(line => allAmber.push(`[${r.agent.name}] ${line}`));
    parsed.info.forEach(line => allInfo.push(`[${r.agent.name}] ${line}`));
    totalPassed += parsed.passed;
    if (!r.result.success && parsed.red.length === 0) {
      allRed.push(`[${r.agent.name}] Agent failed to run — check GitHub Actions logs`);
    }
  });

  const lines = [
    "",
    divider,
    `BEACON WEEKLY DIGEST — ${today}`,
    divider,
    "",
    "🔴 URGENT — Action required today:",
    allRed.length === 0
      ? "   None ✅"
      : allRed.map(r => `   ${r}`).join("\n"),
    "",
    "🟠 THIS WEEK — Action before next digest:",
    allAmber.length === 0
      ? "   None"
      : allAmber.map(a => `   ${a}`).join("\n"),
    "",
    "🟡 RECOMMENDATIONS:",
    allInfo.length === 0
      ? "   None"
      : allInfo.slice(0, 3).map(i => `   ${i}`).join("\n"),
    "",
    "📊 NUMBERS:",
    "   smartsacrifice.co.uk:   → Check Plausible Analytics",
    "   ukfirsthomeguide.co.uk: → Check Plausible Analytics",
    "   Awin commissions:       → Log into Awin dashboard",
    `   Checks passed:          ${totalPassed}`,
    "",
    "✅ AGENT STATUS:",
    ...results.map(r => {
      const parsed = parseOutput(r.output);
      const status = !r.result.success
        ? "❌ FAILED TO RUN"
        : parsed.red.length > 0
          ? `⚠️  ${parsed.red.length} issue(s) found`
          : "✅ All clear";
      return `   Agent ${r.agent.id} (${r.agent.name}): ${status}`;
    }),
    "",
    "🟡 STANDING REMINDERS:",
    "   1. ICO registration — ico.org.uk/fee (£52/yr, legally required)",
    "   2. Connect Plausible Analytics to both sites",
    "   3. Update Awin affiliate links once ID confirmed",
    "   4. Google Search Console — submit sitemaps",
    "",
    `⏱️  TIME REQUIRED FROM YOU: ${allRed.length === 0 && allAmber.length === 0 ? "0 minutes — nothing to do" : `${(allRed.length * 5) + (allAmber.length * 10)} minutes estimated`}`,
    `   (Digest generated in ${elapsed}s)`,
    "",
    divider,
    "",
  ];

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const startTime = Date.now();

  console.log(`\n${"═".repeat(52)}`);
  console.log(DIGEST_NAME);
  console.log(`Run at: ${new Date().toISOString()}`);
  console.log(`${"═".repeat(52)}\n`);
  console.log(`Running ${DIGEST_AGENTS.length} agents...\n`);

  // Run all agents and collect results
  const results = [];
  for (const agent of DIGEST_AGENTS) {
    process.stdout.write(`  Agent ${agent.id} — ${agent.name}... `);
    const result = runAgent(agent);
    results.push({ agent, result });
    const parsed = parseOutput(result.output);
    console.log(parsed.red.length > 0 ? `🔴 ${parsed.red.length} issue(s)` : result.success ? "✅ clean" : "❌ failed");
  }

  // Format and print digest
  const digest = formatDigest(results, startTime);
  console.log(digest);

  // Set GitHub Actions step summary (visible in Actions UI without opening logs)
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summaryLines = [
      "## 🏠 Beacon Weekly Digest",
      "",
      `**Run:** ${new Date().toDateString()}`,
      "",
    ];

    const allRed = results.flatMap(r => parseOutput(r.output).red);
    if (allRed.length === 0) {
      summaryLines.push("### ✅ All clear — no action needed");
    } else {
      summaryLines.push("### 🔴 Issues found — action required");
      allRed.forEach(r => summaryLines.push(`- ${r}`));
    }

    require("fs").appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryLines.join("\n") + "\n");
  }

  // Exit with 1 if any RED issues — GitHub sends email
  const anyRed = results.some(r => parseOutput(r.output).red.length > 0 || !r.result.success);
  process.exit(anyRed ? 1 : 0);
}

run().catch(err => { console.error("Digest error:", err.message); process.exit(1); });
