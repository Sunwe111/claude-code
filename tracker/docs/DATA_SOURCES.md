# Data sources (Phase 0)

Researched 2026-10-17.

**How this was checked.** This session's network policy blocked direct access to every vendor and
government site, so most facts come from search-engine extracts of the official pages, cited by
URL. Two exceptions are stronger:

- **HMDA** facts come from the CFPB's own production source code on GitHub.
- **ATTOM** field names come from ATTOM's official Postman collection and from real API responses
  saved in public GitHub repos.

Treat anything marked *(snippet)* as a close paraphrase, not a verified quote. Re-read it on the live
page before relying on it.

## Summary

| Source | Role | CA coverage | Rate-type field? | API / bulk | Price (Oct 2026) | Public display |
|---|---|---|---|---|---|---|
| PropertyRadar | Loan type, sale history, owner, listed flag | All 58 counties; recorder start date per county (LA from 1949, Alpine from 1999) | **Yes:** `FirstRateType` F/A/? plus ARM reset fields | REST API | Solo $119/mo ($99 annual), Team $249, Business $599; 10k/25k/50k exports per month | **No** for property-level. Aggregates **unclear, leaning no** |
| ATTOM | Deeds, mortgages, assessor | National; ~20–25 yr depth | Field exists (`interestRateType`) but **sparsely filled** (rate data ~10–15% nationally *(snippet)*) | REST API; bulk "ATTOM Cloud" | 30-day free trial (~1,000 calls lifetime cap *(snippet)*); paid by quote | Trial: internal evaluation only. Paid: "for the most part" *(snippet)*, must be in contract |
| RentCast | Active listings | "≥96% of listings", all 50 states, refreshed daily | **No** loan fields | REST API | Free 50 req; $74 / 1k; $199 / 5k; $449 / 25k | Appears allowed, incl. distribution to end users *(snippet)* |
| County recorder | Ground truth for spot checks | Varies by county (see below) | Only inside document images (ARM rider) | Online index; some sell bulk | Free to ~$73/day | Public records; bulk agreements to be read |
| HMDA (FFIEC/CFPB) | Baseline A | All CA, loan level by tract, 2018–2025 | **Yes:** `intro_rate_period` (months > 0 = ARM) | API + bulk files | Free | U.S. government data, no license restriction found |
| Census Geocoder | Address → tract | National, 2020 tracts | n/a | API, batch of 10k | Free | Public |

Other options looked at:

- **RealEstateAPI.com** has active listings and an `adjustable_rate` boolean. It costs about
  $599/mo and up, and its terms hint at internal use only.
- **BatchData** has a listings add-on and an ARM filter, at about $1k–2.5k/mo.
- **Cotality (CoreLogic) bulk** has the richest mortgage module (rate type, ARM features). It is
  sold by quote, reportedly about $12k/yr *(unverified)*.
- **DataTree (First American)** has an interest-rate-type filter and document images. Its EULA
  allows internal use only.
- **ParcelQuest** has assessor data only, no rate type, and no publishing allowed.

## Field names that matter

| Meaning | PropertyRadar (criteria keys) | ATTOM (JSON) | RentCast | HMDA |
|---|---|---|---|---|
| Rate type (ARM/fixed) | `FirstRateType` (F/A/?), plus a second-loan rate type | `interestRateType` (e.g. "ADJ"), sparse | — | `intro_rate_period` (months, "NA", "Exempt") |
| ARM details | `FirstARMInitial`, `FirstARMNext`, `FirstARMIndex`, margin, frequency | `interestMargin`, `mortgageInterestIndex`, `mortgageInterestRateMax` | — | — |
| Loan type | `FirstLoanType` (Conforming, FHA, Jumbo, VA…) | `loanTypeCode` (CNV, REV, …) | — | `loan_type` (1–4) |
| HELOC | `FirstPurpose` = `ELOC` (also on second loan) | `equityFlag` = "R", `loanTypeCode` = "REV" | — | `open-end_line_of_credit` (1 = yes) |
| Lien position | "Other Loan Position" (exact key not yet captured) | none in API; `/valuation/homeequity` gives 1st/2nd/3rd balances | — | `lien_status` (1/2) |
| Loan amount | `FirstAmount` | `amount` | — | `loan_amount` (binned to $10k midpoint) |
| Lender | `FirstLenderOriginal` | `lenderLastName`, `companyCode` | — | `lei` |
| Loan recording date | `FirstDate` | `date` | — | — |
| Reconveyance / release | "Other Loan Status" (active vs **estimated** reconveyed) | none in API | — | — |
| Last sale date / price | `LastTransferRecDate`, `LastTransferValue` | `saleRecDate`, `saleAmt`, `saleTransType`, `deedType` | `lastSaleDate`, `lastSalePrice`, `history` | — |
| Arm's-length / distress | no flag; `ForeclosureStage`, `LastTransferType`, `LastTransferDocType` | `quitClaimFlag`, `REOflag`, `saleTransType` | — | — |
| Buyer type | `OwnershipType` (Trust, Corporate, Individual…) | `corporateIndicator` | `owner.type` | — |
| Listed for sale | `isListedForSale`, `ListingDate`, `ListingPrice`, `DaysOnMarket` | none in core API | `/listings/sale`: `status`, `listedDate`, `removedDate`, `price`, `history` | — |
| APN | (in property record) | `identifier.apn` | `assessorID` | — |

Caveats:

- PropertyRadar says lien positions and reconveyance status come from computer models and have not
  been manually reviewed.
- PropertyRadar says interest rates are "published for adjustable rate loans, estimated for fixed".
  Whether `FirstRateType` comes from the recorded rider is not yet known. The 20-property test
  answers this.

## Source notes

### PropertyRadar

- **API:** `POST /v1/properties` with a Criteria object. Auth is a bearer API key.
- **What costs exports:** `Purchase=0` returns a free count. `Purchase=1` charges 1 export per
  record. Requests for RadarIDs only are free.
- **Plans:** a July 2026 blog post says the API now comes with Solo, Team and Business. The pricing
  page may still say Business only. Confirm at signup.
- **Trials:**
  - The app trial is 5 days with no exports.
  - The API trial is 30 days but requires a paid subscription.
- **Refresh:** data updates daily; MLS status is checked daily.
- **Sources:**
  - https://developers.propertyradar.com/criteria_reference
  - https://www.propertyradar.com/pricing
  - https://help.propertyradar.com/en/articles/8769730-what-is-a-pay-per-record-api-endpoint
  - https://www.propertyradar.com/coverage/california

### ATTOM

- **Base URL:** `https://api.gateway.attomdata.com/propertyapi/v1.0.0`, with the key in an
  `apikey` header.
- **Endpoints used here:**
  - `/property/detailmortgage`
  - `/saleshistory/expandedhistory`
  - `/property/expandedprofile`
  - `/allevents/detail`
- **Rate limit:** 200 calls/min *(snippet)*.
- **Fill rate (key fact):** ATTOM support reportedly says rate data appears only when "explicitly
  printed on the recorded mortgage document", averaging 10–15% nationally *(snippet)*. In the real
  sample responses, rate type appeared almost only on HELOCs.
- **Listings:** none in the core API. A separate MLS product needs an MLS license.
- **Sources:**
  - https://github.com/AttomDataSolutions/postman-collections
  - https://cloud-help.attomdata.com/article/512-deeds

### RentCast

- **Listings endpoint:** `GET /v1/listings/sale`, filtered by city, ZIP or lat/lon+radius (up to
  100 mi). Status defaults to Active. Up to 500 rows per request, paged with `offset`.
- **No county filter:** responses carry `countyFips`, so a county is pulled by radius tiles and then
  filtered locally.
- **Property records:** `/v1/properties` gives `assessorID`, `lastSaleDate` and sale history, but no
  liens.
- **Sources:**
  - https://developers.rentcast.io/reference/sale-listings
  - https://developers.rentcast.io/changelog/api-release-2025-08
  - https://www.rentcast.io/api

### HMDA (verified against CFPB source code)

- **Data Browser API:** `https://ffiec.cfpb.gov/v2/data-browser-api/view/csv?states=CA&years=2024&actions_taken=1&loan_purposes=1`
- **Filter limit:** at most 2 non-geography filters per request. The rest is filtered locally:
  `lien_status=1`, `occupancy_type=1`, `total_units` 1–4, `open-end_line_of_credit`,
  `reverse_mortgage=2`, `business_or_commercial_purpose=2`.
- **Years available:** 2018–2025. The API serves Snapshot for 2025, One-Year for 2023–24 and
  Three-Year for 2018–22.
- **ARM flag:** `intro_rate_period` numeric > 0 = ARM. "NA" = fixed (industry practice, not yet
  confirmed in official commentary). "Exempt" (small lenders) is left out of the share.
- **Tracts:** 2020 census tracts from 2022 data on (CA has 9,140 tracts). Our 36-month window
  (2023–2026) lines up with current tracts.
- **Sources:**
  - https://github.com/cfpb/hmda-platform
  - https://github.com/cfpb/hmda-frontend

### Census Geocoder

- **Single address:**
  `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=…&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
- **Batch:** `/geocoder/geographies/addressbatch`, up to 10,000 rows and 5 MB per file.
- **Not yet tested:** no live call has been made; the host is blocked from this session.

## California recorders: candidate pilot counties

| County | ~2025 sales / median | Free online index | Images online | Legit bulk |
|---|---|---|---|---|
| Los Angeles | ~50k / $947k | **No** (in person only) | No | Assessor roll for sale |
| San Diego | 23.9k / $1.09M | Yes, doc type, 1970+ (no APN search since 12/2024) | No (office kiosks) | Tax-roll files $86 |
| Orange | 21.3k / $1.45M | Yes, doc type, 1982+ | No | — |
| Riverside | 25.1k / $633k | Yes (free? unconfirmed) | Paid copies | **Daily index + images feed, ~$66–73 per business day** |
| San Bernardino | 17.7k / $522k | Yes, doc type | No | **$0.10/image or index title + $125 setup** |
| Santa Clara | 11.6k / $1.90M | **No** (removed 2018) | No | Assessor extracts (no resale/posting) |
| Alameda | ~11k / $1.29M | Yes, doc type | No | — |
| Sacramento | 12.7k / ~$549k | Yes | No | **Free roll and 2-year transfer list** |
| Contra Costa | ~8k / ~$875k | Yes, incl. APN | No | Free parcel shapefile |
| San Francisco | 5.4k / ~$1.88M | Yes, by APN | **Yes, free after ID-verified registration** | **Free secured roll on DataSF** |
| San Mateo | ~4.5k / ~$2.25M | Yes | No | Roll $305; sales history file $305 |

**Recorder indexes do not show whether a loan is adjustable.** That is only visible in the document
image (an "Adjustable Rate Rider" attached to the deed of trust). Credit-line deeds of trust (HELOCs)
are often visible from the index document title.

No county portal's terms were found that allow automated searching, so online indexes are used for
**hand spot checks only**.
