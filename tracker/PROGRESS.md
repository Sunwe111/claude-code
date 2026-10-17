# Progress log

## 2026-10-17: Session 1, Phase 0 research (stopped at Checkpoint 0)

**Owner instruction:** California first, in batches.

**Built**
- Project skeleton: brief, definitions, budget cap ($0 until set), and all 58 California counties in
  6 batches (largest first by population; to be re-ranked by listing volume later).
- Research docs:
  - `docs/DATA_SOURCES.md`
  - `docs/LICENSES.md`
  - `docs/PHASE0_SPOTCHECK.md` (20-property test plan)
  - `docs/VENDOR_EMAILS.md` (drafts for the owner)

**Cost so far:** $0. Nothing signed up for.

**What looks wrong or risky**
- This cloud environment's network policy blocks the vendor and government sites, so the research
  relied on search summaries and GitHub. License quotes are unverified until someone reads the live
  pages.
- ATTOM's rate-type field appears to be filled on only a small share of loans. PropertyRadar has the
  right field (`FirstRateType`), but its terms forbid public display, and aggregates are unclear.
- No pipeline code yet. The brief says to prove the loan-type source first.

**Decisions needed (Checkpoint 0):**
- source stack
- pilot county
- budget cap
- network access
- vendor emails
- confirm the cut-off "Data access" rule

**Next:** once keys arrive, run the 20-property accuracy test in the pilot county.
