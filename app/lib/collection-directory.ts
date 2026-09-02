import {isSuppressedCollection} from './merchandising';

export const COLLECTION_DIRECTORY_HANDLES = [
  'wall-art',
  'metal-wall-art',
  'canvas-art',
  'posters',
  'bundles',
] as const;

export type CollectionDirectoryHandle =
  (typeof COLLECTION_DIRECTORY_HANDLES)[number];

export interface CollectionDirectoryImage {
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
}

export interface CollectionDirectoryEntry {
  id: string;
  handle: string;
  title: string;
  description?: string;
  image: CollectionDirectoryImage | null;
  to: string;
}

export interface RawCollectionDirectoryEntry {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  image?: {
    url?: string | null;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  directoryGroups?: {value?: string | null} | null;
  products: {nodes: Array<{id: string}>};
}

export interface CollectionDirectoryPresentation {
  title: string;
  eyebrow: string;
  editorialHeading: string;
  description: string;
}

const COLLECTION_DIRECTORY_PRESENTATIONS: Record<
  CollectionDirectoryHandle,
  CollectionDirectoryPresentation
> = {
  'wall-art': {
    title: 'Wall Art',
    eyebrow: 'Wall art',
    editorialHeading: 'Art built to change the room.',
    description: 'Choose a collection, then explore only the artwork in that series.',
  },
  'metal-wall-art': {
    title: 'Metal Prints',
    eyebrow: 'Format / Metal',
    editorialHeading: 'Brushed aluminum. Maximum impact.',
    description: 'Explore collections available as gallery-grade metal prints.',
  },
  'canvas-art': {
    title: 'Canvas Prints',
    eyebrow: 'Format / Canvas',
    editorialHeading: 'Texture made for the wall.',
    description: 'Explore collections available as dimensional canvas prints.',
  },
  posters: {
    title: 'Posters',
    eyebrow: 'Format / Poster',
    editorialHeading: 'Easy to frame. Hard to ignore.',
    description: 'Explore collections available as accessible fine-art posters.',
  },
  bundles: {
    title: 'Bundles',
    eyebrow: 'Curated sets',
    editorialHeading: 'Better together.',
    description: 'Explore coordinated sets grouped by collection.',
  },
};

const NON_SERIES_HANDLES = new Set([
  ...COLLECTION_DIRECTORY_HANDLES,
  'frontpage',
  'digital-downloads',
  'limited-edition-clothing',
  'hoodies',
]);

export function isCollectionDirectoryHandle(
  handle: string,
): handle is CollectionDirectoryHandle {
  return COLLECTION_DIRECTORY_HANDLES.includes(
    handle as CollectionDirectoryHandle,
  );
}

export function getCollectionDirectoryPresentation(
  handle: CollectionDirectoryHandle,
) {
  return COLLECTION_DIRECTORY_PRESENTATIONS[handle];
}

function cleanText(value?: string | null) {
  const text = value?.trim();
  return text || undefined;
}

function parseDirectoryGroups(value?: string | null) {
  const text = cleanText(value);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return new Set(
        parsed.filter((item): item is string => typeof item === 'string'),
      );
    }
  } catch {
    // Plain-text metafields remain supported for simpler merchant setup.
  }

  return new Set(
    text
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function belongsToDirectory(
  collection: RawCollectionDirectoryEntry,
  directoryHandle: CollectionDirectoryHandle,
) {
  const configuredGroups = parseDirectoryGroups(
    collection.directoryGroups?.value,
  );
  if (configuredGroups) return configuredGroups.has(directoryHandle);

  if (directoryHandle === 'bundles') {
    return /(?:bundle|set)/i.test(`${collection.handle} ${collection.title}`);
  }

  return true;
}

function normalizeImage(
  collection: RawCollectionDirectoryEntry,
): CollectionDirectoryImage | null {
  if (!collection.image?.url) return null;
  return {
    url: collection.image.url,
    altText:
      cleanText(collection.image.altText) ??
      `${collection.title} collection artwork`,
    width: collection.image.width,
    height: collection.image.height,
  };
}

export function buildCollectionDirectoryEntries(
  collections: RawCollectionDirectoryEntry[],
  directoryHandle: CollectionDirectoryHandle,
): CollectionDirectoryEntry[] {
  return collections
    .filter(
      (collection) =>
        !NON_SERIES_HANDLES.has(collection.handle) &&
        !isSuppressedCollection(collection) &&
        collection.products.nodes.length > 0 &&
        belongsToDirectory(collection, directoryHandle),
    )
    .map((collection) => ({
      id: collection.id,
      handle: collection.handle,
      title: collection.title,
      description: cleanText(collection.description),
      image: normalizeImage(collection),
      to: `/collections/${collection.handle}`,
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}
