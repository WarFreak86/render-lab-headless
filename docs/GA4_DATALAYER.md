# GA4 tracking and preview verification

The current main branch uses `GoogleAnalytics` inside Hydrogen's
`Analytics.Provider`. Keep this single integration; do not also mount the older
`GA4PageViews`, product-route helper, or `CartDataLayer` implementation from the
older working checkout, as that would bypass consent and duplicate events.

Production uses `G-ELCN4Z6M92`. Initialization sets `send_page_view: false`,
loads the tag once with the Hydrogen CSP nonce, and runs only after both Hydrogen
and Shopify Customer Privacy API allow analytics. Revoked consent suppresses
subsequent events.

The gtag bootstrap must push its native `arguments` object into `dataLayer`, as
in Google's standard snippet. Queuing plain JavaScript arrays loads the tag but
does not dispatch the gtag commands. A regression test checks this command shape.

Manual page views run on initial permitted load and pathname changes. Both the
deduplication key and `page_path` omit query strings; `page_location` is the origin
plus pathname. Variant queries, hashes, rerenders, and repeated Hydrogen page
notifications do not inflate page counts. Consent-grant events can send the
current page if it has not been sent yet.

Product and cart events use Hydrogen's existing `product_viewed` and
`product_added_to_cart` subscriptions, with direct, guarded gtag calls. Product
data includes selected variant ID/title, numeric price, and the shop currency.
Cart data comes from confirmed cart changes and reports only positive quantity
increases, using the cart line's actual currency and price. Failed mutations
without a confirmed cart increase do not emit additions. Checkout handles
purchase events; this integration does not send them.

Local tracking is disabled. Oxygen Preview tracking requires the existing
`PUBLIC_GA4_PREVIEW_MEASUREMENT_ID` environment variable with a separate valid
GA4 measurement ID. Missing, invalid, or production IDs disable preview tracking
to keep test traffic out of production analytics. Do not bypass that guard to
make preview tests pass.

The `GA4 Oxygen Preview` workflow runs only on `codex/ga4-oxygen-preview`, reuses
the existing Oxygen deployment secret, and deploys with explicit `--preview`.
The production deployment workflow is unchanged. The Vitest configuration
excludes only `scripts/product-cleanup/cleanup.test.mjs` in addition to its normal
defaults. Run those seven Node tests separately in their original checkout;
the unrelated cleanup script is not part of this deployment commit.

After deployment, smoke-test homepage, collection, product/variant selection and
cart operations. Observe script initialization, page/product/cart events, denied
and granted consent, failed additions, and browser/network errors. If a separate
preview measurement ID is absent, analytics delivery is NOT VERIFIED, even when
the storefront works and consent suppression is verified.

In GA4's web stream, manually verify Enhanced Measurement's **Page changes based
on browser history events** is disabled for this manual page-view integration.
Do not change production settings as part of preview deployment. GA4 DebugView
receipt requires actual observation in the Google Analytics account; local
tests, dataLayer entries, and network success alone do not prove receipt.

References:
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://shopify.dev/docs/api/customer-privacy
- https://shopify.dev/docs/api/shopify-cli/hydrogen/hydrogen-deploy
