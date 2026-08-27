# AGENTS.md — Render-Lab Headless Shopify

## Mission
Build a production-ready headless Shopify storefront for Render-Lab using the supplied approved mockups as the visual source of truth.

The storefront must feel like a premium interactive digital gallery and collector storefront, not a conventional Shopify theme.

## Hard architecture requirements
- Shopify is the commerce backend.
- Use Hydrogen with React + TypeScript.
- Prefer the current supported Shopify/Hydrogen patterns already present in the repository.
- Host production on Shopify Oxygen.
- Production domain: https://render-lab.org
- DNS remains managed by Cloudflare.
- Do not transfer the domain to Shopify.
- Do not modify production Cloudflare DNS during development.
- Do not introduce a custom reverse proxy, Cloudflare Worker, or alternate hosting layer in front of Oxygen unless explicitly requested.
- Use Shopify Checkout. Do not build custom payment processing.

## Visual rules
- The supplied reference screenshots are the primary visual source of truth.
- Reproduce hierarchy, composition, spacing, dark/gold palette, editorial typography, artwork prominence, interaction model, and premium tone.
- Do not copy obvious AI artifacts, fake review counts, fake pricing, fake edition counts, or placeholder claims.
- Artwork is the hero; UI must not visually compete with it.
- Gold is an accent, not a dominant fill color.
- Mobile must be intentionally designed, not merely collapsed desktop.

## Engineering rules
- TypeScript strict mode.
- Small reusable components.
- Centralized design tokens.
- GraphQL fragments for repeated Shopify data.
- URL state for collection filters.
- Avoid giant page components.
- Avoid `any` unless unavoidable and documented.
- Avoid hardcoded product-specific content in UI components.
- Use metafields/metaobjects for structured editorial and collector content.
- Respect accessibility and `prefers-reduced-motion`.
- Preserve working architecture unless replacement is justified.

## Commerce correctness
Variant changes must update:
- price
- availability
- selected options
- media where appropriate
- SKU where needed
- Add to Cart state

Cart must support:
- add variant
- remove item
- quantity updates
- subtotal updates
- persistence
- Shopify checkout handoff

Never display a static price that is disconnected from the selected Shopify variant.

## Workflow
For every phase:
1. Inspect the repository.
2. State the plan.
3. Implement the smallest coherent phase.
4. Run validation.
5. Report files changed, tests run, results, limitations, and next step.

Do not begin later phases while a P0/P1 issue from the current phase remains unresolved.

## Production safety
Do not touch production DNS, live checkout configuration, customer data, or destructive Shopify settings without explicit instruction.
