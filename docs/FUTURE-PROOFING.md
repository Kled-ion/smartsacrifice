# FUTURE-PROOFING — How This Runs Itself

A plain-English map of what now happens automatically, what needs you once a year,
and the few one-off settings worth enabling so the portfolio looks after itself.

---

## What runs with ZERO intervention

These happen on a schedule via the 12 agents. You get an email **only if something
is wrong** — silence means all is well.

| Risk | Handled by | How often |
|------|-----------|-----------|
| A tax/SDLT rate silently changes | Agent 1 (Accuracy) — checks gov.uk & gov.scot | Daily |
| A page goes down or breaks | Agent 8 (Uptime) | Hourly |
| Required content disappears | Agent 2 (Site Health) | Daily |
| SEO tags / schema break | Agent 3 (SEO) | Weekly |
| An affiliate programme dies | Agent 4 (Affiliate Health) | Weekly |
| Content/dates go stale | Agent 6 (Content Freshness) | Monthly |
| Legal disclaimers vanish | Agent 7 (Legal) | Monthly |
| Internal/external links rot | Agent 11 (Broken Links) | Weekly |
| Sitemap drifts from reality | Agent 9 (Sitemap) — auto-commits the fix | Monthly |
| You forget tax-year/Budget season | Agent 12 (Seasonal) — now points to the runbook | Weekly |

Everything is aggregated into one **Weekly Digest** (Monday) so you read one summary,
not twelve.

---

## What needs you ONCE A YEAR (≈15 mins)

**Updating tax rates each April.** This is the only recurring manual task, and it's
deliberately human-approved (see "the automation boundary" below). The system makes
it trivial:

1. Agent 12 emails you ~1 week before 6 April.
2. You open **TAX-YEAR-ROLLOVER.md** — it lists every rate, every file, every line.
3. You confirm the new figures against the official sources it links, update, deploy.
4. Agent 1 confirms you got it right within 24 hours.

Most years, nearly everything is frozen until 2030/31 — so in practice you're changing
a tax-year label and maybe Scotland's band limits. Ten minutes.

---

## One-off settings worth enabling (do these once, never think again)

1. **Domain auto-renew at Namecheap** — turn this ON for both domains.
   Agent 10 already alerts you 60/30/14/7 days before expiry, but auto-renew means
   the domain can never lapse even if you miss every email. Belt and braces.
   *(Namecheap → Domain List → toggle Auto-Renew on each.)*

2. **Awin payment threshold** — set it low (£20) so earnings pay out promptly rather
   than sitting in Awin. One-time setting in your Awin profile.

3. **A card on file at Namecheap** — so auto-renew can actually charge. Without a
   valid card, auto-renew silently fails.

---

## The automation boundary (why rate changes stay human-approved)

You asked to minimise intervention. For monitoring, detection, and alerting, the system
is fully automatic. The one thing kept manual — *changing* a published tax rate — is a
deliberate safety decision, not a gap:

> Financial calculators are "Your Money or Your Life" content. Google holds them to the
> highest accuracy standard, and users make real money decisions on them. If an automated
> process scraped a gov.uk page that had been reworded or was mid-update, and auto-published
> a wrong rate, you could broadcast incorrect figures to thousands of people and permanently
> damage the site's trust and ranking.

So the design is: **machines detect and propose; a human approves.** The agents catch any
drift within 24 hours and tell you the exact figure and page; the runbook makes acting on
it a quick, error-proof task. That is genuinely the right balance for money content —
maximum automation everywhere it's safe, a 15-minute human checkpoint where it isn't.

---

## If you ever want to go further (optional, later)

- **Draft-PR automation:** an agent that, on detecting drift, opens a *draft* pull request
  with the proposed change pre-filled — you approve with one click instead of editing files.
  Safe (still human-approved) and even faster. Worth building once you have a few tax-year
  cycles under your belt and want to shave the 15 minutes to 2.
- **Analytics-driven content:** once Plausible is running, an agent could flag which pages
  get traffic but no affiliate clicks, so you know where to improve conversion.

Both are nice-to-haves. What you have now already runs itself for everything except the
annual, deliberately-human rate check.
