import {normalizeStorefrontLink, PRODUCTION_ORIGIN} from './config';
import {isLiveCollectionHandle} from './catalog-collections';
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

// Only display genuine creator and studio identities. Retired fictional artist
// records remain in Shopify for archival purposes, but are not public profiles.
const PUBLIC_CREATOR_HANDLES = new Set(['jb-render', 'render-lab-studio']);
const RETIRED_CREATOR_HANDLES = new Set([
  'dante-mercer',
  'mara-voss',
  'kai-stratos',
  'nico-vale',
]);

export function isRetiredArtistHandle(handle: string) {
  return RETIRED_CREATOR_HANDLES.has(handle);
}

export function isStorefrontArtistReady(handle: string) {
  return PUBLIC_CREATOR_HANDLES.has(handle);
}

function buildArtistItems(artists: ReadonlyArray<StorefrontArtistRef>) {
  return artists
    .filter((artist) => isStorefrontArtistReady(artist.handle))
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
  const collectionItems = storefrontSeriesCollectionsAlphabetical(
    collections,
  ).map((collection) => ({
    title: collection.title,
    url: `/collections/${collection.handle}`,
  }));
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
      title: 'Our Studio',
      items: [...artistItems, {title: 'Meet Our Studio', url: '/artists'}],
    },
  ];
}

export const PRIMARY_NAV_ITEMS: ReadonlyArray<NavigationItem> = [
  {title: 'Wall Art', url: '/collections/wall-art'},
  {title: 'Materials', url: '/materials'},
  {title: 'Our Studio', url: '/artists'},
];

interface MenuLink {
  url?: string | null;
  items?: MenuLink[];
}

export function sanitizeMenuItems<T extends MenuLink>(items: T[]): T[] {
  return items.flatMap((item) => {
    const url = item.url ? normalizeStorefrontLink(item.url) : item.url;
    if (url?.startsWith('/')) {
      const path = new URL(url, PRODUCTION_ORIGIN).pathname;
      const collection = path.match(/^\/collections\/([^/]+)/)?.[1];
      const artist = path.match(/^\/artists\/([^/]+)/)?.[1];
      if (collection && !isLiveCollectionHandle(decodeURIComponent(collection)))
        return [];
      if (artist && !isStorefrontArtistReady(decodeURIComponent(artist)))
        return [];
    }
    return [
      {
        ...item,
        url,
        ...(item.items ? {items: sanitizeMenuItems(item.items)} : {}),
      },
    ];
  });
}

export function normalizeCreatorCredit(value: string) {
  return value.replace(
    /Dante Mercer|Kai Stratos|Mara Voss|Nico Vale/gi,
    'Render-Lab Studio',
  );
}
