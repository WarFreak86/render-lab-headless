# Render-Lab replacement account

Destination: ca510a-1w.myshopify.com (shop ID 103251870010).
Source baseline: c10c13ec9a0abacfc96cd76c383fb0fec2c6aeca.
Branch: migration/ca510a-1w. This is a replacement-store branch, not a change to merge into the existing store's production branch.

The destination currently contains 242 draft products / 1,276 variants, 29 manually reconstructed collections, restored navigation/pages/redirects, and migrated image and custom-data records. Catalog product fields were compared against the backup. Fulfillment, payment setup, destination credentials and a working Oxygen deployment are still required.

The canonical public origin remains https://render-lab.org because the existing brand/domain will move after verification. Preview hosts remain non-indexable. The checkout fallback and internal myshopify link host now point to the destination. Hardcoded homepage/editorial images use destination-account CDN URLs.

## Connect the website

1. Install Shopify's Hydrogen sales channel in the destination account. Create a replacement Hydrogen storefront and connect this code. Set its production branch to migration/ca510a-1w before enabling continuous deployment, or use this branch's source in a separate destination repository. Do not change the live source storefront's production branch.
2. Link the project to the destination storefront using Shopify CLI and pull its newly generated environment variables. Use Node 22 or 24 with the existing lockfile and Hydrogen 2026-04. Do not reuse the source account's tokens, storefront/client IDs, session secret or deployment token.
3. Ensure PUBLIC_STORE_DOMAIN is ca510a-1w.myshopify.com and SHOP_ID is the destination ID. PUBLIC_CHECKOUT_DOMAIN should initially be ca510a-1w.myshopify.com. Keep checkout.render-lab.org on the source account until cutover is approved. After transferring that hostname, set the destination Oxygen variable to checkout.render-lab.org and redeploy.
4. Configure destination customer-account callback, logout and JavaScript origin URLs. Retain destination customer-account resource IDs; the migrated menu intentionally does not link to the old account domain.
5. The three workflows that could deploy to SOURCE storefront 1000173485 were removed on this branch. Create a fresh destination deployment workflow using its new Oxygen token and this branch. Source production on main remains unchanged. No replacement deployment has run.
6. Make a small approved subset of products and relevant collections available to the new Hydrogen channel for preview testing. Keep the rest unpublished until fulfillment is correctly connected. Rebuild provider links using destination product/variant IDs rather than republishing duplicate products.
7. Restore legal policies manually in the destination admin: the current Shopify connection has read_legal_policies but not write_legal_policies. Existing policy text is in the transfer backup. Footer links retain the final public policy paths and depend on this restoration.
8. Verify the preview's homepage, artists, collections, product options, images, cart, shipping/taxes, payment and provider test order, account login, consent, GA4/Pinterest ID matching, canonicals, sitemap, and redirect paths. Keep the original domain/store running until cutover.

## Remaining data review

Three legacy Shopify finish attributes on pink-crown-urban-icon, queens-cipher-urban-icon and street-empire-urban-icon were rejected by current category constraints. Their original values remain in the backup. Collection membership was restored as a snapshot, not as the old automatic source rules. Existing provider integration metadata is retained where writable but is not evidence of an active provider connection. No customer/order history or app-private state was transferred.

The store's merchant display name, contact/notification settings, payments, provider authorization, shipping rates, channel connections and domain settings require review in the destination Shopify Admin. No source credentials are included here.
