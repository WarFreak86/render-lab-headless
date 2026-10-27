# Render-Lab dependency-security audit — October 27, 2026

## Decision and scope

Apply the compatible security updates in this PR and retain the current Hydrogen/React Router release pairing. Use supported initial route discovery to bypass React Router's vulnerable lazy-manifest handler. This reduces exposure but does **not** make the remaining React Router package advisories disappear or prove the storefront vulnerability-free.

The reference [Actions run 40480975940](https://github.com/WarFreak86/render-lab-headless/actions/runs/40480975940), job 122110900600, successfully deployed commit `dde81cf`. Its audit steps continued after audit failures and reported **7 production package findings** and **43 full-tree package findings**, including one critical shell-quote finding. A fresh baseline audit of the same lockfile reproduced those counts. Successful CI/deployment was not evidence of a clean security audit.

This investigation distinguishes installed dependency-tree membership from code shipped in the Oxygen worker, then checks advisory prerequisites against this repository. No vulnerability payloads were sent to the production site. No deployment, checkout transaction, order, fulfillment job, DNS change, or Shopify mutation was performed.

## Before and after

| npm audit scope | Before | Proposed lockfile | Change |
| --- | --- | --- | --- |
| Production tree, `--omit=dev` | 7: 3 high, 4 moderate | 5: 1 high, 4 moderate | Vite and source-map-js findings removed |
| Full dependency tree | 43: 1 critical, 32 high, 8 moderate, 2 low | 28: 0 critical, 20 high, 6 moderate, 2 low | 15 package entries removed; critical shell-quote fixed |

These are npm's vulnerable-package entries, including packages flagged through their dependencies. They are not 43 distinct exploitable flaws, 7 independent production attack paths, or a count of deployed vulnerable modules. npm audit still exits 1 because retained findings remain; nothing was suppressed.

Raw before/after reports and the complete retained-package list are in [security/2026-10-27](security/2026-10-27/). The [remaining findings TSV](security/2026-10-27/remaining-findings.tsv) lists all 28 entries with installed paths, versions, exposure, and retention rationale.

## Production applicability, in priority order

| Finding | Applicability to this storefront | Action |
| --- | --- | --- |
| React Router framework-mode route-matching DoS, GHSA-chx6-hx7r-mcp5, high | **Relevant production risk before this PR.** The Oxygen fetch handler delegates to React Router Framework Mode, whose lazy manifest handler expands attacker-supplied paths. No claim that Oxygen runtime limits eliminate this risk. | Set `routeDiscovery.mode` to `initial`. The installed 7.16 handler then bypasses the special manifest endpoint. Regression and local production-preview checks verify the bypass. Upgrade the supported framework pairing later. |
| React Router backslash navigation bypass, GHSA-wrjc-x8rr-h8h6, moderate | **Conditional residual production risk.** Exploitation requires attacker-supplied navigation destinations. Inspected links/navigation primarily derive from application paths and Shopify handles; cart redirect handling already rejects backslashes/control characters. This is not a proof that every possible destination is safe. | Retain package finding and prioritize supported patched Router adoption. Do not broaden redirect/checkout behavior in this dependency patch. |
| React Router deserializeErrors constructor injection, GHSA-337j-9hxr-rhxg, moderate | **Conditional residual production risk.** SSR is enabled, but no application code matching the advisory's prerequisite of overwriting caught error metadata from attacker-controlled input was identified in the inspected error handling. | Retain finding; framework patch required for complete library-level resolution. |
| React Router RSC error-handler XSS, GHSA-h8fp-f39c-q6mh, moderate | **Not applicable to the configured rendering mode.** The app uses `ServerRouter` and `renderToReadableStream`, not unstable React Server Component APIs or an RSC Vite plugin. | Retain npm finding; do not claim it is exploitable merely because React Router is installed. |
| React Router RSC CSRF bypass, GHSA-qwww-vcr4-c8h2, high | **Not applicable to the configured rendering mode.** The advisory requires unstable RSC action APIs, which are not configured here. | Retain npm finding until a compatible framework patch. |
| Vite and bundled launch-editor findings, high aggregate | **Developer/build-tool exposure, not a deployed Vite server.** Vite appears under Hydrogen's production peer dependency graph, but the Oxygen worker serves the compiled application. Network-exposed dev servers/tunnels and editor integration remain relevant to developers. | Patch both installed Vite major lines: root 8.2.4 and nested 7.3.7. No Vite major upgrade. |
| source-map-js indexed-map offset DoS, high | **Build/test-time exposure in this repository.** It enters through PostCSS/Vite and JSDOM's CSS parser. No runtime import or application endpoint accepting source maps was found. | Patch 1.2.1 to 1.2.2. |
| shell-quote line-terminator command injection, critical | **Toolchain exposure, not shopper-request code.** Dependency path is GraphQL Codegen CLI hooks. The advisory needs attacker-controlled tokens after a comment token passed to a shell; no application runtime import exists. Treat malicious build input as a supply-chain concern. | Patch 1.10.0 to 1.12.0 within the parent's declared range. The critical audit finding is removed. |

The source map for the proposed production server bundle contains React Router, but no Vite, source-map-js, shell-quote, GraphQL Tools utils, MiniFlare, Undici, ws, body-parser, or Zod modules. See [bundle-review.json](security/2026-10-27/bundle-review.json). This is supporting evidence for this build, not a complete formal reachability proof or inspection of a newly deployed worker. Node package Undici is distinct from Oxygen's platform fetch implementation.

## Applied changes and compatibility

| Package or setting | Before | After | Compatibility basis |
| --- | --- | --- | --- |
| Vite root | 8.2.2 resolved under ^8.0.1 | 8.2.4, pinned | Same 8.2 patch line; supported by existing Hydrogen, MiniOxygen and Router peer ranges |
| Vite under vite-node | 7.3.6 | 7.3.7 | Same 7.3 patch line; remains within vite-node's Vite 7 range |
| Vitest / @vitest/mocker | 4.1.11 | 4.1.12 | Patch update fixes mock-registration/traversal findings |
| @graphql-codegen/cli | 7.4.0 | 7.4.6 | Patch update adopts fixed codegen/loaders/utilities through their own declared dependencies |
| source-map-js | 1.2.1 | 1.2.2 | Transitive patch within parent range |
| shell-quote | 1.10.0 | 1.12.0 | Same major, within CLI's ^1.7.3 range; patched release is >=1.11.0 |
| brace-expansion copies | 1.1.18 / 2.1.4 / 5.0.9 | 1.1.21 / 2.1.7 / 5.0.12 | Patch updates within each parent's existing major line |
| GraphQL CLI loader branch | Vulnerable utils 11/12 and legacy WebSocket executor | Updated parent packages use utils 12.1.0 and patched executor | Same-major parent updates; older Shopify codegen branch remains separately flagged |
| route discovery | Implicit lazy mode | Explicit initial mode | Supported Router configuration; installed Hydrogen preset permits the setting |

Hydrogen stays **2026.4.5**; React Router, react-router-dom, @react-router/dev and fs-routes stay **7.16.0**; React/React DOM stay **19.3.0**. No major Hydrogen, React Router or Vite upgrade, new override, `--force`, `--legacy-peer-deps`, or audit-fix command was used. Existing lodash override remains unchanged. Dependency install/update commands disabled lifecycle scripts.

Initial discovery sends route metadata up front instead of fetching it through `/__manifest`. Route component modules remain split and load on demand. The tradeoff is a larger initial manifest; no product data, checkout destination, route URL, canonical policy, or collection-filter semantics change. Local client navigation and variant selection were verified with this setting.

## Remaining vulnerabilities and why retained

| Group | Remaining npm entries | Why no further automatic fix |
| --- | --- | --- |
| Router/Hydrogen dependency chain | 5: react-router, react-router-dom, @react-router/dev, @react-router/node, @shopify/hydrogen | Actual Router fixes require 7.18.0, or 7.18.2 for RSC CSRF; 7.18.4 is available. Every inspected Hydrogen 2026.4.3–2026.4.8 release requires Router/dev ~7.16.0. Installing 7.18.x would violate those peers; initial discovery mitigates only the manifest DoS path. |
| Older Shopify codegen branch | 13: @graphql-codegen/add, plugin-helpers, schema-ast, typescript, typescript-operations, visitor-plugin-common; @graphql-tools/batch-execute, delegate, executor, utils, wrap; @shopify/graphql-codegen and hydrogen-codegen | Old Shopify codegen plugins retain utils 10.11.0/11.2.2. Available fixes are in utils >=12.0.2. A global override would cross library major boundaries beneath generated-type tooling. The top-level CLI patch fixes its newer branch but cannot safely rewrite Shopify's plugin constraints. No affected utilities are bundled into the Oxygen worker. |
| Local simulator/test stack | 10: @fastify/busboy, body-parser, cookie, @shopify/mini-oxygen, miniflare, qs, undici, ws, youch, zod | MiniOxygen 4.2.2 pins MiniFlare 3.20250310.1, body-parser 1.20.4 and Undici 7.24.0. Latest inspected 4.2.3 retains those pins. MiniFlare pins additional old Undici/ws and uses Zod 3. Updating Zod 3 to fixed 4.6.6 or the old MiniFlare Undici branch across major versions is not a safe transitive refresh. Other same-major fixes would still bypass vendor exact pins and require a separate emulator compatibility review. These packages do not appear in the worker source-map inventory. |

The simulator group includes multipart parsing/CRLF, HTTP client, WebSocket memory/DoS, request-body parsing, qs, cookie, and Zod findings. These remain relevant when developing with exposed local services or processing untrusted test/build inputs. Do not treat development-only as risk-free. No broad dependency overrides were added to make audit output appear clean.

npm proposes downgrading MiniOxygen to 0.0.5 or Hydrogen codegen to 0.2.1 for some dependency chains. Those are incompatible downgrade proposals, not safe remediation. npm also proposes Hydrogen 2026.10.2; this is a different Hydrogen release line whose preset/CLI/export behavior would need a migration review. Do not blindly combine it with Router 8, Vite 9, or npm's force recommendations. A follow-up should select an official supported Hydrogen/Router pairing, inspect migration notes, then repeat commerce, SSR, navigation, SEO and Oxygen-preview validation.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed, including Hydrogen codegen, React Router typegen and strict TypeScript.
- `npm test`: **40 files, 292 tests passed**, including two new runtime regression checks.
- `npm run build`: passed; generated client and Oxygen server output. No deployment command was run.
- Regression test compares a benign request against the real installed Router handler: lazy mode reaches the manifest handler; configured initial mode returns the normal 404 document. Product deep-link routing still returns 200.
- Local production preview, using MiniOxygen and the built worker: homepage, Carnivora collection and Cathedral product return 200; `/__manifest?version=security-check&paths=/products/example` returns 404 HTML instead of manifest processing. No exploit or stress payload was used.
- Chromium local preview: collection-to-product client navigation preserved a window sentinel, proving there was no full-page reload. `window.__reactRouterContext.routeDiscovery.mode` was `initial`; no manifest fetch was observed. Changing the product size updated URL and selected state, with Add to Cart price changing from $79 to $109. Canonical remained the production product URL. Browser console reported zero errors/warnings.
- Existing unit coverage includes variant selection/deep links, cart behavior, redirects, SEO, sitemap stability and analytics integration. Shopify analytics requests were observed returning 200 during local navigation. Pinterest campaign delivery was not independently certified by this audit.
- `git diff --check`: passed. Unrelated generated-type removal was restored after codegen.

The pre-existing use-resize-observer/React 19 peer warning persists; the nested React DOM 18 copy and all root React versions are unchanged from the baseline. Existing React Router future-flag and envFile deprecation warnings remain. No warning was suppressed. The repository-pinned Shopify CLI remains 4.7.1. Its preview command unexpectedly performed Shopify CLI's enabled automatic global update to 4.9.4; this completed outside the repository dependency tree and is a tooling side effect, not a storefront deployment. Future CLI runs can use a process-local CI environment to prevent this automatic update without changing persistent user preferences.

No checkout order, Gelato fulfillment job, customer-account login, or real payment was executed. There is no Gelato-specific storefront integration code or dependency in this repository to migrate; fulfillment is downstream of Shopify orders. Those external configurations and commerce contracts were left untouched. Local tests/build/browser checks support compatibility but do not certify an end-to-end live fulfillment transaction.

## Files, release safety and next action

Functional changes are limited to package.json, package-lock.json and the supported route-discovery setting, with its new regression test. The remaining files are this report and audit evidence. No application content, inventory, pricing, cart actions, checkout handlers, analytics implementation, fulfillment settings, SEO code, Cloudflare DNS, workflow or deployment configuration was edited.

Review the draft PR as a partial security reduction, not a complete Router remediation. After approval, deploy through the existing controlled release workflow and repeat a production smoke check. Prioritize a supported Hydrogen/Router migration next, followed by the vendor-pinned local tooling branches. No merge or deployment is authorized by this report.

## Primary sources

- [Reference Actions run](https://github.com/WarFreak86/render-lab-headless/actions/runs/40480975940)
- [Router manifest DoS advisory](https://github.com/advisories/GHSA-chx6-hx7r-mcp5)
- [Router backslash navigation advisory](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6)
- [Router SSR hydration advisory](https://github.com/advisories/GHSA-337j-9hxr-rhxg)
- [Router RSC XSS advisory](https://github.com/advisories/GHSA-h8fp-f39c-q6mh)
- [Router RSC CSRF advisory](https://github.com/advisories/GHSA-qwww-vcr4-c8h2)
- [Initial versus lazy route discovery](https://reactrouter.com/explanation/lazy-route-discovery)
- [Vite 8.2.4 fix for WASM file disclosure](https://github.com/advisories/GHSA-vfpm-58rq-9qcg)
- [Vite middleware advisory](https://github.com/advisories/GHSA-9jrq-w75r-8gcw)
- [source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)
- [shell-quote advisory](https://github.com/advisories/GHSA-pqg4-j6r4-53mv)
- [GraphQL Tools mergeDeep advisory](https://github.com/advisories/GHSA-7mx3-vvmw-hjmv)
- [GraphQL Tools incremental merge advisory](https://github.com/advisories/GHSA-c4qx-w738-7hr3)
- [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)

Registry metadata and installed source were checked on October 27, 2026. Vulnerability databases can change; retained raw reports describe this investigation window, not future audit results.
