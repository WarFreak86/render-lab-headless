# Phase 2 — Funnel reliability and purchase trust

## Baseline (10 November 2026)

- Last-30-day Shopify reported sessions: 373; sessions adding to cart: 59; sessions reaching checkout: 27.
- One $59 gross order had a full $59 discount and was confirmed by the owner to be a test, **not a customer sale**. Net revenue from legitimate buyers: $0.
- Device attribution: desktop 206 sessions / 29 cart additions / 17 checkout entries; mobile 50 / 1 / 0; other 36 / 23 / 10; unclassified 81 / 6 / 0.
- GA4 recorded only 14 sessions (10 direct, 3 development-host referrals, 1 Shopify Admin referral) during 2026-10-11 through 2026-11-09.
- GSC recorded four clicks in its Oct 11–Nov 7 window, primarily artist profiles; do not equate this with customer demand.
- These counts are **not clean conversion statistics**. Do not infer checkout failure without removing internal testing, bot traffic, consent differences and attribution anomalies.

## Track 1: Validate measurement before changing conversion design

1. Confirm GA4 stream ID, Shopify Customer Privacy settings, consent experience and whether a privacy banner or CMP actually collects permission for applicable regions. Do not bypass consent to increase metrics.
2. Check whether GA4 Enhanced Measurement also auto-tracks SPA history page changes. With manual pageviews enabled, duplicate events are possible unless history tracking is disabled in GA4 settings. Do not alter settings without owner approval.
3. Run a manual scenario on Oxygen Preview with a *separate preview GA4 measurement ID*: entry with test UTM parameters -> collection -> product -> material/size -> Add to Cart -> cart. Use debug/event inspection; compare event name, product ID, variant ID and price. Do not send preview events to production analytics.
4. After explicit deployment approval, verify production consent scenarios (allowed/denied), GA4 page_view/view_item/add_to_cart, Pinterest PageVisit/AddToCart, and Shopify session/cart reporting. Test with clearly tagged QA traffic and exclude it from customer results.
5. For a non-purchasing checkout test, verify cart.checkoutUrl, merchandise line IDs, exact shipping rate shown for a US destination, discounts, tax presentation, payment methods, and checkout error states. Stop before purchase; do not place an order.
6. Establish a weekly clean-funnel report: qualified sessions by channel and UTM, unique product views, cart-addition sessions, checkout-entry sessions, *verified genuine* orders and revenue. Keep test traffic separate.

## Track 2: Make product promises verifiable

- Production information is derived from the current Shopify Shipping Policy, which says Gelato metal/canvas production **typically takes 2–4 business days before shipping**, without guarantee.
- Do **not** publish a flat $8 shipping claim or a $125 free-shipping threshold; the current policy explicitly says neither is universal. Actual shipping varies by product, size and destination and is confirmed at checkout.
- The Refund Policy, effective 2026-11-07, permits eligible 14-day physical-product returns. Confirm its storefront copy and checkout policy are consistent.
- Audit the highest-traffic actual product pages for formats named in descriptions but unavailable in selectors and for inconsistent width x height orientation.
- QA at 390x844 mobile and 1440x900 desktop with screenshots of above-the-fold purchase panel, alternate material/size, cart drawer, and checkout entry.

## Track 3: Qualified acquisition after tracking is trustworthy

- Pilot existing indexed and active collections/products first; do not create new collections for this phase.
- Prioritize commercial intent pages such as Wall Art, Metal Wall Art, Canvas Art, Chrome & Thunder, Carnivora, Cathedral of the Void and Fireglass as *candidates*, not proven winners. Check publication and indexing before sending traffic.
- Tag Pinterest links with e.g. `utm_source=pinterest&utm_medium=organic_social&utm_campaign=phase2_pilot&utm_content=artwork_handle`; never include personal information in UTMs.
- Weekly decision: impressions -> qualified clicks -> product views -> carts -> genuine orders -> net margin. Stop expanding distribution if tracking cannot attribute outcomes.

## Release gate

- Branch/PR checks: `npm test -- --run`, `npm run typecheck`, `npm run lint`, `npm run build`; follow actual package scripts if different.
- Review GA4 campaign-tag allowlist, no sensitive query collection, no consent bypass, no double page_view.
- Review shipping copy against Shopify policy and checkout reality.
- Verify live preview visual behavior and checkout-entry without an order.
- No automatic Production deployment or merge without owner approval.
