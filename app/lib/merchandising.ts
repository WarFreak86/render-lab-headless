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
  if (!URL.canParse(value)) return false;
  const match = new URL(value).pathname.match(
    /^\/(products|collections)\/([^/]+)\/?$/,
  );
  if (!match) return false;
  const [, type, handle] = match;
  return type === 'products'
    ? isSuppressedProduct({handle})
    : isSuppressedCollection({handle});
}

export function filterSuppressedSitemapXml(xml: string) {
  return xml.replace(/<url>[^]*?<\/url>/gi, (entry) => {
    const location = entry.match(/<loc>([^<]+)<\/loc>/i)?.[1];
    return location && isSuppressedSitemapLocation(location) ? '' : entry;
  });
}
