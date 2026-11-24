# Render-Lab replacement Shopify migration checkpoint
_Observed 2026-11-23, America/New_York; destination queried live, no deployment._

## Safety and identity
- Source: `kn0xfa-4t.myshopify.com` — leave operating.
- Destination: `ca510a-1w.myshopify.com`, Shopify Shop GID `gid://shopify/Shop/103251870010`.
- Public domain: `https://render-lab.org`; checkout: `checkout.render-lab.org` — **no domain or DNS move**.
- GitHub `main` remained at `c10c13ec9a0abacfc96cd76c383fb0fec2c6aeca` when verified.
- Recovered tree: `7abbfe3e44c2a2aa51aea8134222cef006cbe2d2`.
- Isolated branch: `migration/ca510a-1w`, initial commit `2c6d7c24edc6161f6c70c9b0df7a4e627d3b5c3a`.
- Migration branch removes three source-account deployment workflows, updates four frontend files and includes `docs/REPLACEMENT_STORE_SETUP.md`. **Not deployed.**
- Original scratch path no longer exists in the current working environment.

## Reconciled live destination counts

| Resource | Count or state |
|---|---:|
| Products | 242 — all DRAFT, zero ACTIVE |
| Variants | 1,276 |
| Collections | 29 (frontpage collection contains 0 products) |
| Pages | 2 |
| Menus | 3 (main, footer, customer account) |
| Redirects | 18 |
| Shopify Files | 642; all READY |
| Metaobject definitions | 19 |
| Metaobject records | 117, including 6 artist records |
| Metafield definitions | 37 |
| Active destination shipping profiles | One `General profile`, with 3 active methods; actual rate/fulfillment suitability NOT verified |
| Locations | One active `Shop location` |
| Current merchant display name | **My Store** (must become Render-Lab) |

Private destination ID lookup checkpoint independently saved as a Google Doc titled `Render-Lab Destination Shopify Migration ID Checkpoint — 2026-11-23`. It includes all destination product/variant IDs, SKUs, selected option pairs, 29 collection IDs, and 117 metaobject IDs, rebuilt from read-only Admin queries. Reconcile source IDs by handles and option combinations; never reuse source GIDs.

### Source status preservation
The original ZIP snapshot contains 99 ACTIVE, 36 DRAFT, and 107 ARCHIVED source products. They were intentionally imported as drafts. **Never bulk-activate 242 products.** Decide the launch subset only after end-to-end fulfillment and checkout testing and restore original status distinctions intentionally.

### Policies
- Refund, shipping and terms policy bodies match the source backup character-for-character (verified with matching length and UTF-16 FNV-1a checksums).
- Contact-information policy differs from source (Shopify-generated formatting and fields).
- Privacy policy differs from source; it still identifies the merchant as **My Store** and includes temporary destination domain links.
- The connection lacks policy-writing scope. No permission bypass; restore/review in destination Shopify Admin, including data-sharing rights and correct identity/links.

### App/channel facts
- Installed apps queried live: **Messaging** and **Shopify ChatGPT MCP App** only.
- **No Hydrogen, Gelato, Printful, Printify, Subliminator or other print fulfillment app** installed as of the check.
- Existing publications: Online Store, Point of Sale, Shop; **no Hydrogen publication**.
- New customer accounts are enabled; guest checkout is allowed. Verify callback, logout and JS origins after Hydrogen setup.
- Shipping has 3 active general methods but provider rates, services and sample checkout totals remain unverified.
- Read-only `shopifyPaymentsAccount` query returned null and the shop reported no digital wallets. Payment onboarding/verification still requires the merchant.
- Test order, tax setup, marketing channel ID mapping and tracking are not yet verified.

### Known content exceptions
Three original `shopify.finish` list-metaobject attributes could not be restored under current product-category constraints:
- `pink-crown-urban-icon`
- `queens-cipher-urban-icon`
- `street-empire-urban-icon`

All three originally referred to source metaobject `gid://shopify/Metaobject/212438909089`. **Preserve the value as evidence only; do not transplant this source GID.** Find a valid destination taxonomy reference or leave the field unset with an audit note.

## Required next sequence
1. Merchant signs into destination Shopify Admin, changes display name to Render-Lab, reviews business/notification info and manually corrects privacy/contact policies.
2. Install Hydrogen sales channel and set up a **new destination Hydrogen storefront**, attaching `migration/ca510a-1w`, not `main`; generate new storefront credentials/environment values and deployment token.
3. Reconnect the actual fulfillment providers to destination; map the existing destination variants to provider SKUs/masters (do **not** republish duplicate products).
4. Configure and test shipping profiles, rates, taxes, payment account and required payout/identity verification.
5. Publish only a tiny approved test subset to destination Hydrogen, validate preview pages, option combinations, cart, account sign-in, checkout, provider routing, notification and analytics event IDs.
6. Do an authorized destination test order, reconcile source changes since ZIP snapshot and obtain explicit cutover approval.
7. Only then move `render-lab.org` and `checkout.render-lab.org` and perform rollback-ready monitoring. Do not shut down original store.

## Backup provenance
Original source backup Library ID: `libfile_79fae253a794819181aa6cd75203c1b2`; filename `Render-Lab-Replacement-Store-Package.zip`, snapshot captured 2026-11-24 03:52 UTC. It is a pre-import snapshot, not a post-migration checkpoint.
