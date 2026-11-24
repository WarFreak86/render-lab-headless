# Render-Lab replacement account

The production Hydrogen storefront at `https://render-lab.org` serves replacement Shopify shop `ca510a-1w.myshopify.com` (Shop ID `103251870010`). Replacement Admin identifies the merchant as Render-Lab and reports `https://checkout.render-lab.org` as its primary domain. See the [migration checkpoint](MIGRATION_CHECKPOINT.md) for observations and outstanding merchant checks.

- Replacement Oxygen storefront: Render-Lab replacement, storefront ID `1000186406`.
- Hydrogen publication: `gid://shopify/Publication/333491503418`. This ID is used for publication, while the Oxygen ID identifies the deployment target.
- Repair branch: `migration/ca510a-1w`. Source baseline: `c10c13ec9a0abacfc96cd76c383fb0fec2c6aeca`.
- The canonical public origin is `https://render-lab.org`. Local and Oxygen preview storefronts send non-indexing directives.
- All 249 replacement products retain their verified Admin status distribution in the checkpoint. The Last Radiance is intentionally unpublished.

## Preview and release

1. Use the existing lockfile and Node 22 or 24. Confirm Shopify CLI is linked to the replacement shop and Oxygen storefront. Authenticate with replacement-store access or provide its Oxygen deployment token through the host’s secret environment.
2. Check that preview uses the replacement Storefront API, customer-account client and cart configuration. Confirm `PUBLIC_STORE_DOMAIN` and `SHOP_ID` identify the replacement and verify the actual Shopify-provided checkout URL. Keep credentials in Oxygen or an ignored local environment file.
3. Deploy the repair explicitly with `shopify hydrogen deploy --shop ca510a-1w.myshopify.com --preview`. Use the Preview environment and record its URL. The obsolete source-account deployment workflows were removed from this branch during the migration.
4. Verify the private preview’s sitemap index and children, canonical and robots directives, Veil guide and material filters, Chrome & Thunder pagination, mobile and desktop navigation, size selection, and cart-to-checkout handoff. Use an authorized merchant flow for payment, purchase events and fulfillment testing.
5. Obtain approval before a production deployment. Confirm the target store and previous Oxygen deployment to use for rollback.

## Remaining data review

Three legacy Shopify finish attributes on `pink-crown-urban-icon`, `queens-cipher-urban-icon` and `street-empire-urban-icon` were rejected by category constraints. The original references are retained in the migration backup. Reconcile those against valid destination taxonomy references before applying any change. Collection membership was migrated as a snapshot. Provider metadata and installed apps establish migration configuration and require independent order-routing verification.

Pinterest catalog ingestion, purchase tracking, live payment verification and final backups are open. The post-migration SEO work requires no changes to DNS, provider settings, prices or publication.
