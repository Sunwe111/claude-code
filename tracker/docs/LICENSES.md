# Licenses and public-display terms

Researched 2026-10-17. **No vendor terms page could be opened directly from this session** (network
policy), so the quotes below come from search-engine extracts. Before anything goes public:

1. The owner (or a later session with network access) reads each live terms page.
2. Written confirmation from the vendor is obtained wherever this file says "unclear" or "no".

Rule from the brief: if public display is not clearly allowed, the public site shows only derived
aggregates, and only once the vendor confirms in writing.

## Status per source

| Source | Property-level on public site | Aggregates on public site | Attribution | Status |
|---|---|---|---|---|
| PropertyRadar | **No** | **Unclear, leaning no**. Needs written permission | — | Blocked until vendor replies |
| ATTOM (trial) | No | No | — | Trial is "internal evaluation only" |
| ATTOM (paid) | "For the most part" *(snippet)*; caching limit ~24 h on API | Unclear | Not found | Must be written into the contract |
| RentCast | Appears allowed | Appears allowed | Not required | Read full terms-api page to confirm |
| County recorder index/images | Public records | Public records | — | Read each bulk subscriber agreement |
| HMDA | n/a (anonymous) | Yes | Suggested: "Source: FFIEC/CFPB HMDA" | OK |
| Census Geocoder | n/a | Yes | — | OK |

## PropertyRadar

- **API page:** "The PropertyRadar API is intended for end-users only, and you cannot use it to build
  applications you sell to others." (https://developers.propertyradar.com/)
- **User Agreement (effective 2026-02-26):** a "limited, individual, non-exclusive, non-transferable
  and completely revocable license… solely for [your] entity's internal business purposes."
- **Prohibited uses:**
  - "any public or commercial purpose, which includes use of the PropertyRadar Offerings on another
    website or through a networked computer environment"
  - publicly displaying the Offerings
  - "distributing, redistributing, reposting, and displaying any portion"
  - using the data "to create derivative products"

  (https://www.propertyradar.com/user-agreement)
- **Older 2022 agreement:** de-identified or aggregated data "shall be owned solely and exclusively
  by us".

**Reading:**

- The owner's private research view is internal use, which is fine.
- A public site with property detail is not allowed.
- Published county statistics are not clearly allowed. Ask PropertyRadar in writing (draft in
  docs/VENDOR_EMAILS.md).

## ATTOM

- **Evaluation license:** "limited to Customer's internal evaluation only". It prohibits "creating any
  product or service for sale or distribution to any third party".
  (https://api.developer.attomdata.com/legal *(snippet)*)
- **API FAQ:** displaying on a commercial site is "Yes (for the most part)… carefully read through our
  terms of usage". *(snippet)*
- **Bulk FAQ:** licensees can "power their websites, real estate portals". *(snippet)*
- **Restrictions:** sublicensing and redistribution are barred.

## RentCast

- **Allowed uses:** "consumer applications, commercial products, derivative works, internal reports
  and analytics, internal data storage, and distribution to end users of your applications".
  (https://www.rentcast.io/api)
- **Attribution:** "We do not require you to add attribution or RentCast branding."
  (help.rentcast.io)
- **API terms:** bar renting, sublicensing or transferring "the API or its data", with an exception
  clause that could not be read in full. (https://www.rentcast.io/terms-api)

## County recorders

Recorded documents are public records. However:

- **Santa Clara** assessor extracts forbid resale and online posting.
- **San Diego** recently removed APN search (AB 1785).
- **Riverside and San Bernardino** sell bulk data under subscriber agreements, which must be read
  before use.
- **No county portal** was found to allow automated searching, so online indexes are used for hand
  checks only.

## HMDA and Census

- **HMDA:** U.S. government data; CFPB code is CC0. No data-use restriction found. Credit line:
  "Source: FFIEC/CFPB HMDA <dataset>, <year>, ffiec.cfpb.gov".
- **Census Geocoder:** a public U.S. government service. No published numeric rate limit; use slow
  batches.
