# Pinterest tracking review and verification

## Scope

- Pinterest Shopify conversion tag: `2612416049289`.
- Only the production Hydrogen hostname (`render-lab.org` and `www.render-lab.org`) sends Pinterest browser events.
- Uses Hydrogen 2026-04 `Analytics.Provider`/`useAnalytics` events.
- Sends `pagevisit` on page navigation (once per path until the visitor navigates away and returns).
- Sends `addtocart` only for increases in cart line quantity, using the cart's actual unit price and currency.
- Requires Shopify Customer Privacy API marketing consent **and** analytics tracking permission before loading Pinterest.
- Does **not** send `checkout`, `initiatecheckout`, or duplicate purchase events; keep the Pinterest for Shopify checkout integration.
- If another Pinterest base tag is already present, the browser code reuses it instead of injecting another base tag.
- Extends the existing Hydrogen content security policy to permit Pinterest's `s.pinimg.com` script and `ct.pinterest.com` tracking endpoint without removing Shopify's defaults.

## Before merging

1. Review whether the Pinterest Shopify app already loads a tag on `render-lab.org`; do not allow two destinations to send the same event.
2. Confirm Pinterest catalog `product_id` matches the Shopify product GIDs emitted here. If catalog IDs use a different format, adjust the ID mapping before enabling dynamic retargeting.
3. Verify your privacy banner or consent-management flow: Hydrogen currently sets `withPrivacyBanner: false`. Visitors in consent-required regions need a way to grant marketing permission.
4. With a production-safe test deployment, use Pinterest Tag Helper and Pinterest Events Manager **Test events**:
   - Visit homepage, a collection, then a product: expect one `PageVisit` per navigation.
   - Add one canvas product to cart: expect one `AddToCart` with correct product ID, quantity, currency, and value.
   - Add one more of that variant: expect an additional `AddToCart` with quantity **1** (not the full line quantity).
   - Remove a cart item: expect **no** `AddToCart`.
   - Verify test checkout remains handled only by Shopify's Pinterest app.
   - Revoke marketing consent and verify subsequent storefront actions do not send new Pinterest events.
5. Automated QA in an isolated checkout (no Oxygen deployment): `npm run lint`, `npm run typecheck`, and `npm test` passed; 277 tests across 39 files. The resulting CSP header was also inspected against Hydrogen's CSP implementation. These checks do not establish that browser events arrive in Pinterest Events Manager.

## Deployment automation

The current `.github/workflows/oxygen-deployment-1000173485.yml` uses `on: [push]` and deploys to Oxygen. **Keep this workflow disabled while this PR is under review**. Restore it only as part of an intentional deployment plan.

## References

- Shopify Hydrogen 2026-04 `useAnalytics`: https://shopify.dev/docs/api/hydrogen/2026-04/hooks/useanalytics
- Shopify Customer Privacy API: https://shopify.dev/docs/api/customer-privacy
- Pinterest event codes: https://help.pinterest.com/en/business/article/add-event-codes
