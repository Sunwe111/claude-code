# Quick-Resale Variable-Debt Tracker — Build Brief

You are building a data pipeline and website that tracks homes listed for sale that were bought recently, and how many of them carry variable-rate debt. Start with one California county, then all of California, then all 50 states. Work strictly phase by phase. The owner of this project may not be a professional developer: explain choices in plain English, keep the stack simple, and write a short PROGRESS.md entry at the end of every session. Save this brief as BRIEF.md in the project folder.

## Goal and definitions

The question: are recently bought homes coming back on the market more often when the owner carries an adjustable-rate mortgage (ARM) or a variable-rate HELOC? The site answers it with counts, shares and a fair baseline, updated weekly.

Use these definitions everywhere. Put them in config/definitions.yaml so they can be changed without code edits.

- Active listing: a home currently listed for sale (single-family, condo, townhome; 1 to 4 units). Snapshot taken weekly.
- Prior purchase: the most recent arm's-length sale deed recorded for the parcel. Lookback window 36 months; also report 12 and 24.
- Quick resale: an active listing whose prior purchase falls inside the lookback window.
- Open lien: a mortgage, deed of trust or HELOC recorded on or after the prior purchase, with no recorded reconveyance or satisfaction. Reconveyances can lag weeks to months; flag liens under 90 days old as "possibly closed".
- Variable-rate debt: an open lien classified as ARM or variable HELOC (Phase 2). "Unknown" stays unknown, never counted as fixed.
- Baseline share: the variable-rate share among comparable buyers who are not reselling (Phase 3). Same county, same purchase years.
- Lift: quick-resale variable share divided by baseline share, shown with a confidence interval.

Exclude these, and count them separately so the numbers stay honest:
- New-construction sales from builders
- Foreclosures, REO and short sales
- Non-arm's-length transfers: quitclaims, intrafamily, $0 or nominal transfers, trust transfers
- Investor flips: buyer is an LLC, corporation or trust and the hold is under 12 months (tracked as their own category)

Report ARM first liens and HELOCs as SEPARATE figures. Almost all HELOCs are variable by design, so a HELOC alone is a weak signal. The stronger signal is an ARM first lien, or a large HELOC taken soon after purchase.

## Ground rules

Follow these in every phase. If a rule blocks progress, stop and ask instead of working around it.

Checkpoints
- At each CHECKPOINT, stop. Summarize what was built, what it cost, what looks wrong, and the decision you need. Wait for a reply.
- Never sign up for a service, start a paid plan or a trial, or spend money. Tell the owner what to sign up for and why; they paste keys into .env (never commit it).

Data access
- licensed bulk files, or downloads a county offers for that purpose.
- County websites: automate only if their terms allow it. Keep requests slow (one every few seconds) and identify the tool in the User-Agent.
- Record every source's license terms in docs/LICENSES.md, especially whether the data may be SHOWN ON A PUBLIC WEBSITE. Some property-data APIs are licensed for the subscriber's own use only. If public display is not clearly allowed, the public site shows only derived aggregates until the owner gets written confirmation from the vendor.

Cost control
- Cache every API response on disk, keyed by request, so re-runs cost nothing.
- Log calls and estimated cost per run in a runs table. Read a monthly budget cap from config/budget.yaml and halt the run when 80% is used.
- Before any bulk pull, estimate the call count and cost, and ask.

Privacy
- Suppress any public figure built on fewer than 10 properties.
- Property-level detail lives only in a password-protected private view for the owner's research.
- Add a plain disclaimer: research only, not financial or legal advice, data may be incomplete.

Code quality
- Python 3.12, small modules, type hints, pytest tests for every rule that decides a label.
- Every pipeline step can be re-run without duplicating rows.
- Keep raw provider fields alongside derived fields, so any label can be traced to its evidence.

## Phase 0: Verify the data sources

Everything depends on one hard fact: which source reliably says whether a recorded loan is adjustable. Prove that before writing pipeline code.

Starting candidates. Verify each one; do not assume this list is current.
- PropertyRadar (developers.propertyradar.com): owners, sale history, current loans, loan criteria including ARM resets and HELOCs, for-sale flags. Began in California and now claims all 50 states; API included in paid plans. WATCH OUT: its API terms say it is for end users and not for building apps sold to others. Confirm whether a public site is allowed.
- ATTOM (attomdata.com): national sales, deeds, mortgage history, assessor data; 30-day trial token. Check whether its mortgage records include a rate-type field and how often that field is filled in California. Enterprise-style pricing.
- RentCast (developers.rentcast.io): active sale listings (/listings/sale), property records with sale history, query by last sale date. Probably no loan-type data; use it for listings only.
- County recorder/assessor (pilot county): grantor-grantee index, document types, sometimes document images. Ground truth for spot checks. California recorders differ widely; many sell index or image data by subscription or through aggregators such as ParcelQuest.
- HMDA public data (CFPB/FFIEC): loan-level originations by census tract, including the ARM introductory rate period and an open-end (HELOC) flag. Free and official, which makes it the baseline for how common ARMs are. It is anonymous (no address or parcel), so use it for the baseline only; never match it to a property.
- US Census Geocoder (geocoding.geo.census.gov): address to census tract, free; joins properties to HMDA tracts.

Tasks
1. For each source, read the current docs and pricing pages and fill in docs/DATA_SOURCES.md: CA coverage, fields available, refresh frequency, API or bulk, price, and public-display license terms.
2. List the exact field names that carry loan type, rate type, lien position, loan amount, lender, and reconveyance or release.
3. Propose three pilot counties, with a one-line reason each. Favor high sales volume, good coverage from the chosen provider, and a mix of price levels (high-priced coastal counties tend to have more jumbo ARMs).
4. Using the owner's trial keys, pull 20 known properties in the pilot county and compare the provider's loan type with the recorded documents. The owner can check by hand on the county site.

CHECKPOINT 0: present the recommended source stack, expected monthly cost, the 20-property accuracy result, the license answer for public display, and the pilot county pick. Wait for approval and keys.

## Phase 1: Pilot pipeline for one California county

Output: one CSV and one summary report for the pilot county, produced by one command: python -m tracker run --county <FIPS>

1. Snapshot listings. Pull all active sale listings for the county. Store each snapshot with its date, so the system knows when a home was listed, relisted or removed.
2. Resolve to parcel. Normalize each address and resolve it to the county parcel number (APN). APN plus county FIPS is the join key everywhere. Log listings that fail to match and report the match rate.
3. Pull sale history. For each APN, get recorded deeds: recording date, document type, price if available, and buyer and seller type (person, LLC, trust, builder, bank).
4. Find the prior purchase. Pick the most recent arm's-length purchase and apply the exclusions. Tag each listing as quick resale or not, for each window (12, 24, 36 months).
5. Pull liens. For quick resales, get every mortgage, deed of trust and HELOC recorded since that purchase, plus any reconveyance or release. Mark each lien open or closed.
6. Classify each open lien with the Phase 2 rules.
7. Geocode each property to its census tract for the Phase 3 baseline.
8. Report. Write out/<county>_<date>.csv (one row per listing) and out/<county>_<date>_summary.md with: listings, match rate, quick resales by window, share with variable-rate debt split into ARM and HELOC, share unknown, and months since purchase.

CHECKPOINT 1: show the summary. Give the owner 10 random quick resales with the evidence behind each label, so they can check them against county records. Fix whatever they find before scaling.

## Phase 2: Classify each loan

Every open lien gets a label, a confidence level and its evidence. Labels: fixed, arm, heloc_variable, other_variable, unknown.

Use evidence in this order and stop at the first source that decides:
1. Provider rate-type field. Use it directly and store the raw value. Confidence high.
2. Document type. Titles such as "Credit Line Deed of Trust", "Home Equity Line of Credit" or "Revolving Credit" mean heloc_variable. Confidence high.
3. Document text, only if images are legitimately available. OCR the pages and look for: "Adjustable Rate Rider", "Adjustable Rate Note", an index name (SOFR, Prime, Treasury, LIBOR), "Interest Rate Change Date", "maximum credit" or "line of credit". Store the matched phrase and page number. Confidence medium, unless the rider is explicit.
4. Heuristics. A second lien from a bank, recorded within a year of purchase, for a round amount, is often a HELOC. Confidence low. Low-confidence labels never feed the headline numbers; they appear only as a sensitivity range.

Rules
- unknown is never treated as fixed. Every public figure shows the unknown share next to it.
- Build a labeled test set of 50 liens verified by the owner. Require at least 90% agreement on high-confidence labels before Phase 6.
- Each rule gets a pytest case with a real (anonymized) example.

## Phase 3: Baseline comparison

A high variable-rate share among quick resales means nothing until it is compared with buyers who are not selling. Build two baselines and show both.

Baseline A, HMDA (free, official). Download HMDA public loan-level data for California for each purchase year in the window. Filter to originated, home-purchase, first-lien, owner-occupied, 1 to 4 unit loans. A loan with an introductory rate period counts as an ARM; open-end lines count as HELOCs. Verify the current field names in the HMDA data dictionary before coding (for example action_taken, loan_purpose, lien_status, occupancy_type, intro_rate_period, open-end_line_of_credit, census_tract). Compute ARM share by county, tract and year.

Baseline B, same data source. From the provider, take every home in the pilot county bought in the same window that is NOT listed for sale, and classify its liens with the same Phase 2 rules. This is the closest like-for-like comparison, because both groups share the same data quirks.

Report for each window and county:
- Quick-resale ARM share and HELOC share, each with a Wilson 95% confidence interval
- Baseline A and Baseline B shares
- Lift against each baseline
- A plain-English verdict that refuses to claim a difference when the intervals overlap

CHECKPOINT 3: show the comparison. This is where the owner learns whether the pattern holds up.

## Phase 4: Database and weekly schedule

Use SQLite for the pilot and move to PostgreSQL before Phase 6. Keep the schema identical, so the move is only a config change.

Tables:
- properties (one per parcel): county_fips, apn, address, lat, lon, census_tract, property_type
- listing_snapshots (one per listing per snapshot date): apn, snapshot_date, list_price, list_date, status, source_id
- transactions (one per recorded deed): apn, recording_date, doc_type, price, buyer_type, arms_length, exclusion_reason
- liens (one per recorded loan): apn, recording_date, lien_position, amount, lender, doc_type, rate_type, confidence, evidence, closed_date
- quick_resales (computed view): apn, snapshot_date, window_months, months_since_purchase, has_arm, has_heloc, unknown_count
- baselines (one per county, tract, year and source): arm_share, heloc_share, n
- runs (one per pipeline run): started_at, step, api_calls, est_cost_usd, errors

Scheduling
- One command runs the whole weekly update: python -m tracker weekly
- Schedule it with GitHub Actions or a small cloud VM. Ask the owner which they prefer.
- Re-pull sale and lien history only for parcels that are newly listed or changed. Everything else comes from cache.
- If any step fails, the run stops, the site keeps last week's data, and the owner gets an email or a GitHub issue.

## Phase 5: The website

Build a fast static public site, regenerated after each weekly run, plus a separate private view. Suggested stack: Astro (or a Next.js static export) with a charting library, hosted on Cloudflare Pages, Netlify or Vercel. Propose the simplest option and explain why.

Public pages
- Home: a California map shaded by quick-resale variable-rate share, the last-updated date, and the headline lift against baseline.
- County page: weekly trend line of quick resales and their ARM and HELOC shares, the baseline as a reference line, a months-since-purchase breakdown, and the unknown share.
- ZIP view: the same figures, wherever at least 10 properties back each number.
- Methodology: every definition, exclusion and baseline in plain English, with known gaps.
- Sources and credits: every data source, with the attribution its license requires.
- A disclaimer on every page.

Private view (password-protected, never indexed by search engines)
- Property-level table: address, purchase date, months held, and the lien list with labels, confidence and evidence snippet. Filters and CSV export.
- Review queue for unknown and low-confidence liens, with buttons to confirm a label. Confirmed labels feed the Phase 2 test set.

CHECKPOINT 5: show a preview link. Confirm the Phase 0 license question is settled before anything goes public.

## Phase 6: All of California, then the other states

Expand only after the pilot passes the Phase 2 accuracy bar. Everything geographic comes from config: config/regions/<state>.yaml lists counties, providers and local quirks.

California (58 counties)
1. Build a per-county coverage table from the provider's coverage data: recorder data start date, listing availability, and loan-type fill rate.
2. Add counties in batches of about 10, largest first. Estimate the cost before each batch and ask.
3. Mark counties with weak coverage as "insufficient data" instead of publishing shaky numbers.

Other states
- Run the same coverage check per state before adding it.
- Non-disclosure states (verify the current list; it includes Texas, Utah, Idaho, Wyoming, New Mexico and others) do not record sale prices publicly. Sale dates are still recorded, so quick-resale detection works, but price-based figures do not.
- Mortgage states and deed-of-trust states use different names ("satisfaction" vs "reconveyance", "mortgage" vs "deed of trust"). Map document types per state in config.
- Suggested order after California: other high-price Western states (Washington, Oregon, Nevada, Arizona, Colorado), then the rest by listing volume. Re-plan with the owner after each state.

CHECKPOINT 6 (before each new state): coverage table, cost estimate, and a go or no-go.

## Repo layout

```
tracker/
  BRIEF.md            this brief
  PROGRESS.md         session log
  .env                API keys (never committed)
  config/             definitions.yaml, budget.yaml, regions/<state>.yaml
  docs/               DATA_SOURCES.md, LICENSES.md, METHODOLOGY.md
  tracker/
    sources/          one module per provider, with caching
    pipeline/         listings, parcels, transactions, liens, classify, baseline
    db/               schema and migrations
    report/           CSV and summary output
  site/               public site and private view
  tests/              pytest, including the labeled lien set
  cache/              raw API responses (git-ignored)
```

## Costs

Hosting and HMDA data are free or close to it. The real cost is the property-data subscription. Collect current prices in Phase 0; do not rely on older published prices. Use trial periods for Phases 0 and 1 before committing to a plan.

## Done when

- Phase 0: sources, cost, license answer and pilot county approved
- Phase 1: one command produces the pilot CSV and summary; the 10-property spot check passes
- Phase 2: the 50-lien test set reaches 90% or better agreement on high-confidence labels
- Phase 3: both baselines and the lift, with confidence intervals, for the pilot county
- Phase 4: the weekly run is automatic, cached, budget-capped, and alerts on failure
- Phase 5: public site and private view are live, and the license is confirmed
- Phase 6: all California counties have coverage flags; the next state is approved

---

## Owner scoping notes

- 2026-10-17: "Let's try California first and do it in batches." California is the only state in scope until the owner says otherwise. County batches are listed in config/regions/ca.yaml.
- Note: the first bullet under "Data access" arrived cut off ("licensed bulk files, or downloads a county offers for that purpose."). It is read here as: use only official APIs, licensed bulk files, or downloads a county offers for that purpose; no scraping. Owner to confirm.
