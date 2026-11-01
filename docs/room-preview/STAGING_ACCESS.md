# Room preview staging access

The application feature gate is disabled unless explicitly configured. It does not authenticate reviewers. Verify Oxygen's private-environment restrictions separately before claiming a deployment is private.

## Exact runtime configuration

Set these bindings **only on the approved Oxygen staging environment**:

```text
ROOM_PREVIEW_STAGING_ENABLED=true
ROOM_PREVIEW_STAGING_HOST=<exact-lowercase-staging-hostname>
```

Replace the placeholder with the actual hostname from the verified staging environment URL. Do not include `https://`, a port, path, query, trailing dot, whitespace, wildcard, or a list. For example, a test-only value is `reviewer-test.oxygen.shop`; that is not an approved or provisioned Render-Lab environment.

The flag accepts only the exact string `true`. Missing or malformed configuration denies access. Staging requests must use HTTPS on its default port and match the configured hostname exactly. IP addresses, localhost names, and production/commerce hosts cannot be configured as staging. The entire `render-lab.org` domain and its subdomains, plus `kn0xfa-4t.myshopify.com`, always deny the lab regardless of flags or build mode. Local HTTP/HTTPS development at localhost, 127.0.0.1 and ::1 remains available in development builds without staging bindings.

Leave the bindings absent (or set enablement to `false`) in production. Use Oxygen runtime bindings through `env`/`context.env`, never `VITE_` or browser/public environment variables. Do not copy production secrets into browser code or configuration files. The product loader exposes only a computed `roomPreviewEnabled` boolean. Changing Oxygen bindings requires following the platform's deployment/redeployment process; this change does not modify Shopify settings.

## Boundaries and verification

- The Worker rejects denied page/data requests before initializing sessions or Shopify context; the catalog loader enforces the same policy again.
- GET/HEAD only. All other visualizer methods return 405 after authorization. Production visualizer requests always return 404.
- Page/data responses retain `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: no-store`; the route remains outside sitemaps and public navigation. The one-product action is shown only when the server enables the current request.
- The flag does not modify cart mutations, purchase availability, checkout URLs, Shopify settings, or credentials. The visualizer still performs only the fixed pilot's read-only Storefront query and keeps its purchase control disabled.
- The host allowlist is feature routing, not identity-based access control. Verify logged-out denial and authorized staff access in Oxygen for pages, data requests, and assets; noindex is not authentication. Shared/bypass links can defeat staff-only restrictions.
- Before any deployment, confirm the actual staging environment/branch, native private access, approved hostname, server bindings, and retained production denial. Do not use development build mode to enable staging.

No staging hostname has been approved or configured by this code change. Nothing has been deployed.
