# Cloudflare + Oxygen Architecture

## Source of truth
Production storefront:
https://render-lab.org

### Responsibilities
Cloudflare:
- domain/DNS authority
- DNSSEC
- email-related DNS
- subdomain management
- redirects where appropriate

Shopify Oxygen:
- production Hydrogen hosting

Shopify:
- catalog
- variants
- inventory
- cart
- customers
- orders
- checkout

## Domain rules
- Keep render-lab.org at Cloudflare.
- Do not transfer the domain to Shopify.
- Do not change nameservers away from Cloudflare unless explicitly requested.
- Use https://render-lab.org as the production canonical origin.
- Prefer non-www as primary.
- Configure www.render-lab.org → https://render-lab.org as a permanent redirect at launch.
- Reserve checkout.render-lab.org/account.render-lab.org only if required by the final Shopify-supported configuration.

## Proxy rule
Do not assume an orange-cloud proxy is desirable for the Oxygen hostname.
Follow Shopify's currently supported Oxygen custom-domain requirements at deployment time.
Do not put an arbitrary Cloudflare Worker/reverse proxy/security challenge/caching layer in front of Oxygen without an explicit reason and support verification.

## Development
Do not modify production DNS.
Use:
- localhost for development
- Oxygen preview deployment for QA
- render-lab.org only after launch approval

## SEO
Production canonical URLs, sitemap URLs, OpenGraph URLs, structured data, and analytics origins must use:
https://render-lab.org

Never emit localhost, preview/Oxygen, myshopify.com, or www URLs as production canonical URLs.

## Launch sequence
1. Production QA passes
2. Back up existing Cloudflare zone
3. Preserve MX/TXT/SPF/DKIM/DMARC and unrelated records
4. Connect Oxygen custom domain using Shopify-supported flow
5. Apply only required DNS changes
6. Configure www redirect
7. Validate SSL
8. Test cart → Shopify checkout on production
9. Verify canonical URLs and redirects
10. Monitor launch
