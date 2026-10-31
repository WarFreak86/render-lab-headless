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

## Codex + Influence → Execution skills
The owner specifically means their custom **Influence → Execution: Codex Skill Pack v1.0**, created on October 31, 2026, supplied as `Codex_Influence_to_Execution_Skillpack_v1.zip`. **Do not use or refer to `vbuild` as the intended skill set.**

The seven custom skills are:
1. `outcome-brief` — define the measurable buyer problem, prototype boundary and success/failure criteria.
2. `authoritative-context` — establish source-of-truth requirements from this repository, real Shopify data and approved design references.
3. `diagnose-before-edit` — inspect existing Hydrogen routes, product media and variant handling before touching code.
4. `minimal-scope-builder` — deliver only the isolated `/lab/3d` room prototype; avoid an entire 3D storefront rewrite.
5. `adversarial-verification` — look for incorrect prices, mismatched artwork, nonfunctional controls, mobile regressions and production leakage.
6. `release-readiness` — enforce verified nonproduction preview, test evidence and explicit permission before any production release.
7. `ethical-influence-design` — improve clarity and buyer confidence using truthful visual scale/material comparison and no fabricated scarcity, testimonials, or pressure tactics.

**Codex must use the actual instructions included in each locally installed skill, not merely these summaries.** If missing, install from the user's ZIP (`./install.ps1 -Scope User` on Windows from the unpacked pack) and verify with `/skills`; do not claim they are installed without checking. They were previously packaged but installation in a live Codex session has not been confirmed.

Also use applicable Hydrogen and frontend/React performance skills for framework correctness. This custom pack governs outcomes, scope, diagnosis, verification and ethical product design; it does not replace platform-specific technical references.

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
