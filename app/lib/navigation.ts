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
    title: 'Wall Art',
    items: [
      {title: 'All Wall Art', url: '/collections/wall-art'},
      {title: 'Metal Prints', url: '/collections/metal-wall-art'},
      {title: 'Canvas Prints', url: '/collections/canvas-art'},
      {title: 'Posters', url: '/collections/posters'},
    ],
  },
  {
    title: 'Collections',
    items: [
      {title: 'Quiet Horizons', url: '/collections/quiet-horizons'},
      {title: 'Botanical Anomalies', url: '/collections/botanical-anomalies'},
      {title: 'Nightmare Lab', url: '/collections/nightmare-lab'},
      {title: 'Neon Memento', url: '/collections/neon-memento'},
      {title: 'After Dark', url: '/collections/after-dark'},
      {title: 'View All Collections', url: '/collections'},
    ],
  },
  {
    title: 'Artists',
    items: [
      {title: 'Nico Vale', url: '/artists/nico-vale'},
      {title: 'View All Artists', url: '/artists'},
    ],
  },
];

export const PRIMARY_NAV_ITEMS: ReadonlyArray<NavigationItem> = [
  {title: 'Artists', url: '/artists'},
  {title: 'Bundles', url: '/collections/bundles'},
];
