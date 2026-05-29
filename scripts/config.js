/**
 * ============================================================
 * BEACON PROJECT — Master Configuration
 * ============================================================
 * File:     scripts/config.js
 * Purpose:  Single source of truth for the entire agent system.
 *           Every value used by any agent lives here.
 *           No agent file may hardcode any URL, threshold,
 *           rate, phrase, or setting. Change here, affects all.
 *
 * Sections:
 *   SITES          — Site definitions, pages, SEO keywords
 *   TAX_RATES      — HMRC 2026/27 verified rates
 *   SDLT_RATES     — HMRC SDLT verified rates
 *   AFFILIATES     — Partner URLs and commission info
 *   COMPETITORS    — Competitor pages and monitoring config
 *   OFFICIAL_LINKS — External links to verify monthly
 *   SEASONAL       — Content calendar triggers by month
 *   DOMAINS        — Domain expiry dates for renewal alerts
 *   THRESHOLDS     — Alert thresholds and timing
 *   OUTPUT         — Reporting format and severity levels
 *
 * Owner:    Kleds (Kled-ion on GitHub)
 * Verified: 19 May 2026
 * ============================================================
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// SITES
// Every page, phrase, and keyword for both sites
// ─────────────────────────────────────────────────────────────────────────────

const SITES = {

  smartSacrifice: {
    name:       "Smart Sacrifice",
    domain:     "smartsacrifice.co.uk",
    baseUrl:    "https://www.smartsacrifice.co.uk",
    githubRepo: "Kled-ion/smartsacrifice",
    taxYear:    "2026/27",

    pages: [
      { path: "/",             name: "Homepage",       critical: true  },
      { path: "/about.html",   name: "About",          critical: true  },
      { path: "/privacy.html", name: "Privacy Policy", critical: true  },
      { path: "/sitemap.xml",  name: "Sitemap",        critical: false },
      { path: "/robots.txt",   name: "Robots",         critical: false },
    ],

    // Phrases that MUST appear on the homepage
    requiredPhrases: [
      "Salary Sacrifice Calculator",
      "2026/27",
      "not constitute regulated financial advice",
      "Capital at risk",
      "Sponsored",
      "not FCA-authorised",
    ],

    // Phrases that must NEVER appear (placeholders, wrong domains, stale labels)
    forbiddenPhrases: [
      "YOUR_AWIN_ID",
      "2025/26 Tax Year",
      "Updated April 2025",
      "PLACEHOLDER",
    ],

    // Keywords to track in Google Search Console
    seoKeywords: [
      "salary sacrifice calculator uk",
      "salary sacrifice pension 2026",
      "salary sacrifice NI saving",
      "salary sacrifice calculator 2026/27",
      "how much do I save salary sacrifice",
      "salary sacrifice vs personal pension",
    ],

    // Affiliate partners for this site
    affiliatePartners: ["pensionbee", "nutmeg", "vanguard"],
  },

  ukFirstHomeGuide: {
    name:       "UK First Home Guide",
    domain:     "ukfirsthomeguide.co.uk",
    baseUrl:    "https://www.ukfirsthomeguide.co.uk",
    githubRepo: "Kled-ion/ukfirsthomeguide",

    pages: [
      { path: "/",                                name: "Homepage",           critical: true  },
      { path: "/stamp-duty-calculator.html",      name: "SDLT Calculator",    critical: true  },
      { path: "/first-time-buyer-guide.html",     name: "FTB Guide",          critical: false },
      { path: "/mortgage-deposit-guide.html",     name: "Deposit Guide",      critical: false },
      { path: "/conveyancing-guide.html",         name: "Conveyancing Guide", critical: false },
      { path: "/shared-ownership-guide.html",     name: "Shared Ownership",   critical: false },
      { path: "/first-time-buyer-checklist.html", name: "FTB Checklist",      critical: false },
      { path: "/about.html",                      name: "About",              critical: true  },
      { path: "/privacy.html",                    name: "Privacy Policy",     critical: true  },
      { path: "/sitemap.xml",                     name: "Sitemap",            critical: false },
      { path: "/robots.txt",                      name: "Robots",             critical: false },
    ],

    requiredPhrases: [
      "Stamp Duty",
      "First-Time Buyer",
      "2026",
      "not constitute financial advice",
      "Sponsored",
      "ukfirsthomeguide.co.uk",
    ],

    forbiddenPhrases: [
      "YOUR_AWIN_ID",
      "ukukfirsthomeguide.co.uk",
      "www.firsthomeguide.co.uk",
      "PLACEHOLDER",
    ],

    seoKeywords: [
      "stamp duty calculator 2026",
      "first time buyer stamp duty 2026",
      "how much deposit first time buyer uk",
      "conveyancing uk 2026",
      "shared ownership pros cons uk",
      "first time buyer checklist uk",
    ],

    affiliatePartners: ["habito", "landc", "reallymoving"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TAX RATES
// HMRC 2026/27 verified values — Agent 1 checks these daily
// Source: https://www.gov.uk/income-tax-rates
// Last verified: 19 May 2026
// ─────────────────────────────────────────────────────────────────────────────

const TAX_RATES = {
  taxYear:              "2026/27",
  personalAllowance:    12_570,   // £12,570 — no tax below this
  basicRateLimit:       50_270,   // 20% on income up to this
  higherRateLimit:     125_140,   // 40% on income up to this
  paTaperStart:        100_000,   // PA reduces by £1 per £2 above this
  basicRate:             0.20,
  higherRate:            0.40,
  additionalRate:        0.45,

  // National Insurance (Employee)
  niPrimaryThreshold:   12_570,   // No NI below this
  niUpperEarningsLimit: 50_270,   // Higher rate above this
  niMainRate:            0.08,    // 8% between thresholds
  niHigherRate:          0.02,    // 2% above upper limit
  employerNiRate:        0.15,    // 15% employer contribution (raised from 13.8% Apr 2025)
  employerNiThreshold:   5_000,   // Employer NI secondary threshold (reduced from £9,100 Apr 2025)

  // Student Loans
  plan2Threshold:       29_385,   // Plan 2 — 9% above this (2026/27)
  plan5Threshold:       25_000,   // Plan 5 — 9% above this
  studentLoanRate:       0.09,    // 9% repayment rate

  // Official source URLs for verification
  sources: {
    incomeTax:         "https://www.gov.uk/income-tax-rates",
    nationalInsurance: "https://www.gov.uk/national-insurance/how-much-you-pay",
    studentLoans:      "https://www.gov.uk/repaying-your-student-loan",
    employerNI:        "https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027",
  },

  // Phrases that must appear on each source page to confirm rates unchanged
  // If any disappear, rates may have changed — flag for human verification
  verificationPhrases: {
    incomeTax: [
      { phrase: "£12,570",    label: "Personal Allowance",    severity: "RED"   },
      { phrase: "£50,270",    label: "Basic Rate Limit",      severity: "RED"   },
      { phrase: "£125,140",   label: "Higher Rate Limit",     severity: "RED"   },
      { phrase: "20%",        label: "Basic Rate",            severity: "RED"   },
      { phrase: "40%",        label: "Higher Rate",           severity: "RED"   },
    ],
    nationalInsurance: [
      { phrase: "£12,570",    label: "NI Primary Threshold",  severity: "RED"   },
      { phrase: "8%",         label: "NI Main Rate",          severity: "RED"   },
    ],
    studentLoans: [
      { phrase: "£29,385",    label: "Plan 2 Threshold",      severity: "AMBER" },
    ],
    employerNI: [
      { phrase: "15%",        label: "Employer NI Rate",      severity: "AMBER" },
      { phrase: "5,000",      label: "Employer NI Threshold",  severity: "AMBER" },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SDLT RATES
// HMRC verified — Agent 1 checks these daily
// Source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates
// Last verified: 19 May 2026
// ─────────────────────────────────────────────────────────────────────────────

const SDLT_RATES = {
  sources: {
    overview: "https://www.gov.uk/stamp-duty-land-tax",
    rates:    "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates",
  },

  // Standard residential bands
  standardBands: [
    { from: 0,         to: 125_000,    rate: 0.00, label: "Nil rate"     },
    { from: 125_001,   to: 250_000,    rate: 0.02, label: "2% band"      },
    { from: 250_001,   to: 925_000,    rate: 0.05, label: "5% band"      },
    { from: 925_001,   to: 1_500_000,  rate: 0.10, label: "10% band"     },
    { from: 1_500_001, to: Infinity,   rate: 0.12, label: "12% band"     },
  ],

  // First-time buyer relief
  ftb: {
    nilRateThreshold:  300_000,   // 0% up to this
    maxReliefLimit:    500_000,   // Relief lost above this
    rateAboveNilBand:   0.05,    // 5% on £300k–£500k
  },

  // Additional property surcharge
  additionalSurcharge: 0.05,     // 5% on top of standard rates
  nonResidentSurcharge: 0.02,    // 2% for non-UK residents

  verificationPhrases: [
    { phrase: "£125,000",    label: "Standard nil-rate threshold",    severity: "RED" },
    { phrase: "£300,000",    label: "FTB nil-rate threshold",         severity: "RED" },
    { phrase: "£500,000",    label: "FTB max relief limit",           severity: "RED" },
    { phrase: "5%",          label: "Additional surcharge rate",      severity: "RED" },
    { phrase: "first-time",  label: "FTB relief still exists",        severity: "RED" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// AFFILIATE PARTNERS
// Partner details — URLs, fee structures, Awin programme info
// ─────────────────────────────────────────────────────────────────────────────

const AFFILIATE_PARTNERS = {
  pensionbee: {
    name:         "PensionBee",
    site:         "smartSacrifice",
    homepage:     "https://www.pensionbee.com",
    feePageUrl:   "https://www.pensionbee.com/pension-plans",
    // Current fees — Agent 4 checks these are still accurate
    currentFees:  "From 0.50%/yr",
    feePhrase:    "0.50",          // If this disappears from their page — flag
    checkPhrase:  "pension",
    regulated:    true,
    regulatorUrl: "https://register.fca.org.uk",
  },
  nutmeg: {
    name:         "Nutmeg",
    site:         "smartSacrifice",
    homepage:     "https://www.nutmeg.com",
    feePageUrl:   "https://www.nutmeg.com/fees",
    currentFees:  "From 0.25%/yr",
    feePhrase:    "0.25",
    checkPhrase:  "investment",
    regulated:    true,
    regulatorUrl: "https://register.fca.org.uk",
  },
  vanguard: {
    name:         "Vanguard UK",
    site:         "smartSacrifice",
    homepage:     "https://www.vanguardinvestor.co.uk",
    feePageUrl:   "https://www.vanguardinvestor.co.uk/what-we-offer/fees-explained",
    currentFees:  "From 0.15%/yr",
    feePhrase:    "0.15",
    checkPhrase:  "invest",
    regulated:    true,
    regulatorUrl: "https://register.fca.org.uk",
  },
  habito: {
    name:         "Habito",
    site:         "ukFirstHomeGuide",
    homepage:     "https://www.habito.com",
    feePageUrl:   "https://www.habito.com/how-it-works",
    currentFees:  "Free to use",
    feePhrase:    "free",
    checkPhrase:  "mortgage",
    regulated:    true,
    regulatorUrl: "https://register.fca.org.uk",
  },
  landc: {
    name:         "L&C Mortgages",
    site:         "ukFirstHomeGuide",
    homepage:     "https://www.landc.co.uk",
    feePageUrl:   "https://www.landc.co.uk/help/faqs/",
    currentFees:  "Fee-free",
    feePhrase:    "fee",
    checkPhrase:  "mortgage",
    regulated:    true,
    regulatorUrl: "https://register.fca.org.uk",
  },
  reallymoving: {
    name:         "Reallymoving",
    site:         "ukFirstHomeGuide",
    homepage:     "https://www.reallymoving.com",
    feePageUrl:   "https://www.reallymoving.com/conveyancing",
    currentFees:  "Free quotes",
    feePhrase:    "quote",
    checkPhrase:  "conveyancing",
    regulated:    false,
    regulatorUrl: null,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPETITORS
// Competitor pages and monitoring configuration
// ─────────────────────────────────────────────────────────────────────────────

const COMPETITORS = {
  moneySavingExpert: {
    name:          "MoneySavingExpert",
    salaryPage:    "https://www.moneysavingexpert.com/savings/salary-sacrifice/",
    ftbPage:       "https://www.moneysavingexpert.com/mortgages/first-time-buyer-guide/",
    rssUrl:        "https://www.moneysavingexpert.com/feed/",
  },
  moneySupermarket: {
    name:          "MoneySupermarket",
    sdltPage:      "https://www.moneysupermarket.com/mortgages/stamp-duty-calculator/",
    rssUrl:        null,
  },
  which: {
    name:          "Which?",
    ftbPage:       "https://www.which.co.uk/money/mortgages-and-property/first-time-buyers",
    rssUrl:        "https://www.which.co.uk/news/rss",
  },
  hmrcNews: {
    name:          "HMRC News",
    rssUrl:        "https://www.gov.uk/government/organisations/hm-revenue-customs.atom",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL EXTERNAL LINKS
// Links referenced in our content — verified monthly by Agent 6
// ─────────────────────────────────────────────────────────────────────────────

const OFFICIAL_LINKS = [
  { url: "https://www.gov.uk/income-tax-rates",                               name: "HMRC income tax rates"     },
  { url: "https://www.gov.uk/stamp-duty-land-tax",                            name: "HMRC SDLT overview"         },
  { url: "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates", name: "HMRC SDLT rates"           },
  { url: "https://www.gov.uk/lifetime-isa",                                   name: "HMRC Lifetime ISA"          },
  { url: "https://www.gov.uk/repaying-your-student-loan",                     name: "HMRC student loans"         },
  { url: "https://www.gov.uk/national-insurance/how-much-you-pay",            name: "HMRC NI rates"              },
  { url: "https://ico.org.uk",                                                name: "ICO data regulator"         },
  { url: "https://www.fca.org.uk",                                            name: "FCA financial regulator"    },
  { url: "https://register.fca.org.uk",                                       name: "FCA register"               },
  { url: "https://www.sra.org.uk/consumers/register/",                        name: "SRA solicitor register"     },
  { url: "https://www.unbiased.co.uk",                                        name: "Unbiased IFA finder"        },
  { url: "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate", name: "BoE base rate"  },
  { url: "https://www.rics.org",                                              name: "RICS surveyor register"     },
  { url: "https://www.clc-uk.org/consumers/find-a-conveyancer/",             name: "CLC conveyancer register"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEASONAL CONTENT CALENDAR
// Triggers by month — Agent 12 raises content opportunities proactively
// ─────────────────────────────────────────────────────────────────────────────

const SEASONAL_CALENDAR = [
  {
    months:      [3],              // March
    weeksOut:    4,                // Flag 4 weeks before
    title:       "Tax Year End — Salary Sacrifice",
    description: "Publish 'Last chance to maximise salary sacrifice before 5 April' content",
    site:        "smartSacrifice",
    priority:    "HIGH",
  },
  {
    months:      [4],              // April
    weeksOut:    1,
    title:       "New Tax Year — Update All Labels",
    description: "Review all 2026/27 labels. Update tax year references across both sites.",
    site:        "both",
    priority:    "HIGH",
  },
  {
    months:      [10],             // October
    weeksOut:    2,
    title:       "Autumn Budget Watch",
    description: "Monitor for stamp duty, pension, or SDLT changes in Budget. Prepare update articles.",
    site:        "both",
    priority:    "HIGH",
  },
  {
    months:      [11, 12],         // November/December
    weeksOut:    4,
    title:       "Year-End Tax Planning",
    description: "Publish 'End of year pension planning' content for Smart Sacrifice",
    site:        "smartSacrifice",
    priority:    "MEDIUM",
  },
  {
    months:      [1],              // January
    weeksOut:    1,
    title:       "New Year First-Time Buyers",
    description: "Publish 'New year, new home — your 2027 buying guide' for FHG",
    site:        "ukFirstHomeGuide",
    priority:    "MEDIUM",
  },
  {
    months:      [3],
    weeksOut:    4,
    title:       "Lifetime ISA Deadline",
    description: "Flag: LISA contributions before 5 April maximise the government bonus",
    site:        "ukFirstHomeGuide",
    priority:    "MEDIUM",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DOMAINS
// Expiry dates for renewal monitoring — Agent 10 alerts 60 and 30 days out
// ─────────────────────────────────────────────────────────────────────────────

const DOMAINS = [
  {
    domain:         "smartsacrifice.co.uk",
    registrar:      "Namecheap",
    expiryDate:     "2027-05-19",     // Update this if renewal date differs
    renewalUrl:     "https://ap.www.namecheap.com/domains/list/",
    alertDays:      [60, 30, 14, 7],  // Flag at these thresholds
  },
  {
    domain:         "ukfirsthomeguide.co.uk",
    registrar:      "Namecheap",
    expiryDate:     "2027-05-19",     // Update this if renewal date differs
    renewalUrl:     "https://ap.www.namecheap.com/domains/list/",
    alertDays:      [60, 30, 14, 7],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// THRESHOLDS
// Alert thresholds, timing, and limits used across all agents
// ─────────────────────────────────────────────────────────────────────────────

const THRESHOLDS = {
  // HTTP
  requestTimeoutMs:        10_000,   // 10 second timeout on all requests
  maxRedirects:            5,        // Max redirect hops before failing
  hourlyUptimeTimeoutMs:   5_000,    // Faster timeout for uptime pings

  // Performance
  minPagespeedScore:       80,       // Flag pages scoring below this (0-100)
  maxPageLoadMs:           3_000,    // Flag pages taking longer than this

  // Content freshness
  contentDecayMonths:      11,       // Flag pages not updated within this many months

  // Revenue
  hmrcSelfAssessmentAlert: 800,      // Flag when Awin earnings approach this (£) — warn before £1,000 threshold

  // Uptime
  uptimeCheckIntervalMins: 60,       // How often hourly ping runs

  // Verification
  verifyAttempts:          2,        // How many times to re-check a finding before reporting
  verifyDelayMs:           2_000,    // Delay between verification attempts

  // Email digest
  digestDay:               1,        // 1 = Monday
  digestHourUTC:           8,        // 8am UTC = 9am UK summer
};

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT FORMAT
// Severity levels and reporting structure — consistent across all agents
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY = {
  RED:   { label: "🔴 RED",   prefix: "Action required today",       exitCode: 1 },
  AMBER: { label: "🟠 AMBER", prefix: "Action required this week",   exitCode: 0 },
  INFO:  { label: "🟡 INFO",  prefix: "For your awareness",          exitCode: 0 },
  GREEN: { label: "✅ GREEN", prefix: "All clear",                   exitCode: 0 },
};

const CONFIDENCE = {
  HIGH:   { label: "HIGH",   description: "Confirmed in 2+ independent checks — act on this"  },
  MEDIUM: { label: "MEDIUM", description: "Confirmed once — review before acting"              },
  LOW:    { label: "LOW",    description: "Single signal only — informational, do not escalate as RED" },
};

// ─────────────────────────────────────────────────────────────────────────────
// STALE CONTENT PHRASES
// Used by Agent 6 to detect outdated content across all HTML files
// ─────────────────────────────────────────────────────────────────────────────

const STALE_PHRASES = [
  { find: "2025/26 Tax Year",    replace: "2026/27 Tax Year",   severity: "AMBER" },
  { find: "tax year 2025/26",    replace: "tax year 2026/27",   severity: "AMBER" },
  { find: "Updated April 2025",  replace: "Updated May 2026",   severity: "AMBER" },
  { find: "updated april 2025",  replace: "Updated May 2026",   severity: "AMBER" },
  { find: "rates for 2025/26",   replace: "rates for 2026/27",  severity: "AMBER" },
  { find: "HMRC 2025/26 rates",  replace: "HMRC 2026/27 rates", severity: "AMBER" },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL CHECKS
// Required compliance phrases — Agent 7 verifies these monthly
// ─────────────────────────────────────────────────────────────────────────────

const LEGAL_CHECKS = [
  { name: "SS — Financial disclaimer",   url: `${SITES.smartSacrifice.baseUrl}/`,         phrases: ["not constitute regulated financial advice", "not FCA-authorised"], severity: "RED",   reason: "FCA perimeter" },
  { name: "SS — Capital at risk",        url: `${SITES.smartSacrifice.baseUrl}/`,         phrases: ["Capital at risk"],                                               severity: "RED",   reason: "FCA guidance for investment products" },
  { name: "FHG — Financial disclaimer",  url: `${SITES.ukFirstHomeGuide.baseUrl}/`,       phrases: ["not constitute financial advice"],                               severity: "RED",   reason: "FCA perimeter" },
  { name: "SS — Affiliate disclosure",   url: `${SITES.smartSacrifice.baseUrl}/`,         phrases: ["Sponsored", "We may earn a commission"],                        severity: "RED",   reason: "UK Consumer Rights Act + Awin T&Cs" },
  { name: "FHG — Affiliate disclosure",  url: `${SITES.ukFirstHomeGuide.baseUrl}/`,       phrases: ["Sponsored", "We may earn a commission"],                        severity: "RED",   reason: "UK Consumer Rights Act + Awin T&Cs" },
  { name: "SS — Privacy accessible",     url: `${SITES.smartSacrifice.baseUrl}/privacy.html`, phrases: ["UK GDPR", "ICO", "personal data"],                          severity: "RED",   reason: "UK GDPR Article 13" },
  { name: "FHG — Privacy accessible",    url: `${SITES.ukFirstHomeGuide.baseUrl}/privacy.html`, phrases: ["UK GDPR", "ICO", "personal data"],                        severity: "RED",   reason: "UK GDPR Article 13" },
  { name: "SS — About with disclosure",  url: `${SITES.smartSacrifice.baseUrl}/about.html`, phrases: ["affiliate", "commission", "not FCA-authorised"],              severity: "RED",   reason: "Awin publisher requirements" },
  { name: "FHG — About with disclosure", url: `${SITES.ukFirstHomeGuide.baseUrl}/about.html`, phrases: ["affiliate", "commission"],                                  severity: "RED",   reason: "Awin publisher requirements" },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// All values exported — agents import only what they need
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  SITES,
  TAX_RATES,
  SDLT_RATES,
  AFFILIATE_PARTNERS,
  COMPETITORS,
  OFFICIAL_LINKS,
  SEASONAL_CALENDAR,
  DOMAINS,
  THRESHOLDS,
  SEVERITY,
  CONFIDENCE,
  STALE_PHRASES,
  LEGAL_CHECKS,
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT REGISTRY
// Complete list of all agents — weekly-digest imports this
// ─────────────────────────────────────────────────────────────────────────────

const AGENTS = [
  { id: 1,  name: "Accuracy Watchdog",     file: "agent-1-accuracy.js",  schedule: "daily"   },
  { id: 2,  name: "Site Health Monitor",   file: "agent-2-health.js",    schedule: "daily"   },
  { id: 3,  name: "SEO Monitor",           file: "agent-3-seo.js",       schedule: "weekly"  },
  { id: 4,  name: "Affiliate Health",      file: "agent-4-affiliate.js", schedule: "weekly"  },
  { id: 5,  name: "Competitor Monitor",    file: "agent-5-competitor.js",schedule: "weekly"  },
  { id: 6,  name: "Content Freshness",     file: "agent-6-freshness.js", schedule: "monthly" },
  { id: 7,  name: "Legal Compliance",      file: "agent-7-legal.js",     schedule: "monthly" },
  { id: 8,  name: "Uptime Monitor",        file: "agent-8-uptime.js",    schedule: "hourly"  },
  { id: 9,  name: "Sitemap Generator",     file: "agent-9-sitemap.js",   schedule: "monthly" },
  { id: 10, name: "Domain Renewal",        file: "agent-10-domains.js",  schedule: "monthly" },
  { id: 11, name: "Broken Link Crawler",   file: "agent-11-links.js",    schedule: "weekly"  },
  { id: 12, name: "Seasonal Calendar",     file: "agent-12-seasonal.js", schedule: "weekly"  },
];

// Add to exports
Object.assign(module.exports, { AGENTS });
