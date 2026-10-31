# Render-Lab 3D Showroom — isolated prototype

**Status:** DESIGN/DEVELOPMENT ONLY. Do not deploy or merge to production.

## Goal
Prove whether an interactive artwork room preview improves product confidence. The approved direction combines the *Cinematic Gallery* homepage concept with the *Interactive Room* product concept. The 3D Art Archive is deferred.

## Isolation
- GitHub repository: `WarFreak86/render-lab-headless`
- Branch: `feature/3d-showroom-prototype-2026-10-31`
- Production domain: `render-lab.org`; NEVER change its DNS, Shopify domain, deployment target, or route behavior without express authorization.
- Keep all experimental UI in a nonproduction-only `/lab/3d` route (return 404 for production hostname), mark noindex, exclude from public navigation and sitemap.
- Do not alter live homepage/product/collection components, product records, prices, inventory, checkout, shipping, Gelato, analytics, SEO/canonicals, or feed.
- Review preview deployment workflow and target before deploying. A Git branch alone does not guarantee an Oxygen deployment is safe.
- Use a *draft* PR only and never auto-merge.

## Codex + skills
The owner asked to use their Codex skills and `vbuild`. The exact skill named `vbuild` is not discoverable from this ChatGPT session. **Codex must list local skills and read that skill's instructions before using it.** Do not substitute an unrelated package/tool with a similar name. Supported installed skills include frontend-app-builder, React best practices and hydrogen-storefront.

## Starter provided separately
An isolated, nonproduction 2.5D demonstration is available as `RenderLab_3D_Prototype_Starter.zip` in the accompanying conversation. It contains:
- `lab.3d.tsx` → install to `app/routes/lab.3d.tsx`
- `lab-3d.css` → install to `app/styles/lab-3d.css`
- `BUILD_BRIEF.md` → comprehensive Codex instructions

The starter is **not committed** with this file and has **not been browser-tested**. Codex should integrate it in a checkout of this branch, inspect and modify for the live schema, and run all checks before opening a draft PR.

## Phase-one acceptance criteria
1. Render real published Shopify artwork, not an invented product or a preview-room image used as a print texture.
2. Metal/canvas switch, size preview, room preset and angle controls visibly respond.
3. Size presets are grounded in real products; prototype is explicitly marked relative-scale until calibrated.
4. No checkout is wired to simulated variant controls; actual commerce keeps its existing tested code.
5. Keyboard, mobile and reduced-motion behavior work; static fallback if 3D is unsupported.
6. Run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`, followed by desktop/mobile screenshots and interaction checks.
7. Only deploy to a *verified* nonproduction preview; seek explicit approval before a production release.

## Business decision
Measure mobile speed, size/material selection engagement, add-to-cart and checkout progression. Do not spend time on a full immersive 3D world until the focused viewer proves useful.
