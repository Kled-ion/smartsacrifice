/**
 * ============================================================
 * BEACON PROJECT — Structured Output Module
 * ============================================================
 * File:     scripts/output.js
 * Purpose:  Enforces consistent output structure across all
 *           agents. Every finding, every report, every log
 *           entry passes through here. No agent may write
 *           directly to console without going through this.
 *
 *           This guarantees:
 *           - Identical format across all agents
 *           - Parseable output for digest aggregation
 *           - Audit trail with timestamps
 *           - Confidence levels on every finding
 *           - Clean exit codes for GitHub Actions
 *
 * Owner:    Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const { SEVERITY, CONFIDENCE } = require("./config");

// ─────────────────────────────────────────────────────────────────────────────
// FINDING STRUCTURE
// Every issue found by any agent must be expressed as a Finding object
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a standardised finding object.
 *
 * @param {object} params
 * @param {string} params.agent       - Agent name (e.g. "Agent 1: Accuracy Watchdog")
 * @param {string} params.name        - Short name for the check that failed
 * @param {string} params.description - Full human-readable description of the issue
 * @param {string} params.severity    - "RED" | "AMBER" | "INFO"
 * @param {string} params.url         - URL where the issue was detected
 * @param {string} [params.action]    - Recommended action for the operator
 * @param {string} [params.confidence]- "HIGH" | "MEDIUM" | "LOW" — set by verify.js
 * @returns {object} Structured finding
 */
function createFinding({ agent, name, description, severity, url, action, confidence = "MEDIUM" }) {
  return {
    id:          `${agent}::${name}::${Date.now()}`, // Unique ID for deduplication
    agent,
    name,
    description,
    severity,
    url,
    action:      action || null,
    confidence,
    timestamp:   new Date().toISOString(),
    confirmed:   false, // Set to true by verify.js after double-check
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORT STRUCTURE
// Every agent produces one Report object at the end of its run
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a standardised report object for an agent run.
 *
 * @param {object} params
 * @param {string} params.agent       - Agent name
 * @param {number} params.totalChecks - Total number of checks performed
 * @param {Array}  params.findings    - Array of confirmed findings
 * @param {Array}  params.passed      - Array of check names that passed
 * @returns {object} Structured report
 */
function createReport({ agent, totalChecks, findings, passed }) {
  const red   = findings.filter(f => f.severity === "RED");
  const amber = findings.filter(f => f.severity === "AMBER");
  const info  = findings.filter(f => f.severity === "INFO");

  return {
    agent,
    timestamp:    new Date().toISOString(),
    totalChecks,
    passed:       passed.length,
    failed:       findings.length,
    red:          red.length,
    amber:        amber.length,
    info:         info.length,
    findings,
    passedChecks: passed,
    status:       red.length > 0 ? "RED" : amber.length > 0 ? "AMBER" : "GREEN",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRINT HELPERS
// All console output goes through these — consistent formatting guaranteed
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prints the agent header — called at the start of every agent run.
 * @param {string} agentName
 */
function printHeader(agentName) {
  const line = "═".repeat(52);
  console.log(`\n${line}`);
  console.log(`BEACON — ${agentName}`);
  console.log(`Run at: ${new Date().toISOString()}`);
  console.log(`${line}\n`);
}

/**
 * Prints a pass result for a single check.
 * @param {string} checkName
 * @param {string} [detail] - Optional additional detail
 */
function printPass(checkName, detail = "") {
  console.log(`✅ PASS: ${checkName}${detail ? ` — ${detail}` : ""}`);
}

/**
 * Prints a raw (unverified) flag — shown during Pass 1
 * @param {string} checkName
 * @param {string} detail
 */
function printFlag(checkName, detail = "") {
  console.log(`⚠️  FLAG: ${checkName}${detail ? ` — ${detail}` : ""}`);
}

/**
 * Prints a confirmed finding with severity and confidence.
 * @param {object} finding
 */
function printFinding(finding) {
  const sev  = SEVERITY[finding.severity]?.label || finding.severity;
  const conf = finding.confidence ? ` [${finding.confidence}]` : "";
  console.log(`${sev}${conf}: ${finding.description}`);
  if (finding.action) console.log(`   → ${finding.action}`);
}

/**
 * Prints the final summary for an agent run.
 * @param {object} report
 */
function printSummary(report) {
  const line = "═".repeat(52);
  console.log(`\n${line}`);
  console.log(`Summary: ${report.passed}/${report.totalChecks} passed | 🔴 ${report.red} | 🟠 ${report.amber}`);

  if (report.status === "RED")   console.log("🔴 Action required today");
  if (report.status === "AMBER") console.log("🟠 Review this week");
  if (report.status === "GREEN") console.log("✅ All checks verified clean");
}

/**
 * Exits the process with the appropriate code for GitHub Actions.
 * RED findings = exit 1 (workflow fails, GitHub sends email)
 * Everything else = exit 0 (workflow passes, silence)
 * @param {object} report
 */
function exitWithCode(report) {
  process.exit(report.status === "RED" ? 1 : 0);
}

module.exports = {
  createFinding,
  createReport,
  printHeader,
  printPass,
  printFlag,
  printFinding,
  printSummary,
  exitWithCode,
};
