# TAX YEAR ROLLOVER RUNBOOK
### The complete, exact checklist for updating both sites each April

> **When to run this:** Agent 12 fires a reminder ~1 week before 6 April every year
> ("New Tax Year — Update All Labels"). It also fires an "Autumn Budget Watch" in
> October. When either fires, work through this document. It is the single source
> of truth for *every* place a tax figure lives.
>
> **How long it takes:** ~15 minutes with this runbook. Without it, hours of hunting.
>
> **Golden rule:** Never guess a rate. Always confirm against the official source
> linked beside each figure, then update every location listed.

---

## Step 1 — Confirm the new rates (10 mins)

Check these official pages and note any changes versus the values in the table:

| Figure | 2026/27 value | Official source |
|--------|---------------|-----------------|
| Personal Allowance | £12,570 | gov.uk/income-tax-rates |
| Basic rate limit | £50,270 (20%) | gov.uk/income-tax-rates |
| Higher rate limit | £125,140 (40%) | gov.uk/income-tax-rates |
| Additional rate | 45% above £125,140 | gov.uk/income-tax-rates |
| PA taper | £1 per £2 above £100,000 | gov.uk/income-tax-rates |
| Employee NI main | 8% (£12,570–£50,270) | gov.uk/national-insurance |
| Employee NI upper | 2% (above £50,270) | gov.uk/national-insurance |
| **Employer NI** | **15% above £5,000** | gov.uk/rates-and-thresholds-for-employers |
| Student loan Plan 2 | 9% above £29,385 | gov.uk/repaying-your-student-loan |
| Student loan Plan 5 | 9% above £25,000 | gov.uk/repaying-your-student-loan |
| **Scotland Starter** | 19% (£12,571–£16,537) | gov.scot |
| **Scotland Basic** | 20% (£16,538–£29,526) | gov.scot |
| **Scotland Intermediate** | 21% (£29,527–£43,662) | gov.scot |
| **Scotland Higher** | 42% (£43,663–£75,000) | gov.scot |
| **Scotland Advanced** | 45% (£75,001–£125,140) | gov.scot |
| **Scotland Top** | 48% (above £125,140) | gov.scot |
| SDLT standard | 0/2/5/10/12% bands | gov.uk/stamp-duty-land-tax |
| SDLT first-time buyer | 0% to £300k, 5% to £500k | gov.uk/stamp-duty-land-tax |
| SDLT additional surcharge | +5% all bands | gov.uk/stamp-duty-land-tax |

**Most figures are frozen until 2030/31** (confirmed Autumn 2025) — so most years only Scotland's Starter/Basic band limits move. If nothing changed, you're done after Step 1.

---

## Step 2 — Update the calculator engine

**File:** `smartsacrifice/js/calculator.js` — the "VERIFIED RATE TABLES" block (lines ~37–76).

This is the engine. Every number is in one clearly-marked block at the top:

```
PERSONAL_ALLOWANCE   = 12570        ← line 37
RUK_BANDS            = [...]        ← lines 43–48
SCOT_BANDS           = [...]        ← lines 52–60  (Scotland — most likely to change)
NI thresholds/rates                 ← lines 63–66
EMPLOYER_NI_RATE / THRESHOLD        ← lines 69–70
STUDENT_LOANS (plan2/plan5)         ← lines 74–76
```

Update the numbers, then update the "Last verified" date in the header comment.

---

## Step 3 — Update the agent config

**File:** `scripts/config.js` (identical copy in **both** repos).

Two sub-steps:

**3a. The `TAX_RATES` object** (lines ~140–161) — same numbers as Step 2.

**3b. The `verificationPhrases`** (lines ~172–188) — these are the exact £/% strings
the agent looks for on gov.uk. If a threshold changes, change the phrase too, or
Agent 1 will raise a (correct) alert that the rate moved. Also update `SDLT_RATES`
(lines ~197+) and the `taxYear` string (line ~141).

---

## Step 4 — Update the visible page text

These are human-readable figures in the HTML that the calculator does NOT generate.
Search each file for the OLD number and replace.

**`smartsacrifice/index.html`:**
- Hero examples: `£630/yr` and `£833/yr` (recompute if rates change — see Step 6)
- Badge / subtitle: `2026/27`
- FAQ answers: `£29,385`, `£50,270`, `15%`, `£338`, `£270`
- FAQ schema (JSON-LD in `<head>`): same figures as the FAQ answers

**`firsthomeguide/index.html`:**
- Badge / subtitle: `2026/27`
- Stats strip: `£300k`, `£10,000`
- Cost cards: `£0 – £10,000`
- FAQ schema: SDLT figures

> Tip: most of these are frozen. In a typical year you only touch the `taxYear`
> string and (if Scotland moved) the Scotland-related FAQ line.

---

## Step 5 — Let the agents confirm you

After deploying, the agents do your QA automatically:
- **Agent 1 (Accuracy)** runs daily — confirms every rate against gov.uk/gov.scot.
- **Agent 2 (Site Health)** confirms required phrases are present.

If you updated correctly, both go green within 24 hours. If you missed something,
Agent 1 emails you the exact figure and page. **The agents are your safety net —
they catch a missed update before your users do.**

---

## Step 6 — Recompute the worked examples (only if rates changed)

The hero shows two example savings. To recompute for £45,000 salary, 5% (£2,250):
- Income tax saving = £2,250 × (your marginal income tax rate)
- NI saving = £2,250 × (your NI rate at that income — 8% for basic)
- Plan 2 loan saving = £2,250 × 9% (if applicable)
- Add them. Current: £450 + £180 = **£630**; with Plan 2 loan +£202.50 = **£833**.

Or simply open the live calculator, enter £45,000 / 5%, and read the numbers off.

---

## What is deliberately NOT automated (and why)

You asked for minimal intervention. For most of this site, the agents achieve that —
they monitor, detect, and alert without you lifting a finger. But the actual *changing*
of tax rates is kept as a human-approved step **on purpose**:

> A financial calculator is "Your Money or Your Life" content in Google's eyes.
> If an automated scraper misread a gov.uk page during a redesign and auto-published
> a wrong tax rate, you could give thousands of people incorrect figures and torch
> the site's credibility (and ranking) overnight.

The safe design — which is what you have — is: **machines detect and propose, a human
approves.** The agents find drift within 24 hours and tell you exactly what changed;
this runbook makes acting on it a 15-minute job. That is the right balance of automation
and safety for money content. Do not replace it with blind auto-commit.

---

*Keep this file in both repos. Update it if the structure of the files changes.*
