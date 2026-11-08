# OpenSEO Action Pack QA — November 8, 2026

Base: `459eb35d6dbf4ae9877a1221e37eb081eeceb0aa` (remote main checked again before PR preparation). All work is isolated from the dirty showroom/Phase 4 checkout. No deployment, Shopify settings, pixels, environment variables, Merchant Center rules, or production data changed.

## Observed production measurement

An isolated Chromium context visited Crown of Dew with a Pinterest UTM landing URL. Browser plugin was unavailable; the connected Playwright browser was used. Anonymous test-browser consent choices used Shopify's existing Customer Privacy API. No tracking permission functions were replaced and no analytics events were manually fabricated.

| Check | Result | Evidence / limit |
|---|---|---|
| Explicit analytics + marketing denial, followed by reload | PASS | Both API permissions false; no GA4/Pinterest scripts, dataLayer events, or matching tracker requests on the reloaded page. |
| Analytics allowed, marketing denied | PASS | GA4 loaded and emitted page_view/view_item; Pinterest absent. |
| Both permissions allowed | PASS at browser transport | Both tags loaded. Pinterest pagevisit retained the UTM URL. GA4 requests returned HTTP 204. This does not prove reporting-side receipt. |
| Selected product / cart values | PASS | Crown of Dew Metal 16x12 view_item and one successful add_to_cart: variant 47947549704353, USD 79, quantity 1, event value 79. |
| Query-only material switch | PASS | Metal USD 79 → Canvas USD 59; still one page_view on that pathname. |
| SPA navigation | PASS | Breadcrumb to Carnivora produced exactly one second page_view; GA4 script remained a single instance. No console errors on this production flow. |
| UTM page_view transport | FAIL, reproduced | Landing URL retained UTMs but manual page_view page_location omitted every query parameter. Reproduced after explicit consent. Subsequent view_item carried the full UTM URL, so complete campaign attribution loss is not established. |
| Shopify checkout handoff | PASS for navigation | Anonymous one-item cart reached checkout.render-lab.org; no customer information entered or paid order placed. Cross-domain linker parameter was present. |
| begin_checkout / purchase / custom pixel deduplication | NOT VERIFIED | Checkout scripts loaded, but browser evidence does not establish these events' delivery, pixel configuration, or duplication. No fake purchase performed. |
| GA4 DebugView / Realtime | NOT VERIFIED | Connected read-only Admin health is available; no authenticated reporting-side DebugView session was established. HTTP 204 and dataLayer are insufficient. |
| Preview isolation | PASS in existing regression tests; hosted NOT TESTED | Local disabled. Preview requires a valid distinct ID, and rejects production/missing/invalid IDs. No new Preview deployment or environment edits. |
| Regional consent interface | PARTIAL | Initial Shopify permissions were allowed with empty consent strings and no banner in this browser. withPrivacyBanner is false. No visible cookie preference path was found in the tested page/footer. A regulated-region choice flow has not been verified. This is not a compliance conclusion. |

Read-only GA4 Admin inspection: one stream G-ELCN4Z6M92, purchase key event, zero diagnostic issues, pageChangesEnabled false. Historical preview-domain referrals alone do not prove Preview loaded the production tag.

Checkout console contained Shopify private_access_tokens HTTP 401, favicon HTTP 404 and third-party warnings. The checkout still rendered. No attempt was made to modify Shopify-managed code.

## Smallest correction

Manual page_view page_location now retains six standard nonempty campaign parameters: utm_id/source/medium/campaign/term/content. It continues excluding other query parameters and fragments. The pathname deduplication key, page_path, consent gates, IDs, and ecommerce subscriptions are unchanged. No pre-consent storage was introduced. Variant navigation may remove UTMs from the browser URL; this change preserves the current landing URL at the first permitted page view, not attribution for visitors who leave that URL before granting consent.

The observed behavior agrees with Google's explanation that campaign parameters embedded in page_location populate campaign dimensions: https://support.google.com/analytics/answer/11242841?hl=en. This fix requires hosted testing and reporting-side verification before any claim that GA4 attribution is repaired in Production.

## Bounded collection improvements

- Carnivora: the archive's duplicated lower intro was already absent in current main and live HTML. Preserve the existing top intro and product cards; add a below-grid guide with verified Open Trap/Crown of Dew landscape sizes and Devour portrait sizes, existing Metal/Canvas variants, and contextual links.
- Existing metal hub: add a below-directory guide distinguishing decorative prints from sculpture/custom printing, with links to existing Metal-filtered series. No substrate, coating, archival, thickness or fitting promises added. Live generic product copy makes broader claims, but a Gelato SKU-level specification mapping was not verified, so those claims were not copied into the new guide.
- Chrome & Thunder and Veil guide data moved without text changes into the shared content module. Exact source comparison passed. No title, heading, meta, canonical, structured-data or product-data changes proposed: current targeted page intent did not justify them.

## Validation

- Full Vitest suite: 46 files, 344 tests passed.
- TypeScript including Hydrogen codegen and route type generation: passed.
- Full ESLint: passed.
- Production build: passed.
- Post-edit focused checks: 54 tests passed including analytics navigation, both new guides, route metadata and product deep links; changed-file ESLint passed.
- Local Chromium at localhost:3108: both guides rendered at 1280×720 and 390×844, no horizontal overflow. Metal guide link opened Metal-filtered Carnivora, USD 79 cards and complete Metal/Size product links. Local tracking scripts remained absent.
- Development console: unused image-preload warnings, no app runtime errors in the guide checks. Initial local server failure was a shared-dependency Vite filesystem allowance issue; a temporary local QA allowance was removed before commit.
- Shopify AI Toolkit 2026-04 docs search succeeded. Its component validator could not run: the installed package lacks its types index (and its isolated script initially lacked TypeScript resolution). Project TypeScript and tests passed; toolkit validation is not claimed.

## Release boundary

This is a review candidate only. Before any publication: approve copy and diff, authorize a private Preview, verify the permitted UTM landing in GA4 DebugView/Realtime, verify applicable regional consent choices, and inspect existing Shopify checkout pixel configuration read-only for begin_checkout/purchase and duplicate delivery. Pixel, consent UI, environment, merge and deployment changes require separate approval.

Six pin packages, two unsent outreach drafts, a weekly scorecard and eight complete report exports are delivered as local review artifacts outside this code repository. Pinterest queue/rights/final imagery and editorial process disclosures remain owner-review items. No pin publication or outreach sending is authorized.
