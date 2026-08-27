# Render-Lab launch runbook

Last audited: 2026-08-26

Current decision: **READY WITH CONFIGURATION BLOCKERS**

This document is the source of truth for the production deployment and domain cutover. Phase 8 did not deploy to Oxygen production, connect `render-lab.org`, change Cloudflare DNS, disable Shopify password protection, change checkout configuration, or complete a purchase.

## Current launch gates

### P0 — blocks public launch

- Shopify checkout currently redirects to `render-lab-3.myshopify.com/password` and displays Shopify's **Please Log In** store-password page. A public customer cannot complete checkout.
- Oxygen production deployment and the `render-lab.org` domain cutover have not been performed.

### P1 — complete before public traffic

- Create and verify the Production Oxygen environment variables listed below, including a Shopify-supported checkout domain if one is configured.
- Configure Customer Account API callback, JavaScript-origin, and logout URIs for the final public domain if customer accounts will be enabled at launch.
- Configure a consent mechanism and production analytics destinations; validate each required event once and prevent duplicate emissions.
- Back up the Cloudflare zone and preserve all non-storefront records before the DNS cutover.
- Resolve the React Router security advisories through a Shopify-supported Hydrogen upgrade path, then regression-test. Do not update React Router independently of Hydrogen's peer range and do not run `npm audit fix --force`.

### P2 — safe after launch

- Migrate the code-backed Limited Drop configuration to a merchant-editable Shopify Metaobject.
- Add shipping progress after the merchant supplies a real threshold and market/currency rules.
- Add product recommendations after a verified Shopify relationship source is configured.
- Create real Shopify About content and restore the navigation link if desired.
- Plan the optional `/collections/cavas` to `/collections/canvas` migration with a permanent redirect.
- Address development/build-only transitive audit findings as upstream packages publish compatible updates.

### P3 — optional

- Expand custom analytics beyond the core Shopify/Hydrogen events when a business reporting plan exists.
- Add optional launch content and merchandising enhancements that do not affect commerce correctness.

## Environment matrix

Never copy secrets into source control, issue trackers, chat, browser-visible loader data, or logs.

| Variable | Production requirement | Classification | Notes |
| --- | --- | --- | --- |
| `SESSION_SECRET` | Required | Secret, server-only | Use a strong production-specific value. Rotate if exposure is suspected. |
| `PRIVATE_STOREFRONT_API_TOKEN` | Required by the linked storefront setup | Secret, server-only | Must never be serialized to the browser. |
| `PUBLIC_STOREFRONT_API_TOKEN` | Required | Public credential | Intended for storefront use; still manage through Oxygen environment configuration. |
| `PUBLIC_STOREFRONT_ID` | Required | Public identifier | Must match the linked Hydrogen storefront. |
| `PUBLIC_STORE_DOMAIN` | Required | Public configuration | Shopify store domain used by Storefront API/Hydrogen. |
| `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` | Required if customer accounts are enabled | Public identifier | Must correspond to the configured Customer Account API client. |
| `PUBLIC_CUSTOMER_ACCOUNT_API_URL` | Required if customer accounts are enabled | Public configuration | Must match the Shopify-provided endpoint. |
| `SHOP_ID` | Required by current analytics setup | Public identifier | Confirm against the linked Shopify shop. |
| `PUBLIC_CHECKOUT_DOMAIN` | Recommended for the production topology | Public configuration | Host only, without `https://`. Set only after Shopify domain configuration is confirmed. |

The canonical production origin is intentionally fixed in application configuration as `https://render-lab.org`; preview/local requests are non-indexable. If the launch domain changes, update and retest the canonical-origin configuration before deployment.

## Shopify checkout gate

Read-only testing proved that valid Storefront Cart API checkout URLs are created, but the checkout host redirects to `/password`. The returned page is Shopify's store password page and links the merchant to Online Store password preferences. This is a Shopify publication/password gate, not a cart-creation defect and not caused by Oxygen.

Merchant/admin resolution, to be performed only with launch approval:

1. In Shopify Admin, confirm the store's plan/ownership status and that the store is eligible for public customer checkout. If this is a development store, complete the required transfer or plan activation first.
2. In **Online Store > Preferences**, review password protection and remove the password only when the merchant is ready for public access.
3. In **Settings > Domains**, confirm the domain Shopify will use for checkout. For a Hydrogen architecture, Shopify documents using a separate subdomain targeted to Online Store checkout; choose and configure the actual merchant-approved hostname rather than assuming one.
4. If a custom checkout hostname is configured, set `PUBLIC_CHECKOUT_DOMAIN` in the Oxygen Production environment to that hostname without a scheme. Ensure the Content Security Policy allows the public storefront and checkout origins.
5. Create a fresh cart in an incognito browser, follow its checkout URL, and verify the customer reaches checkout without a password or admin login.
6. Complete one merchant-authorized test order using an approved Shopify test-payment method, then verify order creation, taxes, shipping, email, and cancellation/refund handling. Do not use a real charge merely to prove routing.

Public checkout access is mandatory. A custom checkout domain is recommended for first-party continuity and Shopify consent behavior, but it must be based on the domain topology actually configured in Shopify Admin.

## Customer accounts

Before enabling accounts on the public domain:

1. Configure `https://render-lab.org/account/authorize` as the Customer Account API callback URI.
2. Configure `https://render-lab.org` as an allowed JavaScript origin.
3. Configure the corresponding public logout URI required by the account client.
4. Repeat the configuration for any merchant-approved `www` behavior only if that host serves the application rather than redirecting.
5. Verify sign-in, callback, account pages, logout, an expired session, and direct navigation in a private browser.

Do not run `shopify hydrogen customer-account-push` during an audit; it changes Shopify Admin configuration.

## Cloudflare and domain cutover safety

Planned request path: `render-lab.org` → Cloudflare DNS → Oxygen → Hydrogen → Shopify APIs/checkout.

- Connect the custom domain in Shopify/Oxygen first and use only the exact record targets Shopify supplies. Do not invent CNAME or A/AAAA values.
- Export or otherwise record the full Cloudflare zone before editing.
- Preserve MX, TXT, SPF, DKIM, DMARC, domain-verification records, and every unrelated subdomain.
- Change only the storefront records required by Shopify. Never replace the entire Cloudflare zone.
- Decide one canonical host. The application currently treats `render-lab.org` as canonical; configure `www.render-lab.org` as a permanent redirect to the apex unless Shopify's supplied setup requires a different documented topology.
- Keep proxy/TLS settings aligned with Shopify's current custom-domain instructions. Validate certificate issuance and redirect loops before public traffic.
- Configure the checkout/customer-account hosts only after Shopify Admin provides and accepts them. Preserve their DNS records separately from the Hydrogen storefront records.

## URL and content continuity

- Preserve existing `/products/:handle` and `/collections/:handle` URLs wherever possible.
- Keep `/collections/cavas` unchanged for launch. If the merchant later chooses `/collections/canvas`, create a 301 redirect, update internal links and navigation, update the canonical, regenerate the sitemap, and monitor 404s before retiring the old handle.
- About is an optional content gap. Create actual Shopify About content first, then restore the navigation link. Do not ship fabricated placeholder copy.

## Future Shopify content configuration

### Limited Drop Metaobject

The current drop is intentionally code-backed. A later merchant-controlled migration should:

1. Define a storefront-readable `Limited Drop` Metaobject in Shopify with fields for `title`, `slug`, `heroMedia`, `description`, `releaseDate`, `endDate`, `editionSize`, `products`, `story`, `collectorBenefits`, and `badge`.
2. Match each current code-backed field to the definition, using product/media references and structured lists instead of unvalidated text where appropriate.
3. Grant Storefront API read access and keep merchant editing permissions aligned with store ownership.
4. Create and validate entries in a non-production environment.
5. Query the Metaobject through the Storefront API, preserve the existing typed route fallback during migration, and add query/error tests.
6. Remove the code-backed source only after the merchant entry, preview rendering, SEO, and commerce path have passed.

This is not a launch blocker for the current release.

### Shipping progress

The UI must remain hidden until the merchant supplies a legitimate free-shipping threshold and its market/currency applicability. Store the threshold in merchant-controlled configuration, expose it through typed server data, and test below/equal/above-threshold states plus currency changes before enabling it.

### Product recommendations

Do not fabricate relationships. A later implementation may use merchant-curated complementary products from Shopify Search & Discovery or a supported Storefront API recommendation source. Add empty-state handling and only render relationships returned by the verified source.

## Analytics and consent

- Hydrogen's centralized `Analytics.Provider` is the integration boundary. Do not scatter vendor calls through components.
- Core Shopify/Hydrogen coverage must be verified for page view, product view, collection view, search, cart view, add/remove cart lines, and checkout transition.
- Business events such as `select_item`, `filter_collection`, `view_drop`, and a custom `begin_checkout` should be emitted through one typed adapter only if reporting requirements need them.
- Configure a consent banner/manager appropriate to the merchant's markets before enabling non-essential destinations. The current application does not present a native privacy banner.
- Add real production IDs only through environment configuration. Do not commit or fabricate GA4, GTM, Meta, or TikTok identifiers.
- Validate in Shopify analytics tools and each configured destination, checking payload accuracy and duplicate events.

## Security and dependency handling

- Keep preview and local deployments out of search indexes with both robots metadata/headers and a preview-disallowing `robots.txt` policy.
- Preserve the application CSP and security headers; retest checkout, images, accounts, and analytics whenever new origins are introduced.
- `.env` files and local Shopify state must remain ignored. Repeat a secret-pattern scan before every release.
- Review `npm audit` with practical runtime scope. Resolve React Router runtime advisories through a Shopify-supported Hydrogen release that accepts the patched router version. Then run the entire validation matrix.
- Treat GraphQL codegen, MiniOxygen, Shopify CLI, and related local tooling findings separately from the Oxygen runtime bundle, but continue tracking compatible upstream fixes.
- Never use a forced audit fix on the launch branch.

## Ordered production launch procedure

Do not execute these steps without explicit production-launch approval.

1. Fix launch-blocking Shopify configuration.
2. Validate public checkout access.
3. Confirm production environment variables.
4. Deploy production to Oxygen.
5. Smoke-test Oxygen production deployment before custom domain where possible.
6. Back up Cloudflare DNS.
7. Connect `render-lab.org` to Oxygen using Shopify-supported configuration.
8. Configure the `www` redirect.
9. Preserve unrelated DNS records.
10. Validate SSL.
11. Verify canonical URLs.
12. Verify sitemap.
13. Verify robots.
14. Verify analytics.
15. Test real checkout.
16. Validate customer-account flow if enabled.
17. Monitor 404/error logs.
18. Monitor cart/checkout.
19. Monitor analytics events.
20. Submit or update search-engine indexing tools if appropriate.

## Verified Oxygen preview

Final Phase 8 preview: `https://01m0zs86wqe944k94t91vr8y3j-33f3413deaa5b9cf334a.myshopify.dev`

The deployment is private by default and requires an authorized Shopify/Oxygen login after the short-lived audit credential expires. Home, collection, product, drop, cart, search, the branded 404, `robots.txt`, and `sitemap.xml` were smoke-tested. HTML responses carried the preview `noindex` directive, the unknown route returned HTTP 404, and Oxygen served `Disallow: /` for preview robots.

## Production acceptance checklist

Phase 8 checks are marked complete only when they were actually verified locally or against Shopify's read-only APIs. Production-only checks remain open.

### Storefront

- [x] Core routes render branded UI and one page-level heading.
- [x] Real Shopify collection/product data renders.
- [x] Unknown routes render a branded not-found boundary.
- [ ] Oxygen production routes smoke-tested.
- [ ] Public custom-domain routes smoke-tested.

### Commerce

- [x] Art variant add-to-cart, quantity update, reload persistence, and checkout URL verified.
- [x] Apparel variant add-to-cart, quantity update, reload persistence, and checkout URL verified.
- [x] Shopify cart mutation validator passed, including cleanup.
- [ ] Merchant-authorized test order completed without a password gate.

### Mobile

- [x] Critical routes passed the 390, 430, 768, 1024, 1440, and 1920 px regression matrix.
- [x] No horizontal overflow found in the audited matrix.
- [ ] Final physical-device sanity check on the public domain.

### SEO

- [x] Canonicals, metadata, structured data, robots helpers, and sitemaps audited locally.
- [x] Preview/local noindex strategy implemented.
- [ ] Production-domain canonical, sitemap, robots, and status codes verified after cutover.

### Accessibility

- [x] Static JSX accessibility lint passed.
- [x] Skip link, dialog labels, Escape dismissal, focus restoration, alt text, heading count, and control names audited.
- [x] Core design-token contrast samples meet WCAG AA.
- [ ] Final assistive-technology and physical keyboard check on production.

### Analytics

- [x] Central Hydrogen analytics architecture audited.
- [ ] Consent mechanism configured for launch markets.
- [ ] Production analytics identifiers configured.
- [ ] Required events validated without duplicates.

### Security

- [x] CSP and security headers audited and hardened.
- [x] No tracked `.env` history or source files matching high-confidence secret patterns found in the Phase 8 scan.
- [ ] React Router runtime advisories resolved through a compatible Hydrogen release.
- [ ] Production response headers revalidated.

### Oxygen

- [x] Local production build passes.
- [x] Hydrogen storefront linkage and Production/Preview environments confirmed.
- [x] Preview deployment smoke-tested.
- [ ] Production deployment completed and smoke-tested.

### Cloudflare

- [ ] Full DNS backup captured.
- [ ] Shopify-provided Oxygen targets recorded.
- [ ] Storefront records changed without disturbing MX/TXT/SPF/DKIM/DMARC or unrelated subdomains.
- [ ] Apex, `www`, TLS, and redirect behavior verified.

### Checkout

- [x] Checkout URLs resolve to the configured Shopify checkout host.
- [x] Current `/password` root cause documented.
- [ ] Store publication/password gate resolved by the merchant.
- [ ] `PUBLIC_CHECKOUT_DOMAIN` set if a custom checkout host is configured.
- [ ] Public incognito checkout and merchant-authorized test transaction pass.

### Post-launch monitoring

- [ ] 404 and server error rates monitored.
- [ ] Cart and checkout conversion monitored.
- [ ] Analytics events monitored for gaps or duplicates.
- [ ] Search indexing, sitemap processing, and canonical selection reviewed.
- [ ] Rollback owner and decision threshold confirmed.

## Rollback readiness

Before cutover, record the previous storefront DNS records, Oxygen deployment identifier, responsible launch owner, and a time-bounded rollback threshold. A rollback must restore only the storefront records captured in the backup; it must not disturb mail, verification, or unrelated subdomains.
