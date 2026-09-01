export interface NavigationItem {
  title: string;
  url: string;
}

export interface NavigationGroup {
  title: string;
  items: ReadonlyArray<NavigationItem>;
}

export const EXPLORE_NAV_GROUPS: ReadonlyArray<NavigationGroup> = [
  {
    title: 'Start Browsing',
    items: [
      {title: 'Wall Art', url: '/collections/wall-art'},
      {title: 'All Collections', url: '/collections'},
      {title: 'Bundles', url: '/collections/bundles'},
    ],
  },
  {
    title: 'Shop by Format',
    items: [
      {title: 'Metal Prints', url: '/collections/metal-wall-art'},
      {title: 'Canvas Prints', url: '/collections/canvas-art'},
      {title: 'Posters', url: '/collections/posters'},
    ],
  },
  {
    title: 'Featured Collections',
    items: [
      {title: 'Quiet Horizons', url: '/collections/quiet-horizons'},
      {title: 'Botanical Anomalies', url: '/collections/botanical-anomalies'},
      {title: 'Nightmare Lab', url: '/collections/nightmare-lab'},
      {title: 'Neon Memento', url: '/collections/neon-memento'},
      {title: 'After Dark', url: '/collections/after-dark'},
    ],
  },
  {
    title: 'Shop by Artists',
    items: [
      {title: 'Nico Vale', url: '/artists/nico-vale'},
      {title: 'View All Artists', url: '/artists'},
    ],
  },
];

export const PRIMARY_NAV_ITEMS: ReadonlyArray<NavigationItem> = [
  {title: 'Wall Art', url: '/collections/wall-art'},
  {title: 'Collections', url: '/collections'},
  {title: 'Artists', url: '/artists'},
  {title: 'Bundles', url: '/collections/bundles'},
];
