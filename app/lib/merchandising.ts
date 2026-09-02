export interface MerchandisableCollectionIdentity {
  handle: string;
  title?: string | null;
}

export interface MerchandisableProductIdentity {
  handle: string;
  title?: string | null;
  imageUrl?: string | null;
}

const SUPPRESSED_COLLECTION_HANDLES = new Set([
  'nightmare-lab',
  'nightmare-lab-halloween-2026',
]);

const SUPPRESSED_COLLECTION_HANDLE_MARKERS = ['placeholder'];
const SUPPRESSED_PRODUCT_HANDLE_MARKERS = [
  'nightmare-lab',
  'nightmare-icons',
  'placeholder',
];
const SUPPRESSED_TITLE_MARKERS = ['nightmare lab', 'placeholder'];
const SUPPRESSED_ASSET_MARKERS = ['nightmare-lab'];
const SUPPRESSED_SITEMAP_MARKERS = [
  '/collections/nightmare-lab',
  '/collections/comic-placeholder',
  '/collections/ww2-placeholder',
  '/products/nightmare-lab',
  '-nightmare-lab',
  '/products/nightmare-icons',
  '/products/harly-placeholder',
  '/products/hell-placeholder',
];

function normalized(value?: string | null) {
  return value?.trim().toLocaleLowerCase() ?? '';
}

function containsMarker(value: string, markers: ReadonlyArray<string>) {
  return markers.some((marker) => value.includes(marker));
}

export function isSuppressedCollection(
  collection: MerchandisableCollectionIdentity,
) {
  const handle = normalized(collection.handle);
  const title = normalized(collection.title);

  return (
    SUPPRESSED_COLLECTION_HANDLES.has(handle) ||
    containsMarker(handle, SUPPRESSED_COLLECTION_HANDLE_MARKERS) ||
    containsMarker(title, SUPPRESSED_TITLE_MARKERS)
  );
}

export function isSuppressedProduct(product: MerchandisableProductIdentity) {
  const handle = normalized(product.handle);
  const title = normalized(product.title);

  return (
    containsMarker(handle, SUPPRESSED_PRODUCT_HANDLE_MARKERS) ||
    containsMarker(title, SUPPRESSED_TITLE_MARKERS) ||
    isSuppressedMerchandisingAssetUrl(product.imageUrl)
  );
}

export function isSuppressedMerchandisingAssetUrl(url?: string | null) {
  if (!url) return false;
  const value = normalized(url);
  return containsMarker(value, SUPPRESSED_ASSET_MARKERS);
}

export function isSuppressedSitemapLocation(value: string) {
  const location = normalized(value);
  return containsMarker(location, SUPPRESSED_SITEMAP_MARKERS);
}

export function filterSuppressedSitemapXml(xml: string) {
  return xml.replace(/<url>[^]*?<\/url>/gi, (entry) =>
    isSuppressedSitemapLocation(entry) ? '' : entry,
  );
}
