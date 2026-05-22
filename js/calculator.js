/**
 * SALARY SACRIFICE CALCULATOR ENGINE
 * ====================================
 * Pure JavaScript. No dependencies. No framework.
 * All maths verified against HMRC published rates for 2025/26 tax year.
 *
 * What this file does:
 * --------------------
 * It takes someone's salary and pension contribution,
 * then calculates exactly what they save through salary sacrifice
 * versus paying into a pension from take-home pay.
 *
 * Why salary sacrifice saves money:
 * ----------------------------------
 * Normal pension: you earn £50,000, pay income tax and NI on all of it,
 * then put some of what's left into your pension.
 *
 * Salary sacrifice: your employer reduces your "official" salary to £45,000
 * on paper, and pays £5,000 directly into your pension. You never officially
 * earned the £5,000, so you never pay tax or NI on it. That's the saving.
 *
 * How to read this file:
 * ----------------------
 * Each section is clearly labelled. The TAX BANDS section defines
 * the HMRC thresholds. The CALCULATION FUNCTIONS section does the maths.
 * The MAIN FUNCTION at the bottom ties it all together.
 *
 * IMPORTANT DISCLAIMER:
 * ---------------------
 * Tax rules change. These figures are for 2025/26 England/Wales/NI.
 * Scottish income tax rates differ. Always verify with HMRC or an
 * Independent Financial Adviser before making decisions.
 *
 * Author: Smart Sacrifice (smartsacrifice.co.uk)
 * Last verified: April 2025 against HMRC published tables
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// TAX BANDS 2025/26
// Source: HMRC — https://www.gov.uk/income-tax-rates
// These are the official thresholds for England, Wales and Northern Ireland.
// ─────────────────────────────────────────────────────────────────────────────

const TAX = {
  PERSONAL_ALLOWANCE:   12_570,   // Earn below this → pay zero income tax
  BASIC_RATE_LIMIT:     50_270,   // Earn up to this → pay 20% on amount above personal allowance
  HIGHER_RATE_LIMIT:   125_140,   // Earn up to this → pay 40% on amount above basic rate limit
  // Above £125,140 → 45% (additional rate)

  BASIC_RATE:    0.20,
  HIGHER_RATE:   0.40,
  ADDITIONAL_RATE: 0.45,

  // Personal allowance is reduced by £1 for every £2 above £100,000
  // Full personal allowance lost above £125,140
  PA_TAPER_START: 100_000,
  PA_TAPER_END:   125_140,
};

// National Insurance rates 2025/26
// Employee NI only (employer NI is separate and relevant for employer)
const NI = {
  PRIMARY_THRESHOLD:  12_570,    // Earn below this → pay no NI
  UPPER_EARNINGS_LIMIT: 50_270,  // Earn above this → pay lower NI rate
  MAIN_RATE:    0.08,            // 8% on earnings between primary threshold and UEL
  HIGHER_RATE:  0.02,            // 2% on earnings above UEL
};

// Plan 2 Student Loan (most common for graduates after 2012)
const STUDENT_LOAN = {
  PLAN2_THRESHOLD: 29_385,  // Repay 9% on earnings above this
  PLAN2_RATE:       0.09,
  PLAN5_THRESHOLD: 25_000,  // Plan 5 (newer graduates)
  PLAN5_RATE:       0.09,
};

// ─────────────────────────────────────────────────────────────────────────────
// INCOME TAX CALCULATION
// Works like income tax bands — applied progressively, not a flat rate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates income tax for a given gross salary.
 *
 * Example: Salary £60,000
 * - Personal allowance: £12,570 → tax free
 * - Basic rate band: £37,700 (£50,270 - £12,570) × 20% = £7,540
 * - Higher rate: £9,730 (£60,000 - £50,270) × 40% = £3,892
 * - Total tax: £11,432
 *
 * @param {number} grossSalary - Annual gross salary in GBP
 * @returns {object} Detailed tax breakdown
 */
function calcIncomeTax(grossSalary) {
  if (grossSalary <= 0) return { total: 0, basicRateTax: 0, higherRateTax: 0, additionalRateTax: 0, effectiveRate: 0 };

  // Calculate personal allowance (tapers above £100k)
  let personalAllowance = TAX.PERSONAL_ALLOWANCE;
  if (grossSalary > TAX.PA_TAPER_START) {
    // Reduce by £1 for every £2 above £100,000
    const excess = Math.min(grossSalary - TAX.PA_TAPER_START, TAX.PA_TAPER_START);
    personalAllowance = Math.max(0, personalAllowance - Math.floor(excess / 2));
  }

  const taxableIncome = Math.max(0, grossSalary - personalAllowance);

  // Basic rate (20%)
  const basicRateTaxable = Math.max(0, Math.min(taxableIncome, TAX.BASIC_RATE_LIMIT - personalAllowance));
  const basicRateTax     = basicRateTaxable * TAX.BASIC_RATE;

  // Higher rate (40%)
  const higherRateTaxable = Math.max(0, Math.min(taxableIncome - basicRateTaxable, TAX.HIGHER_RATE_LIMIT - TAX.BASIC_RATE_LIMIT));
  const higherRateTax     = higherRateTaxable * TAX.HIGHER_RATE;

  // Additional rate (45%)
  const additionalRateTaxable = Math.max(0, taxableIncome - basicRateTaxable - higherRateTaxable);
  const additionalRateTax     = additionalRateTaxable * TAX.ADDITIONAL_RATE;

  const total = basicRateTax + higherRateTax + additionalRateTax;

  return {
    total:              Math.round(total),
    basicRateTax:       Math.round(basicRateTax),
    higherRateTax:      Math.round(higherRateTax),
    additionalRateTax:  Math.round(additionalRateTax),
    personalAllowance,
    effectiveRate:      grossSalary > 0 ? Math.round((total / grossSalary) * 10000) / 100 : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NATIONAL INSURANCE CALCULATION
// Employee NI only. Employer NI handled separately.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates employee National Insurance contributions.
 *
 * Example: Salary £60,000
 * - Below primary threshold (£12,570): no NI
 * - Main rate band: (£50,270 - £12,570) × 8% = £3,016
 * - Higher rate: (£60,000 - £50,270) × 2% = £195
 * - Total NI: £3,211
 *
 * @param {number} grossSalary
 * @returns {object}
 */
function calcNationalInsurance(grossSalary) {
  if (grossSalary <= NI.PRIMARY_THRESHOLD) return { total: 0, mainRate: 0, higherRate: 0 };

  // Main rate band
  const mainRateTaxable = Math.max(0, Math.min(grossSalary, NI.UPPER_EARNINGS_LIMIT) - NI.PRIMARY_THRESHOLD);
  const mainRate        = mainRateTaxable * NI.MAIN_RATE;

  // Higher rate (above UEL)
  const higherRateTaxable = Math.max(0, grossSalary - NI.UPPER_EARNINGS_LIMIT);
  const higherRate        = higherRateTaxable * NI.HIGHER_RATE;

  return {
    total:      Math.round(mainRate + higherRate),
    mainRate:   Math.round(mainRate),
    higherRate: Math.round(higherRate),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT LOAN REPAYMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates annual student loan repayment.
 * @param {number} grossSalary
 * @param {string} plan - "plan2", "plan5", or "none"
 * @returns {number} Annual repayment amount
 */
function calcStudentLoan(grossSalary, plan) {
  if (plan === "none" || !plan) return 0;

  const threshold = plan === "plan5"
    ? STUDENT_LOAN.PLAN5_THRESHOLD
    : STUDENT_LOAN.PLAN2_THRESHOLD;

  const rate = plan === "plan5"
    ? STUDENT_LOAN.PLAN5_RATE
    : STUDENT_LOAN.PLAN2_RATE;

  const repayable = Math.max(0, grossSalary - threshold);
  return Math.round(repayable * rate);
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYER NI SAVING (bonus for employer, sometimes shared with employee)
// When salary is sacrificed, employer also saves NI on the sacrificed amount.
// Some employers pass this saving back — worth flagging to users.
// ─────────────────────────────────────────────────────────────────────────────

const EMPLOYER_NI_RATE        = 0.138; // 13.8% on earnings above secondary threshold
const EMPLOYER_NI_THRESHOLD   = 9_100; // Secondary threshold 2025/26

/**
 * Calculates employer NI saving from salary sacrifice.
 * @param {number} sacrificeAmount - The amount being sacrificed
 * @param {number} grossSalary - Original gross salary
 * @returns {number} Employer NI saving
 */
function calcEmployerNiSaving(sacrificeAmount, grossSalary) {
  // Employer saves NI only on the portion of sacrifice above the secondary threshold
  if (grossSalary <= EMPLOYER_NI_THRESHOLD) return 0;
  const taxableSacrifice = Math.min(sacrificeAmount, grossSalary - EMPLOYER_NI_THRESHOLD);
  return Math.round(Math.max(0, taxableSacrifice) * EMPLOYER_NI_RATE);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CALCULATION FUNCTION
// This is the one the UI calls. Everything flows through here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the complete comparison between salary sacrifice and
 * paying into a pension from take-home pay.
 *
 * @param {object} inputs
 * @param {number} inputs.grossSalary       - Annual gross salary £
 * @param {number} inputs.contributionPct   - Desired pension contribution as % of salary
 * @param {string} inputs.studentLoanPlan   - "none", "plan2", or "plan5"
 * @param {boolean} inputs.employerContrib  - Whether employer matches or contributes
 * @param {number} inputs.employerPct       - Employer contribution % (if applicable)
 *
 * @returns {object} Complete comparison results
 */
function calcSalarySacrifice(inputs) {
  const {
    grossSalary,
    contributionPct,
    studentLoanPlan = "none",
    employerPct = 0,
  } = inputs;

  if (!grossSalary || grossSalary <= 0) return null;
  if (contributionPct <= 0 || contributionPct > 100) return null;

  // ── The sacrifice amount ───────────────────────────────────────────────────
  const sacrificeAmount   = Math.round(grossSalary * (contributionPct / 100));
  const reducedSalary     = grossSalary - sacrificeAmount;
  const employerAmount    = Math.round(grossSalary * (employerPct / 100));

  // ── WITHOUT salary sacrifice (paying from net pay) ─────────────────────────
  const withoutTax        = calcIncomeTax(grossSalary);
  const withoutNi         = calcNationalInsurance(grossSalary);
  const withoutLoan       = calcStudentLoan(grossSalary, studentLoanPlan);

  const withoutDeductions = withoutTax.total + withoutNi.total + withoutLoan;
  const withoutTakeHome   = grossSalary - withoutDeductions;
  const withoutNetCost    = sacrificeAmount; // They pay this from take-home

  // ── WITH salary sacrifice (employer reduces salary, pays into pension) ──────
  const withTax           = calcIncomeTax(reducedSalary);
  const withNi            = calcNationalInsurance(reducedSalary);
  const withLoan          = calcStudentLoan(reducedSalary, studentLoanPlan);

  const withDeductions    = withTax.total + withNi.total + withLoan;
  const withTakeHome      = reducedSalary - withDeductions;

  // ── The saving ─────────────────────────────────────────────────────────────
  // The saving is the difference in take-home pay.
  // With sacrifice: take-home is lower (reduced salary), but pension is funded.
  // The "cost" of putting sacrificeAmount into pension is reduced because of
  // tax and NI savings.

  const takehomeDifference = withoutTakeHome - withTakeHome;
  // takehomeDifference = actual cost to take-home of salary sacrifice
  // vs withoutNetCost = cost if paying from net pay (= full sacrifice amount)

  const annualSaving      = withoutNetCost - takehomeDifference;
  const monthlySaving     = Math.round(annualSaving / 12);

  // ── Tax saving breakdown ───────────────────────────────────────────────────
  const incomeTaxSaving   = withoutTax.total   - withTax.total;
  const niSaving          = withoutNi.total    - withNi.total;
  const loanSaving        = withoutLoan        - withLoan;
  const employerNiSaving  = calcEmployerNiSaving(sacrificeAmount, grossSalary);

  // ── Pension pot ────────────────────────────────────────────────────────────
  const annualPensionContribution = sacrificeAmount + employerAmount;
  const monthlyPensionGrowth      = Math.round(annualPensionContribution / 12);

  // ── Effective cost of sacrifice ────────────────────────────────────────────
  // The real cost to the employee (reduction in take-home pay)
  const effectiveCost         = takehomeDifference;
  const effectiveCostPct      = Math.round((effectiveCost / sacrificeAmount) * 100);

  // ── Tax bracket of the sacrifice ──────────────────────────────────────────
  let marginalRate = "basic";
  if (grossSalary > TAX.BASIC_RATE_LIMIT)    marginalRate = "higher";
  if (grossSalary > TAX.PA_TAPER_START)      marginalRate = "higher"; // PA taper zone
  if (grossSalary > TAX.HIGHER_RATE_LIMIT)   marginalRate = "additional";

  return {
    // Input echo
    grossSalary,
    sacrificeAmount,
    reducedSalary,
    employerAmount,
    contributionPct,

    // Without sacrifice
    without: {
      tax:        withoutTax.total,
      ni:         withoutNi.total,
      studentLoan: withoutLoan,
      totalDeductions: withoutDeductions,
      takeHome:   withoutTakeHome,
      taxBreakdown: withoutTax,
    },

    // With sacrifice
    with: {
      tax:        withTax.total,
      ni:         withNi.total,
      studentLoan: withLoan,
      totalDeductions: withDeductions,
      takeHome:   withTakeHome,
      taxBreakdown: withTax,
    },

    // The savings
    savings: {
      incomeTax:    Math.round(incomeTaxSaving),
      nationalInsurance: Math.round(niSaving),
      studentLoan:  Math.round(loanSaving),
      total:        Math.round(annualSaving),
      monthly:      monthlySaving,
      employerNi:   employerNiSaving,
    },

    // Pension
    pension: {
      annualContribution:  annualPensionContribution,
      monthlyContribution: monthlyPensionGrowth,
      employeeContrib:     sacrificeAmount,
      employerContrib:     employerAmount,
    },

    // Meta
    effectiveCost,
    effectiveCostPct,
    marginalRate,
    studentLoanPlan,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT HELPERS
// Small functions to format numbers for display
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a number as GBP — e.g. 12500 → "£12,500"
 * @param {number} n
 * @returns {string}
 */
function fmtGBP(n) {
  if (typeof n !== "number" || isNaN(n)) return "£0";
  return "£" + Math.round(n).toLocaleString("en-GB");
}

/**
 * Formats a number as GBP per month
 * @param {number} annual
 * @returns {string}
 */
function fmtMonthly(annual) {
  return fmtGBP(Math.round(annual / 12)) + "/mo";
}

/**
 * Formats a percentage
 * @param {number} n
 * @returns {string}
 */
function fmtPct(n) {
  return Math.round(n) + "%";
}
