# Storefront homepage and visibility changes — 2026-10-29

## Changes

- `config.ts`, `navigation.ts`, `root.tsx`, and `Footer.tsx`: normalize storefront/menu URLs by exact host; recursively remove non-live collection and retired artist menu entries before serializing header/footer data. Keep genuine cart checkout URLs and consent configuration unchanged.
- `catalog-collections.ts`: shared allowlist of four format and nine series collections. Apply it to navigation, collection directories, artist collections, predictive search, and all collection sitemap partitions. Query collection lists with the same handle filter and filter returned data defensively.
- Non-allowlisted collection handles, including the separate `/collections/all` route, permanently redirect to `/collections/wall-art`. Existing retired artist redirects to `/artists` remain permanent. No Shopify records were deleted or edited.
- Homepage shows all nine active series, with complete one-to-two sentence summaries derived from Shopify HTML descriptions. Normalize retired creator credits in image alt text. Preserve J.B. Render initials and skip short introductory taglines when more substantive description follows.
- Twelve distinct, available artworks selected across live series, with actual Shopify minimum prices and supported Material/Finish option values. No invented products, prices, or materials. Artwork images fit within consistent frames without forced cropping.
- Requested title, description, hero heading/alt text and material headings; Organization description, clean SVG logo and founder; WebSite SearchAction; homepage-only nine-item collection ItemList. Preserve existing merchant return and shipping schema.
- Homepage delivers exactly two stylesheet links: global root bundle and route homepage bundle. Retain individual CSS source files and existing tokens. Base styles use a lower cascade layer; shared editorial overrides still follow route styles. Fix legacy card overlay/rail rules so all nine cards remain visible and descriptions are not clipped.
- Explicit public crawler group includes Googlebot, Google-Extended, OAI-SearchBot and bingbot. Sitemap points to the production domain. Existing cart/account/search/filter restrictions and checkout/preview noindex protections remain intact.

## Verification

- `npm run typecheck`: passed, including Hydrogen GraphQL codegen, Router typegen and TypeScript.
- `npm run build`: passed; client and Oxygen server bundles generated.
- `npm run lint`: passed with no warnings/errors.
- `npm test -- --maxWorkers=4`: 41 test files, 312 tests passed.
- New regressions cover exact-host normalization, nested menu filtering, root/deferred payload sanitization, preserved checkout URL, excluded collection redirects, retired artist redirects, collection sitemap XML/dates, schema, crawler/checkout protections, all nine visible collection cards, real product prices/materials, product deduplication and HTML sentence boundaries.
- Local production preview with real read-only Storefront API data: homepage HTTP 200; nine series and twelve product links; two stylesheet links; all nine collection links in ItemList; no retired artist handles or excluded collection URLs in the complete SSR response.
- Collection sitemap partition 1 contains exactly the thirteen allowed collection URLs. Existing product lastmod regression tests pass unchanged. No sitemap dates fabricated.
- Desktop 1440px and mobile 390px visual inspection: readable cards, consistent product frames, no horizontal document overflow. Browser console reports zero errors/warnings during homepage and product navigation.
- Client-side homepage-to-product navigation preserves the document; product canonical stays on render-lab.org and homepage ItemList disappears. Material/size selection updates the URL and add-to-cart price (Canvas / 24x18 showed $89.00 for the sampled product). No purchase or fulfillment action performed.
- Dependency manifests/lockfile, checkout implementation, fulfillment and analytics integrations unchanged. Latest merged lockfile, security, return-policy and shipping-schema changes retained.

## Review and deployment limits

The existing GitHub workflow runs on main pushes or manual dispatch and includes an Oxygen deployment. It was not dispatched. Validation was local; no merge or deployment occurred. Existing Hydrogen envFile deprecation and React Router future-flag notices remain. The changes do not establish Google indexing or ranking outcomes.
