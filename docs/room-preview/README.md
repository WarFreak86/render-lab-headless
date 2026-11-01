# Render-Lab room visualizer pilot

Hydrogen route: `/lab/room-preview`. Product entry: **The Sky Unbound** only. The product and selected variant travel in the URL; Back to Product returns the current selection. Material, size, price and availability come from the existing read-only Shopify Storefront client. The room view has no checkout implementation and keeps its purchase control disabled.

## Access and release boundary

Local development works on localhost. Built deployments deny access by default. Staging requires both the exact server-side enablement string and approved hostname described in [STAGING_ACCESS.md](STAGING_ACCESS.md). The production domain, all its subdomains, and the commerce hostname are always denied. Noindex/no-store remain required for page and data responses.

The feature flag is not authentication. No real staging hostname, private Oxygen environment, reviewer permissions, or production-domain mapping has been verified for release. Do not deploy until those separate checks and explicit release authorization are complete. No deployment workflow or Shopify settings are changed by this feature.

## Files required from the prototype asset tree

These existing import locations contain delivery/test assets only; the standalone prototype applications are not required:

- `prototypes/room-preview/public/rooms/empty-wall-v2/{modern,loft,office}-{320,640,1024,1672}.webp`: 12 approved optimized room images.
- `prototypes/room-preview/public/fonts/manrope.woff2` and `LICENSE`: Manrope and its SIL Open Font License.
- `prototypes/room-preview/fixtures/live-product.json`: published catalog test data, not runtime prices or credentials.

The empty-wall rooms are generated design scenes supplied for this project, not customer photographs. Artwork is loaded separately from Shopify. Scale, finish and lighting remain explicitly illustrative. Original sources, standalone 2D/3D apps, archives, logs, screenshots and historical QA reports remain outside this feature commit.

## Validation

Use the versions pinned in the root lockfile. No credential configuration is needed for the mocked automated tests or build:

```text
npm ci
npm run codegen
npm run lint
npm test
npm run typecheck
npm run build
```

Codegen creates local API/route types; generated output is not part of this feature commit. Tests cover access denial and exact-host staging, credential serialization, variant navigation, all three room configurations, disabled preview purchasing, root data isolation and existing storefront behavior. The independently committed product-selection timing fix remains a separate parent commit.
