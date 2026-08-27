# QA and Acceptance

## Every phase
Run as applicable:
- typecheck
- lint
- unit tests
- component tests
- production build

Report exact pass/fail status.

## Visual
Compare against references for:
- hierarchy
- proportions
- spacing
- typography
- artwork prominence
- dark/gold palette
- cards/surfaces
- button hierarchy
- responsive behavior

Do not reproduce AI-generated typos or fake data from mockups.

## Commerce
Required:
- selected variant drives price
- unavailable variant disables purchase
- Add to Cart uses correct merchandise ID
- quantity updates subtotal
- remove item works
- cart persists
- checkout URL valid
- sold-out behavior correct
- shipping threshold recalculates
- no full-page reload for cart actions

## Responsive
Validate:
- 390
- 430
- 768
- 1024
- 1440
- 1920

Check:
- no horizontal overflow
- touch targets
- readable type
- no clipped art focal points
- drawers trap focus
- sticky CTA doesn't cover content
- filters usable

## Accessibility
- keyboard only
- visible focus
- Escape closes drawers/modals
- focus returns to invoker
- screen-reader labels
- contrast
- semantic heading order
- reduced motion

## SEO
- canonical = https://render-lab.org
- metadata
- Product schema
- Breadcrumb schema
- Organization schema
- sitemap
- robots
- OpenGraph
- no preview URLs in production

## Performance
Target:
- LCP < 2.5s
- CLS < 0.1
- INP < 200ms where practical
- responsive images
- lazy-load secondary media
- clean console

## Definition of done
- approved key pages implemented
- Shopify data connected
- variants/pricing correct
- cart and checkout correct
- drops lifecycle correct
- mobile intentional
- production build passes
- no P0/P1 issues
