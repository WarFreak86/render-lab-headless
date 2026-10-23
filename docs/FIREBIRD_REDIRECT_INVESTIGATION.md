# Firebird redirect investigation — 2026-10-23

The saved Shopify redirect is currently working. No runtime correction is
justified by the observed behavior. This change adds regression coverage while
preserving the existing Shopify-managed redirect system.

## Verified responses

Source: `/products/firebird-rising-1977-pontiac-firebird-trans-am`

Destination: `/products/firebird-rising-1972-pontiac-firebird-trans-am`

| Check                                                                      | Result                                        |
| -------------------------------------------------------------------------- | --------------------------------------------- |
| Public Oxygen source, direct GET and HEAD                                  | 301, Location is the destination above        |
| Public source with Chrome user agent and Cache-Control: no-cache           | Same 301                                      |
| Public source with Finish and Size parameters                              | 301, parameters retained at destination       |
| Public source with trailing slash                                          | 301 to the destination without trailing slash |
| Public destination                                                         | 200                                           |
| Public cart                                                                | 200                                           |
| Source on checkout.render-lab.org                                          | 301 to the corrected product path             |
| Local MiniOxygen source, using the actual router and configured API client | 301 to the destination                        |
| Local MiniOxygen destination and cart                                      | Both 200                                      |
| Local /&                                                                   | 404, with no homepage redirect                |

Public redirect responses identify Shopify Oxygen. No redirect response carried
an Age or Cache-Control header. Cloudflare DNS and Shopify domain configuration
were not edited or inspected in the admin; there is no evidence of a current
domain-routing failure.

## Request flow and permissions

- `app/routes/products.$handle.tsx` throws a Response with status 404 when
  Shopify returns no product for the requested handle.
- React Router renders that missing-product response. `server.ts` checks its
  HTTP status and calls the installed Hydrogen 2026.4.5 `storefrontRedirect`
  helper only for 404 responses.
- The helper queries `urlRedirects` with
  `path:/products/firebird-rising-1977-pontiac-firebird-trans-am`. Matching
  ignores query parameters by default and strips trailing slashes. The helper
  emits HTTP 301 for a direct document request and preserves option parameters.
- Both locally configured public and private Storefront clients retrieved the
  exact saved path and target without GraphQL errors using API version 2026-04
  and CacheNone. Each also returned 301 when passed to the real redirect helper.
- Shopify requires `unauthenticated_read_content` for UrlRedirect. Successful
  reads demonstrate effective access for both tested tokens; no scope changes
  are needed. Production environment token values were not retrieved, compared,
  or exposed. The live redirect independently verifies current production access.
- `app/lib/context.ts` passes PUBLIC_STORE_DOMAIN and both Storefront tokens to
  createHydrogenContext, which prefers the private token when configured.

## Historical 404 and caching

The earlier 404 cannot be reproduced during this investigation. Its historical
cause is not established: no time-correlated Oxygen error logs or record of the
redirect's creation/propagation time was available.

The installed helper logs failed API reads and returns the original 404. Its
query does not override caching: the client's default policy is maxAge 1 second
with staleWhileRevalidate 86399 seconds. A cached empty result before the redirect
was saved is a possible transient explanation, as is propagation delay. Neither
is proven. Fresh reads and repeated live requests now return the expected target.
Changing tokens, bypassing all redirect caching, or hardcoding Firebird would
therefore be speculative and is intentionally avoided.

If the issue recurs, capture the exact URL, request time, response headers, and
Oxygen deployment/request identifiers. Check matching Oxygen logs for
`Failed to fetch redirects from Storefront API`, then compare a fresh redirect
query with the storefront response before changing scope or caching settings.

## Regression coverage and validation

`app/test/server-redirect.test.ts` exercises the server entry point with the real
Hydrogen redirect helper and mocked Storefront responses. It covers the actual
missing-product loader's thrown 404, direct GET/HEAD, query preservation,
trailing-slash matching, other Shopify-managed targets, absent redirects, API
failures, preview noindex headers, and unchanged product/cart responses including
cart POST redirects and session cookies. React Router rendering is mocked in
these unit tests; the local MiniOxygen HTTP checks above cover the actual router.

`vitest.config.ts` supplies an empty virtual server build only in tests; the
request handler is mocked by the server test. Runtime Vite configuration and
`server.ts` are unchanged.

- Full Vitest suite: 38 files, 271 tests passed, including 12 new redirect tests.
- ESLint: passed.
- TypeScript (`tsc --noEmit`): passed with existing generated route/API types.
- Existing CartMain tests verify quantity updates, removal, Shopify subtotal,
  and the exact Shopify-provided checkout URL. No order, payment, product, or live
  checkout configuration was changed; no purchase was performed.
- Local and public direct HTTP checks: source 301, destination 200, cart 200.
- Shopify's external code validator was blocked by automatic approval review
  because it could transmit repository test source. Local tests, lint, and
  TypeScript checks were used instead; no source was sent to that validator.

The draft PR uses a `[skip ci]` commit because this repository's push workflow
includes Oxygen deployment. Tests were run locally; no deployment or merge was
requested. The local CLI automatically upgraded its global installation from
4.7.1 to 4.9.4 during dev-server startup; repository dependencies were unchanged.

## References

- [Hydrogen 2026-04 storefrontRedirect](https://shopify.dev/docs/api/hydrogen/2026-04/utilities/storefrontredirect)
- [Storefront UrlRedirect access scope](https://shopify.dev/docs/api/storefront/2026-04/objects/UrlRedirect)
