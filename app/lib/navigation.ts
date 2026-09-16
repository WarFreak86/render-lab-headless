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

export interface StorefrontArtistRef {
  id: string;
  handle: string;
  name?: {value?: string | null} | null;
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

function buildArtistItems(artists: ReadonlyArray<StorefrontArtistRef>) {
  return artists
    .map((artist) => ({
      title: artist.name?.value?.trim() || artist.handle,
      url: `/artists/${artist.handle}`,
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function buildExploreNavGroups(
  collections: ReadonlyArray<StorefrontCollectionRef> = [],
  artists: ReadonlyArray<StorefrontArtistRef> = [],
): ReadonlyArray<NavigationGroup> {
  const collectionItems = storefrontSeriesCollectionsAlphabetical(collections).map(
    (collection) => ({
      title: collection.title,
      url: `/collections/${collection.handle}`,
    }),
  );
  const artistItems = buildArtistItems(artists);

  return [
    WALL_ART_GROUP,
    {
      title: 'Collections',
      items: [
        ...collectionItems,
        {title: 'View All Collections', url: '/collections'},
      ],
    },
    {
      title: 'Artists',
      items: [
        ...artistItems,
        {title: 'View All Artists', url: '/artists'},
      ],
    },
  ];
}

export const PRIMARY_NAV_ITEMS: ReadonlyArray<NavigationItem> = [
  {title: 'Wall Art', url: '/collections/wall-art'},
  {title: 'Materials', url: '/materials'},
  {title: 'Artists', url: '/artists'},
];
