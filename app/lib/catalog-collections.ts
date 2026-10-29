import {isSuppressedCollection} from './merchandising';

export interface StorefrontCollectionRef {
  id: string;
  handle: string;
  title: string;
  products: {nodes: ReadonlyArray<{id: string}>};
}

export const FORMAT_COLLECTION_HANDLES = [
  'wall-art',
  'metal-wall-art',
  'canvas-art',
  'posters',
] as const;
export const SERIES_COLLECTION_HANDLES = [
  'blood-shadow',
  'carnivora',
  'chrome-thunder',
  'echoes-of-war',
  'red-requiem',
  'reel-legends',
  'the-veil-between-worlds',
  'tyrants-ruin',
  'urban-icon',
] as const;
const LIVE_COLLECTION_HANDLES = new Set<string>([
  ...FORMAT_COLLECTION_HANDLES,
  ...SERIES_COLLECTION_HANDLES,
]);
export const LIVE_COLLECTION_QUERY = [...LIVE_COLLECTION_HANDLES]
  .map((handle) => `handle:${handle}`)
  .join(' OR ');

export function isLiveCollectionHandle(handle: string) {
  return LIVE_COLLECTION_HANDLES.has(handle);
}

// Applied to every collection sitemap partition, leaving product dates intact.
export function filterCollectionSitemapXml(xml: string) {
  return xml.replace(/<url>[^]*?<\/url>/gi, (entry) => {
    const location = entry.match(/<loc>([^<]+)<\/loc>/i)?.[1];
    if (!location) return entry;
    const match = new URL(location).pathname.match(
      /^\/collections\/([^/]+)\/?$/,
    );
    return match && !isLiveCollectionHandle(decodeURIComponent(match[1]))
      ? ''
      : entry;
  });
}

export function isStorefrontSeriesCollection(
  collection: StorefrontCollectionRef,
) {
  return (
    (SERIES_COLLECTION_HANDLES as readonly string[]).includes(
      collection.handle,
    ) &&
    !isSuppressedCollection(collection) &&
    collection.products.nodes.length > 0
  );
}

export function storefrontSeriesCollections<T extends StorefrontCollectionRef>(
  collections: ReadonlyArray<T>,
) {
  return collections.filter(isStorefrontSeriesCollection);
}

export function storefrontSeriesCollectionsAlphabetical<
  T extends StorefrontCollectionRef,
>(collections: ReadonlyArray<T>) {
  return storefrontSeriesCollections(collections)
    .slice()
    .sort((left, right) => left.title.localeCompare(right.title));
}
