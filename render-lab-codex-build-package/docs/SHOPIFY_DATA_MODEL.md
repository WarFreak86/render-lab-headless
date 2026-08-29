# Shopify Data Model

Use Shopify Admin as the source of commerce truth.

## Native Shopify data

Use native fields for:

- product title
- description
- product media
- variants
- prices
- inventory/availability
- collections
- tags where appropriate

## Suggested metafields

Product:

- custom.edition_size
- custom.artwork_story
- custom.artist_note
- custom.material_description
- custom.care_instructions
- custom.product_highlights
- custom.collector_information
- custom.release_date
- custom.drop_end_date
- custom.badge
- custom.room_mockups
- custom.related_medium_handles
- custom.fit_notes
- custom.fabric_details

Collection:

- custom.editorial_heading
- custom.editorial_copy
- custom.hero_media
- custom.directory_groups (list of single-line text values using collection
  handles such as `wall-art`, `metal-wall-art`, `canvas-art`, `posters`, and
  `bundles`)
- custom.artist (metaobject reference to Artist)

## Suggested metaobjects

### Homepage Hero

- title
- eyebrow
- body
- primary CTA label/link
- secondary CTA label/link
- media

### Limited Drop

- title
- handle/slug
- hero media
- description
- release date
- end date
- edition size
- product references
- story
- collector benefits

### Material

- name
- description
- feature list
- close-up media

### Artwork Story

- title
- body
- media
- related product

### Collector Benefit

- icon
- title
- description

### Room Scene

- title
- media
- scale/reference notes
- associated products

### Artist

- name
- biography
- photo
- profile_url

Create the Artist metaobject definition first, then create the
`custom.artist` collection metafield definition that references it. Create an
Artist entry and assign it to each relevant collection. The Hydrogen collection
query reads the referenced fields and renders the artist section only when an
artist name is present.

## Product relationships

If the same artwork is sold as Metal, Canvas, and Digital as structurally separate Shopify products, do not fake them as variants. Store relationships using product references/metafields/metaobjects.

## Data integrity

Never invent:

- remaining quantity
- review count
- edition size
- rating
- shipping promise
- returns promise
- fake price
- fake scarcity
- fake payment terms

Placeholder content must be clearly identified in development.
