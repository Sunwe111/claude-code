# Phase 0: 20-property accuracy check

**Goal:** find out whether the provider's "adjustable vs fixed" label matches what the recorded loan
documents actually say. Everything else in the project depends on this.

**Waiting on:** owner's trial keys in `.env`, and the API hosts being allowed in the cloud
environment's network settings.

## Sample (pulled by Claude from the provider)

20 properties in the pilot county, all bought by an arm's-length sale in 2023–2026, with a lien
recorded at or after purchase:

| Group | Count |
|---|---|
| Provider says **ARM** first loan | 8 |
| Provider says **fixed** first loan | 6 |
| Provider says **HELOC / credit line** | 3 |
| Provider says **unknown** | 3 |

Mixing the groups shows both kinds of error: false ARMs and missed ARMs.

## What the owner checks on the county site

For each property, open the deed of trust recorded with the purchase (and any later credit-line deed
of trust), then record:

- whether there is an **"Adjustable Rate Rider"** or the words "adjustable rate", "change date", or an
  index name (SOFR, Treasury)
- whether the title says **"Credit Line Deed of Trust"** or mentions a maximum credit / line of credit
- the loan amount and lender, as a sanity check against the provider's values

## Results (to fill in)

| # | APN | Recording date | Doc # | Provider label | Raw provider value | Recorder says | Match? | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |

## Pass bar (proposed)

| Measure | Target |
|---|---|
| Provider-ARM labels confirmed by an ARM rider | ≥ 90% |
| Provider-fixed labels with no ARM rider | ≥ 90% |
| HELOC labels matching a credit-line deed of trust | ≥ 90% |

If the provider fails, Phase 2 will rely on document-type and document-image evidence instead, which
changes the cost picture.
