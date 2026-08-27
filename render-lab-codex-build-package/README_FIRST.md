# Render-Lab Headless Shopify — Codex Build Package

This package is the source-of-truth handoff for building the approved Render-Lab headless Shopify storefront.

## Target architecture
- Domain: https://render-lab.org
- DNS: Cloudflare
- Commerce backend: Shopify
- Frontend: Hydrogen + React + TypeScript
- Hosting: Shopify Oxygen
- Checkout: Shopify Checkout
- Content: Shopify products, collections, metafields, and metaobjects

## Start here
1. Read `AGENTS.md`.
2. Read `docs/PROJECT_SPEC.md`.
3. Review every image in `references/`.
4. Read `docs/BUILD_PHASES.md`.
5. Read `docs/SHOPIFY_DATA_MODEL.md`.
6. Read `docs/CLOUDFLARE_OXYGEN_ARCHITECTURE.md`.
7. Use `docs/QA_ACCEPTANCE.md` after every phase.

Do not change production DNS during development. Build and validate on local Hydrogen and Oxygen preview deployments first.
