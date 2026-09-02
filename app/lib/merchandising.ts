export interface MerchandisableCollectionIdentity {
  handle: string;
  title?: string | null;
}

const SUPPRESSED_COLLECTION_HANDLES = new Set([
  'nightmare-lab',
  'nightmare-lab-halloween-2026',
]);

export function isSuppressedCollection(
  collection: MerchandisableCollectionIdentity,
) {
  const handle = collection.handle.trim().toLocaleLowerCase();
  const title = collection.title?.trim().toLocaleLowerCase() ?? '';

  return (
    SUPPRESSED_COLLECTION_HANDLES.has(handle) ||
    title === 'nightmare lab' ||
    title.startsWith('nightmare lab —') ||
    title.startsWith('nightmare lab -')
  );
}
