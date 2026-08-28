export interface NavigationItem {
  title: string;
  url: string;
}

export const COLLECTION_NAV_ITEMS: ReadonlyArray<NavigationItem> = [
  {title: 'Wall Art', url: '/collections/wall-art'},
  {title: 'Metal Prints', url: '/collections/metal-wall-art'},
  {title: 'Canvas Prints', url: '/collections/cavas'},
  {title: 'Digital Downloads', url: '/collections/digital-downloads'},
  {title: 'Apparel', url: '/collections/hoodies'},
  {title: 'All Collections', url: '/collections'},
];

export const PRIMARY_NAV_ITEMS: ReadonlyArray<NavigationItem> = [
  {title: 'Drops', url: '/drops/marine-heavyweight-oversized-hoodie'},
];
