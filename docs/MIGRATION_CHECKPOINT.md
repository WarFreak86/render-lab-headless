# Render-Lab replacement Shopify migration checkpoint

_Production observations from November 24, 2026 (America/New_York)._

## Verified production state

| Check | Observation |
|---|---|
| Storefront identity | `https://render-lab.org` served Shopify Shop `103251870010`. The replacement Admin connection identifies the same shop as Render-Lab, `ca510a-1w.myshopify.com`. |
| Checkout domain attachment | Replacement Admin reports `https://checkout.render-lab.org` as the shop’s primary domain. |
| Catalog | Replacement Admin returned 249 products (97 active, 145 draft, 7 archived) and 29 collections. These are Admin status counts. The live Hydrogen product sitemap separately listed 97 URLs. |
| Intentional unpublication | The Last Radiance is draft in the replacement store. Its public product URL returned 404 and was absent from the live sitemap. |
| Legal pages | The four storefront policy pages returned 200 and self-canonical URLs. The public privacy policy identifies Render-Lab and shows a November 24, 2026 update. |
| November 24 SEO baseline | All four live sitemap children were inspected. Of 113 listed URLs, 112 returned 200 with self-canonicals. The News blog URL redirected to Collections. Eight eligible storefront routes were missing. The Veil Between Worlds guide linked to the unpublished product from the base, Metal and Canvas views. |

The SEO repair is on `migration/ca510a-1w`. Production observations above describe the deployed site before this repair.

## SEO repair validation

- The production build passed 413 tests and TypeScript checks. A local host serving that build against the replacement store returned valid sitemap XML with 126 unique canonical URLs and all 97 product dates intact.
- The Veil Between Worlds base, Metal and Canvas views passed the content-link crawl. Keeper of the Threshold is the replacement recommendation. The account link was verified against the public sign-in page.
- Browser checks covered desktop, tablet and mobile navigation and size selection. A local test cart reached the live checkout and displayed the selected hoodie. Payment was outside this check.
- The hosted Oxygen preview requires replacement-store CLI authentication or an Oxygen deployment token. The local checks used a Node host because the Windows MiniOxygen worker failed to start.

## Pending merchant and release checks

- Verify replacement Pinterest catalog ingestion and variant-level feed matching in Pinterest. Public storefront product IDs cannot establish catalog ingestion or item matching.
- Verify an authorized checkout purchase reaches the expected GA4 and Pinterest destinations once, with the replacement variant identifiers and correct consent behavior.
- Verify live payment authorization, capture and payment methods through a separately authorized merchant test. Confirm actual tax, shipping rates and provider routing for representative art and apparel orders.
- Finish any outstanding provider mappings and reconcile held fulfillment exceptions. The Gelato migration validation records mapping and asset evidence. Confirmation of a routed order remains pending.
- Verify the replacement customer-account sign-in and logout callbacks and review destination contact and notification settings.
- Take final replacement-store and configuration backups after reconciliation. Confirm backup location, access and restore instructions separately.
- Verify the SEO repair on an isolated replacement Oxygen preview before requesting approval to deploy it to production.

## Historical migration evidence

The November 23 import checkpoint recorded 242 products imported as drafts, 1,276 variants, 642 ready Shopify files, 19 metaobject definitions, 117 metaobject records and 37 metafield definitions. The original Shopify account (`kn0xfa-4t.myshopify.com`) is retained as a recovery reference. Source account identifiers in archived exports are for reconciliation. Destination IDs should be matched by handle, SKU and selected options.

The pre-import source ZIP snapshot was captured November 24, 2026 at 03:52 UTC. The destination ID reconciliation and the source backup are stored separately. Three legacy finish attributes remain documented in the [replacement setup](REPLACEMENT_STORE_SETUP.md).
