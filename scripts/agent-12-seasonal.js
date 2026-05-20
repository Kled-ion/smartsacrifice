/**
 * ============================================================
 * BEACON PROJECT — Agent 12: Seasonal Content Calendar
 * ============================================================
 * File:      scripts/agent-12-seasonal.js
 * Purpose:   Checks the current date against the seasonal
 *            content calendar in config. Raises GitHub issues
 *            automatically for upcoming content opportunities
 *            4 weeks before the relevant event. Never misses
 *            a tax year end, Budget, or LISA deadline again.
 * Schedule:  Weekly Monday 8am UTC
 * Owner:     Kleds (Kled-ion on GitHub)
 * ============================================================
 */

"use strict";

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7; // Milliseconds in one week

const { createFinding, createReport, printHeader, printPass, printFinding, printSummary, exitWithCode } = require("./output");
const { SEASONAL_CALENDAR } = require("./config");

const AGENT_NAME = "Agent 12: Seasonal Content Calendar";

/**
 * Checks if a seasonal trigger should fire this week.
 * Fires if we're within weeksOut weeks of the target month start.
 *
 * @param {object} trigger        - Seasonal calendar entry
 * @param {Date}   [now]          - Current date (injectable for testing)
 * @returns {{ shouldFire: boolean, weeksAway: number }}
 */
function shouldTrigger(trigger, now = new Date()) {
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear  = now.getFullYear();

  for (const targetMonth of trigger.months) {
    // Calculate the start of the target month this year
    const targetDate = new Date(currentYear, targetMonth - 1, 1);

    // If target month is in the past this year, check next year
    if (targetDate < now) {
      targetDate.setFullYear(currentYear + 1);
    }

    const msUntil     = targetDate.getTime() - now.getTime();
    const weeksAway   = msUntil / (1000 * 60 * 60 * 24 * 7);
    const triggerWeek = trigger.weeksOut;

    // Fire if we're within the trigger window (weeksOut to weeksOut-1 weeks away)
    if (weeksAway <= triggerWeek && weeksAway > triggerWeek - 1) {
      return { shouldFire: true, weeksAway: Math.round(weeksAway) };
    }
  }

  return { shouldFire: false, weeksAway: 999 };
}

async function run() {
  printHeader(AGENT_NAME);

  const findings    = [];
  const passed      = [];
  const upcoming    = [];
  let   totalChecks = 0;

  const now = new Date();
  console.log(`Current date: ${now.toDateString()}\n`);
  console.log("── Checking seasonal content calendar ──\n");

  for (const trigger of SEASONAL_CALENDAR) {
    totalChecks++;
    const { shouldFire, weeksAway } = shouldTrigger(trigger, now);

    if (shouldFire) {
      const severity = trigger.priority === "HIGH" ? "AMBER" : "INFO";

      findings.push({
        ...createFinding({
          agent:       AGENT_NAME,
          name:        trigger.title,
          type:        "missing_phrase",
          description: `📅 ${trigger.title} — due in ~${weeksAway} week(s)`,
          severity,
          url:         "https://github.com",
          action:      trigger.description,
          phrase:      "",
        }),
        confidence: "HIGH",
        confirmed:  true,
      });

      const icon = trigger.priority === "HIGH" ? "🟠" : "🟡";
      console.log(`${icon} TRIGGER: ${trigger.title}`);
      console.log(`   Due in ~${weeksAway} week(s) — ${trigger.description}`);
      console.log(`   Sites: ${trigger.site}\n`);

    } else {
      passed.push(trigger.title);
      printPass(trigger.title, `Not due yet`);
    }
  }

  // Show upcoming calendar for context
  console.log("\n── Upcoming content calendar ──\n");
  SEASONAL_CALENDAR.forEach(trigger => {
    const { shouldFire, weeksAway } = shouldTrigger(trigger, now);
    if (!shouldFire) {
      upcoming.push({ title: trigger.title, weeks: weeksAway });
    }
  });

  upcoming
    .sort((a, b) => a.weeks - b.weeks)
    .slice(0, 3)
    .forEach(u => console.log(`  📅 ${u.title} — ~${u.weeks} weeks away`));

  console.log("\n── Final report ──\n");
  findings.forEach(f => printFinding(f));

  const report = createReport({ agent: AGENT_NAME, totalChecks, findings, passed });
  printSummary(report);
  exitWithCode(report);
}

run().catch(err => { console.error(`${AGENT_NAME} error:`, err.message); process.exit(1); });
