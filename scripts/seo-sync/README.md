# Phase 3 SEO sync

From this directory, run `npm ci` on Node.js 22 or 24. Run `node sync.mjs seo-payload.json` to validate a payload. Add `--apply` to write to Shopify using `SHOPIFY_ADMIN_SHOP` and `SHOPIFY_ADMIN_ACCESS_TOKEN` from the environment or a local `.env`. Use a real, reviewed payload for writes.

The product metafield definitions for `seo.title_override` and `seo.description_override` need Storefront API access set to `PUBLIC_READ`. The product route falls back to Shopify SEO and then catalog copy when either override is missing or blank.

## Crown of Dew Merchant Center pilot

The November 8 processed snapshot showed six Crown of Dew offers from Shopify App API, English / `USD_54447440033`, with no `productHighlights`. Confirm current source and offer IDs before preparing the pilot. Use a JSON payload with the current Shopify readback of `seo.product_highlight` for the product. Confirm each highlight applies to every offer selected for the pilot.

Pass the payload, product GID, and exact Merchant Center offer IDs to the exporter. This example selects one offer from the snapshot. Add other verified offer IDs as arguments when ready. Use PowerShell 7.4+ or Command Prompt for UTF-8 redirection.

```powershell
node export-merchant-highlights.mjs seo-payload.json gid://shopify/Product/8754442731681 shopify_ZZ_8754442731681_47947549704353 > crown-of-dew-highlights.xml
```

The exporter generates a local XML supplement with only `id` and repeated `product_highlight` fields. After approval, link a dedicated highlights-only supplemental data source to Shopify App API for the verified language and feed label. Limit attribute rules to `product_highlight`. Verify the processed pilot offer has the expected repeated values and compare its offer ID, variant URL, price, availability, shipping, and approval status with the baseline before expanding.
