# Project Spec

## Brand and experience
Render-Lab is a premium art and apparel storefront. The approved direction is cinematic, dark, collector-focused, and editorial.

### Core design language
- Near-black / charcoal base
- Warm off-white primary text
- Restrained collector-gold accents
- High-contrast editorial serif for major headings
- Clean sans-serif for UI
- Large artwork-first compositions
- Subtle borders and surface separation
- Minimal visual clutter
- Premium motion rather than playful motion

### Suggested design tokens
Backgrounds:
- #050505
- #080808
- #0C0C0C
- #111111

Surfaces:
- #141414
- #181818
- #1C1C1C

Primary text:
- #F5F2EA

Secondary text:
- #A8A39B

Gold accent:
- #C99A45
- #D7AC5B

Borders:
- rgba(255,255,255,0.10)
- hover: rgba(215,172,91,0.55)

### Typography
Editorial/display: high-contrast serif such as Cormorant Garamond, Bodoni Moda, or DM Serif Display.
Interface: Inter, Manrope, Geist, or equivalent.

## Global header
Desktop:
- announcement bar
- Render-Lab logo
- Art Prints
- Metal Prints
- Canvas Prints
- Digital Downloads
- Apparel
- Collections
- About
- search
- account
- cart

Mobile:
- menu
- centered logo
- cart

Header becomes solid/dark on scroll and remains sticky.

## Homepage
- split cinematic hero
- editorial headline
- supporting copy
- primary + secondary CTA
- artwork dominates visual weight
- explore-by-category cards
- featured collections
- trust strip
- limited-drop preview
- optional restrained image parallax / reveal motion

## Collection page
- editorial collection hero
- desktop filter sidebar
- mobile filter sheet/drawer
- Shopify-backed sorting
- 3–4 cards desktop, 2 mobile
- artwork-first product cards
- badges only when backed by real data
- wishlist/quick-add only if implemented correctly

## Product page
Desktop target: ~60/40 gallery/purchase layout.

Gallery:
- vertical thumbnails
- large primary media
- zoom/fullscreen
- room scene / alternate media support

Purchase panel:
- breadcrumbs
- product type
- title
- rating if real
- dynamic price
- variant controls
- size/material/finish selectors
- Add to Cart with live price
- Buy Now / accelerated checkout where supported
- availability
- edition information if applicable

Mobile:
- swipe gallery
- title, rating, price
- selectors
- CTA
- details accordions
- optional sticky purchase CTA after main controls scroll out of view

## Cart drawer
Desktop right-side drawer, ~420–520px.
Mobile may use full-screen cart.

Include:
- cart title/item count
- shipping progress
- line items
- variant info
- quantity controls
- remove
- subtotal
- shipping message
- checkout
- optional product recommendations

Use optimistic updates where practical. No page reloads.

## Limited drop / apparel page
- editorial hero
- countdown with prelaunch/live/sold-out/ended states
- product gallery
- size/fit/variant selectors
- edition/scarcity data only from configured data
- story/editorial sections
- collector benefits
- product/material details
- no video section in the approved direction

## Apparel requirements
Support:
- front
- back
- sleeve/detail
- fabric
- care
- fit
- size
- color where applicable
- AOP imagery without destructive cropping

## Motion
Micro: 120–180ms
UI: 200–300ms
Editorial: 400–700ms
Respect reduced motion.

## Performance targets
- LCP < 2.5s
- CLS < 0.1
- INP < 200ms where practical
- responsive image sizes
- lazy load non-critical media
- preload only critical hero assets
- code split and defer secondary content

## Accessibility
Target WCAG 2.2 AA:
- keyboard navigation
- visible focus
- semantic HTML
- focus trap in drawers/modals
- Escape closes overlays
- sufficient contrast
- appropriate ARIA
- reduced-motion support
