import {
  storefrontSeriesCollectionsAlphabetical,
  type StorefrontCollectionRef,
} from './catalog-collections';

export interface NavigationItem {
  title: string;
  url: string;
}

export interface NavigationGroup {
  title: string;
  items: ReadonlyArray<NavigationItem>;
}

const WALL_ART_GROUP: NavigationGroup = {
  title: 'Wall Art',
  items: [
    {title: 'All Wall Art', url: '/collections/wall-art'},
    {title: 'Metal Wall Art', url: '/collections/metal-wall-art'},
    {title: 'Canvas Prints', url: '/collections/canvas-art'},
    {title: 'Posters', url: '/collections/posters'},
  ],
};

const ARTISTS_GROUP: NavigationGroup = {
  title: 'Artists',
  items: [
    {title: 'Nico Vale', url: '/artists/nico-vale'},
    {title: 'Mara Voss', url: '/artists/mara-voss'},
    {title: 'Dante Mercer', url: '/artists/dante-mercer'},
    {title: 'View All Artists', url: '/artists'},
  ],
};

export function buildExploreNavGroups(
  collections: ReadonlyArray<StorefrontCollectionRef> = [],
): ReadonlyArray<NavigationGroup> {
  const collectionItems = storefrontSeriesCollectionsAlphabetical(collections).map(
    (collection) => ({
      title: collection.title,
      url: `/collections/${collection.handle}`,
    }),
  );

  return [
    WALL_ART_GROUP,
    {
      title: 'Collections',
      items: [
        ...collectionItems,
        {title: 'View All Collections', url: '/collections'},
      ],
    },
    ARTISTS_GROUP,
  ];
}

export const PRIMARY_NAV_ITEMS: ReadonlyArray<NavigationItem> = [
  {title: 'Wall Art', url: '/collections/wall-art'},
  {title: 'Materials', url: '/materials'},
  {title: 'Artists', url: '/artists'},
];
