# Render-Lab indexing investigation — October 27, 2026

## Decision

1. **P1 confirmed technical defect, repaired in the proposed code:** product sitemap dates come from Shopify's unreliable sitemap-resource timestamps. Resolve each listed product's actual `Product.updatedAt`; omit dates when unavailable, invalid, or future-dated. Review and approve deployment separately.
2. **P2 confirmed collection weakness, reported only:** Alt History and Neon Speed are published but empty, and have no incoming links from the crawled HTML graph. Decide whether to populate and link them, or retire them, before requesting indexing. This change does not modify content, membership, sitemap policy, or navigation.
3. **Probable crawl scheduling delay for the 68 products, not a proven cause:** their public technical checks pass and GSC reportedly has no crawl date. The sitemap defect does not establish why Google has not fetched them. Indexing is not fixed or guaranteed by this PR.

## Scope and evidence

The user supplied the exact 70 affected URLs and reported “Discovered - currently not indexed”, with “N/A” last crawl dates. Public checks covered every supplied URL, all five sitemap partitions, 91 Storefront API products, and 127 HTML fetch observations including fragment variants and collection pagination. A parsed HTML document was inspected without executing client JavaScript. Links were normalized for homepage reachability; product variant query strings were normalized to product paths.

The row-level results are in [affected-url-audit.tsv](indexing-evidence/affected-url-audit.tsv); source URL list is in [affected-paths.txt](indexing-evidence/affected-paths.txt). [summary.json](indexing-evidence/summary.json) records the API timestamp comparison, partition counts, publication/availability observations, and checkout check. XML snapshots are dated observations, not new production output; files prefixed `proposed-` are local repair verification output.

| Check | Products (68) | Collections (2) |
| --- | --- | --- |
| Public GET response | 68 return 200; no redirect | Both 200; no redirect |
| Canonical, the preferred URL declared in HTML | One self-reference each | One self-reference each |
| HTML robots and X-Robots-Tag | No noindex | No noindex |
| Googlebot robots.txt rules | All clean paths allowed | Both clean paths allowed |
| Sitemap inclusion | 68/68 | 2/2 |
| Server-rendered content | All actual Shopify titles and descriptions present in HTML | Titles and collection copy present, no product cards |
| Shopify publication/availability | All returned by configured Storefront API; publishedAt present; all availableForSale=true | Both returned by API; products.nodes=[]; no next page |
| Crawlable collection product links | 68/68 have ordinary HTML anchors | No products to link |
| Homepage HTML-link depth | 65 at depth 2; 3 at depth 3 | Both unreachable in the audited graph |

Robots checks used the production rules in the captured robots.txt: clean product and collection paths are allowed; cart, account, search and selected filter combinations are restricted. Googlebot has no more-specific group overriding these clean-path results. The table concerns the supplied URLs, not all possible filtered or localized URL forms.

Publication is verified for the configured Storefront API context, not every Shopify sales channel or market. No Admin publication settings, customer data, checkout sessions, or mutations were accessed. The public checkout-domain homepage returned 200 with `<meta name="robots" content="noindex">`; its transactional robots restrictions remain in place. No checkout SEO code was changed.

## Confirmed product sitemap defect

The local route calls Hydrogen 2026.4.5 `getSitemap`, which queries `sitemap(type: PRODUCT).resources(page).items.updatedAt`. Hydrogen directly writes that field into `<lastmod>`. Neither the route nor the installed Hydrogen generator creates a local current-time fallback. The unreliable value originates in the Shopify PRODUCT sitemap resource.

Evidence collected without editing Shopify:

- The user observed the shared product dates move from 08:39:24Z to 08:40:03Z on October 27.
- Our direct sitemap API observation reported shared product dates of `2026-10-27T08:48:08Z`; a later independent query reported `2026-10-27T08:48:41Z`.
- Cathedral of the Void's actual product updatedAt remained `2026-10-25T02:28:19Z`. Art the Clown returned `2026-10-23T12:36:59Z`.
- The initial public product partition was cached with all 91 product dates at `2026-10-26T18:23:47Z`. A later query-string observation returned `2026-10-27T08:48:07Z`. Consecutive cached requests can therefore appear stable while still carrying inaccurate dates.
- All 91 public product dates disagreed with their actual product records. The actual records had 53 distinct timestamps.

| Partition | Public response | Result |
| --- | --- | --- |
| /sitemap/products/1.xml | 200; 91 products | Replace unreliable shared dates with per-product timestamps |
| /sitemap/products/2.xml | 200; homepage fallback only | API has no product items; preserve the existing fallback without lastmod |
| /sitemap/collections/1.xml | 200; 15 collections | Historical individual dates; unchanged |
| /sitemap/pages/1.xml | 200; 2 pages | Historical individual dates; unchanged |
| /sitemap/blogs/1.xml | 200; homepage fallback | Unchanged |

The sitemap index advertises two product partitions even though the second has no products. This is existing Shopify/Hydrogen behavior, not evidence of missing products: all 91 API-visible products are present in partition 1. No pagination rewrite is justified.

### Repair and tradeoffs

The child sitemap route retains Hydrogen's membership, partition handling, canonical host, suppression filter, cache headers and other XML fields. For successful product partitions only, a small helper looks up the actual listed products by exact handle, using alias batches of at most 50. It replaces product lastmod values with valid, non-future `Product.updatedAt` values. Lookup failure or missing data removes the optional lastmod field for affected entries; it never substitutes request time or sitemap-resource time.

The 91-product partition adds two small read-only API requests, using the existing Storefront client cache behavior. The HTTP sitemap cache remains 24 hours, so production verification must account for existing cached output after an approved deployment. Product.updatedAt is Shopify's actual modification timestamp, and can include inventory changes as well as editorial edits. Availability is visible storefront content, making this materially better than request time, but it is not an editorial-only change history. No dates are backdated or invented.

No copy, prices, artwork, inventory, variants, checkout, fulfillment, DNS, publication configuration, structured data, or unrelated SEO behavior changed.

## Collection findings and scheduling interpretation

`/collections/alt-history` and `/collections/neon-speed` have titles and descriptions but zero products in the API and zero product cards in server HTML. Neither has an incoming link from another page in the crawled homepage/collection/product graph. They are discoverable through the sitemap but provide no artwork browsing experience. This is a catalog/navigation decision, not a confirmed rendering bug; there is no authorized automatic content repair.

The strongest remaining alternative is that these pages are being deferred because they are empty and weakly connected. That is plausible, but no crawl date means Google has not yet provided evidence of a content assessment. Repeated indexing requests will not add useful content or links.

For the 68 products, ordinary HTML links, server HTML, publication, canonical and robots checks show no shared technical blocker. Google's scheduling remains the leading hypothesis, with unknown site history, Google crawl demand and host statistics. We cannot infer a penalty, a specific quality rejection, a crawl budget problem, or a guaranteed recovery date.

The 23 other published products provide public technical comparisons only. For example, `/products/still-standing-echoes-of-war`, `/products/first-line-echoes-of-war`, and `/products/concrete-saint-urban-icon` use the same storefront routes and pass the public checks. They are not verified indexed controls. The OpenSEO project lists the domain ownership account, but URL inspection returns `not_connected`; no independently confirmed indexed example or GSC crawl/performance history was available. No GSC project connection setting was changed.

## Manual inspection shortlist after an approved deployment

Verify the public sitemap output first; then inspect these five URLs in GSC. Live Test is useful for current access; the indexed inspection result is needed for Google's actual crawl/index state.

| URL | Action and reason |
| --- | --- |
| https://render-lab.org/products/cathedral-of-the-void | Live Test and request indexing once; direct timestamp comparison proves the repaired case |
| https://render-lab.org/products/carnivora-no-01-open-trap | Live Test and request once; representative of a different populated collection |
| https://render-lab.org/products/art-the-clown | Live Test and request once; another collection and a separately verified actual timestamp |
| https://render-lab.org/collections/alt-history | Inspect now to record the baseline; defer indexing request until intentionally populated and linked |
| https://render-lab.org/collections/neon-speed | Inspect now to record the baseline; defer indexing request until intentionally populated and linked |

Do not repeatedly request the same URLs. Submit or resubmit the existing sitemap once after verifying the deployed output, rather than submitting every product individually. Sitemap submission and indexing requests do not guarantee indexing.

## GSC follow-up, measured from deployment day

Record the deployment date and a fresh baseline export of this exact 70-URL cohort. Keep cohort counts separate from the site's overall counts so new products do not distort results. If deployment were October 27, the checks would be November 3 and November 10; no deployment has occurred as part of this investigation.

| Metric | Day 7 | Day 14 |
| --- | --- | --- |
| Pages report | Count cohort URLs still Discovered; count Indexed, Crawled-not-indexed, and new exclusion reasons; note report's update date | Compare the same cohort and transitions to baseline and day 7; distinguish a first crawl from actual indexing |
| URL Inspection | Record last crawl, crawl allowed, fetch result, indexing allowed, user canonical and Google-selected canonical for shortlist | Reinspect shortlist and any changed exclusions; investigate unexpected canonical choices or fetch failures |
| Sitemaps | Status Success, Last read after deployment, discovered URL count, partition fetch/parse errors | Confirm another successful read if available; dates remain accurate/stable when products did not change |
| Settings > Crawl stats | Host status, robots availability, DNS/server connectivity, total crawl requests, response-time trend and 4xx/5xx | Compare trends and host errors; these are sitewide, not proof of crawling this exact cohort |
| Performance > Search results | Filter affected pages for impressions, clicks and query coverage; allow GSC reporting lag | Compare impressions/pages with impressions; no impressions alone does not prove non-indexing |

If a product gets a first crawl but remains Crawled-not-indexed, inspect Google's rendered HTML and canonical decision before proposing further work. If there are still no crawl dates, check sitemap last-read freshness, host health and a larger representative inspection sample. Report the continuing uncertainty; do not change product content or add schema without a separate evidence-backed decision.

## Validation and limitations

- Final full local suite: 39 files, 290 tests passed; targeted sitemap suite: 14 tests passed.
- Typecheck including Hydrogen codegen and React Router type generation passed; standalone TypeScript check passed. Codegen removed stale pre-existing blog types, so that unrelated generated-file change was restored.
- Final lint and whitespace checks are recorded in the PR. Regression coverage includes different partitions, changed request times, individual product edits, invalid/missing/future timestamps, API failures, partial error metadata, bounded batches, suppression, fallback membership and untouched non-product sitemaps.
- A live read-only run of the repaired helper completed two timestamp batches for all 91 products and returned 53 distinct dates. Seven captured XML documents parsed successfully. Both proposed product partition outputs parsed, remained stable, and matched all actual per-product timestamps. This is well-formedness and entry/date validation, not an external XSD validator certification.
- External Shopify validation was not run: automatic approval review rejected uploading source and task text, and the user selected local validation only.
- Public checks are one investigation window, not historical Googlebot logs or a guarantee of availability in every region. HTML link checks show actual anchors without running JavaScript; they do not substitute for Google's rendered snapshot.

No deployment or merge was performed. The current main branch workflow deploys only on main pushes or manual dispatch. This PR uses a separate branch and a `[skip ci]` commit as an additional safeguard. Approval of this PR does not itself verify indexing; GSC must later confirm it.

## Sources

- [Google: sitemap lastmod must be consistently and verifiably accurate](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: URL Inspection and Discovered - currently not indexed](https://support.google.com/webmasters/answer/9012289?hl=en)
- [Google: requesting recrawls does not guarantee indexing](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
- [Shopify: Product.updatedAt and inventory updates](https://shopify.dev/docs/api/storefront/2026-04/objects/Product#field-Product.fields.updatedAt)
- [Shopify Hydrogen getSitemap](https://shopify.dev/docs/api/hydrogen/2026-04/utilities/getsitemap)
- [Public sitemap index](https://render-lab.org/sitemap.xml), [product partition 1](https://render-lab.org/sitemap/products/1.xml), [product partition 2](https://render-lab.org/sitemap/products/2.xml), [robots](https://render-lab.org/robots.txt)

Prepared using the [OpenSEO SEO Audit skill](https://openseo.so/docs/skills/seo-audit), constrained to the requested indexing investigation. No paid keyword, backlink, or AI-visibility research was needed. A fresh self-review checked the empty-collection alternative, all 70 rows, partition behavior, causal uncertainty, and the proposed validation claims.
