# Build Phases

## Phase 0 — Repository audit
- Identify current Hydrogen/Shopify versions
- Inspect package manager, routes, GraphQL, styling, tests, deployment config
- Report current architecture and risks
- Do not rewrite yet

## Phase 1 — Foundation
- Hydrogen storefront connection
- routing
- design tokens
- fonts
- base layout
- announcement bar
- header
- footer
- shared buttons/drawers/accordions
- local + preview environment sanity

Exit criteria:
- typecheck/build pass
- Shopify product and collection queries work
- cart initialization works

## Phase 2 — Homepage
Implement approved homepage:
- hero
- category rail
- featured collections
- trust strip
- limited-drop preview
- desktop/mobile behavior

## Phase 3 — Collection
- editorial hero
- filters
- URL-backed filter state
- sort
- responsive product grid
- mobile filter drawer
- pagination/infinite strategy

## Phase 4 — Product
- gallery
- product data
- variant selectors
- dynamic price
- availability
- Add to Cart
- tabs/accordions
- edition module
- room-preview entry point

Heavy QA required before proceeding.

## Phase 5 — Cart
- cart drawer/fullscreen mobile cart
- quantity
- remove
- shipping threshold
- subtotal
- checkout
- recommendations

## Phase 6 — Limited Drops + Apparel
- drop route
- countdown lifecycle
- notify/live/sold-out states
- apparel fit/size support
- editorial story
- collector benefits

## Phase 7 — Mobile polish
Validate at:
- 390
- 430
- 768
- 1024
- 1440
- 1920

Focus on:
- typography scaling
- touch targets
- gallery behavior
- sticky CTA
- filters
- cart
- navigation

## Phase 8 — SEO / Analytics / Accessibility / Performance
- canonical URLs
- Product/Breadcrumb/Organization structured data
- sitemap
- robots
- GA4 / Shopify analytics integration boundary
- axe / keyboard
- Lighthouse
- reduced motion

## Phase 9 — Commerce regression
Test:
1. Home → collection → product → variant → cart → checkout
2. Drop → apparel size → cart → qty update → checkout
3. Mobile collection → filter → product → cart
4. Sold-out/unavailable variants
5. Empty cart and error states

## Phase 10 — Oxygen production readiness
- preview QA
- production env vars
- canonical origin = https://render-lab.org
- no preview URLs leaking into SEO
- production build clean
- DNS remains untouched

## Phase 11 — Controlled launch
Only after explicit approval:
- back up Cloudflare DNS
- connect Oxygen custom domain
- preserve MX/TXT/SPF/DKIM/DMARC and unrelated records
- configure www redirect
- validate SSL
- verify redirects
- complete real checkout test
- monitor 404s, JS errors, API errors, checkout and analytics
