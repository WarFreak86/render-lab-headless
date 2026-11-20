/**
 * Clothing categories are independent Shopify collections. Keep this small and
 * explicit: don't expose an empty category or send garment shoppers to wall art.
 *
 * Adding a new category requires a Shopify collection with the matching handle,
 * a category entry here, and a matching alias in the directory Storefront query.
 */
export const APPAREL_CATEGORIES = [
  {
    slug: 'hoodies',
    collectionHandle: 'hoodies',
    title: 'Hoodies',
    productLabel: 'Graphic hoodie',
    heroLead: 'Graphic',
    heroEmphasis: 'hoodies.',
    description: 'Artist-designed fleece hoodies with all-over artwork, available in sizes M–4XL.',
    seoTitle: 'Graphic Hoodies & All-Over-Print Fleece | Render-Lab',
    seoDescription: 'Shop Render-Lab graphic fleece hoodies with original art, sizing charts and detailed front, back and sleeve views.',
    deliveryNote:
      'Made to order. Estimated production takes 2–7 business days, followed by standard shipping of 6–9 business days in the contiguous U.S. or 13–16 business days to U.S. remote areas. These are estimates, not guaranteed delivery dates.',
  },
  {
    slug: 't-shirts',
    collectionHandle: 't-shirts',
    title: 'T-Shirts',
    productLabel: 'Graphic T-shirt',
    heroLead: 'Graphic',
    heroEmphasis: 'tees.',
    description: 'Original artwork on everyday graphic T-shirts.',
    seoTitle: 'Graphic T-Shirts | Render-Lab',
    seoDescription: 'Shop artist-designed graphic T-shirts at Render-Lab. Explore current designs, garment specifications and available sizes.',
    deliveryNote: null,
  },
  {
    slug: 'sweatshirts',
    collectionHandle: 'sweatshirts',
    title: 'Sweatshirts',
    productLabel: 'Graphic sweatshirt',
    heroLead: 'Artful',
    heroEmphasis: 'layers.',
    description: 'Art-driven sweatshirts and crewnecks.',
    seoTitle: 'Graphic Sweatshirts & Crewnecks | Render-Lab',
    seoDescription: 'Discover Render-Lab graphic sweatshirts and crewnecks with original artwork and detailed product guidance.',
    deliveryNote: null,
  },
  {
    slug: 'jackets',
    collectionHandle: 'jackets',
    title: 'Jackets',
    productLabel: 'Graphic jacket',
    heroLead: 'Wearable',
    heroEmphasis: 'art.',
    description: 'Original graphic outerwear, when new styles are available.',
    seoTitle: 'Graphic Jackets & Outerwear | Render-Lab',
    seoDescription: 'Explore artist-designed jackets and outerwear at Render-Lab.',
    deliveryNote: null,
  },
] as const;

export type ApparelCategory = (typeof APPAREL_CATEGORIES)[number];

export function getApparelCategory(slug: string | undefined) {
  return APPAREL_CATEGORIES.find((category) => category.slug === slug);
}

export function getApparelCategoryByCollectionHandle(handle: string | undefined) {
  return APPAREL_CATEGORIES.find((category) => category.collectionHandle === handle);
}

/** Product-page breadcrumbs should only link to an established garment category. */
export function getApparelCategoryByProductType(type: string | null | undefined) {
  const label = type?.toLowerCase() ?? '';
  if (/hoodie/.test(label)) return getApparelCategory('hoodies');
  if (/t[ -]?shirt|\btees?\b/.test(label)) return getApparelCategory('t-shirts');
  if (/sweatshirt|crewneck/.test(label)) return getApparelCategory('sweatshirts');
  if (/jacket|outerwear/.test(label)) return getApparelCategory('jackets');
  return undefined;
}
