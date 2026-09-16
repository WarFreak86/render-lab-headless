import {isSuppressedCollection} from './merchandising';

export interface StorefrontCollectionRef {
  id: string;
  handle: string;
  title: string;
  products: {nodes: ReadonlyArray<{id: string}>};
}

const STRUCTURAL_COLLECTION_HANDLES = new Set([
  'wall-art',
  'metal-wall-art',
  'canvas-art',
  'posters',
  'bundles',
  'frontpage',
  'digital-downloads',
  'limited-editions',
  'limited-edition-clothing',
  'hoodies',
]);

export function isStorefrontSeriesCollection(
  collection: StorefrontCollectionRef,
) {
  return (
    !STRUCTURAL_COLLECTION_HANDLES.has(collection.handle) &&
    !isSuppressedCollection(collection) &&
    collection.products.nodes.length > 0
  );
}

export function storefrontSeriesCollections<
  T extends StorefrontCollectionRef,
>(collections: ReadonlyArray<T>) {
  return collections.filter(isStorefrontSeriesCollection);
}

export function storefrontSeriesCollectionsAlphabetical<
  T extends StorefrontCollectionRef,
>(collections: ReadonlyArray<T>) {
  return storefrontSeriesCollections(collections).slice().sort((left, right) =>
    left.title.localeCompare(right.title),
  );
}
