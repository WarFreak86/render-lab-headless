const GENERIC_CATALOG_LABELS = new Set([
  'all art',
  'wall art',
  'metal wall art',
  'metal prints',
  'canvas art',
  'canvas prints',
  'posters',
  'bundles',
  'hoodies',
]);

export interface ProductIdentity {
  artworkTitle: string;
  seriesTitle?: string;
}

export interface ProductSizeDimensions {
  width: number;
  height: number;
}

export function splitProductIdentity(title: string): ProductIdentity {
  const parts = title
    .split(/\s+[—–]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    artworkTitle: parts[0] ?? title,
    seriesTitle: parts.length > 1 ? parts.slice(1).join(' — ') : undefined,
  };
}

export function getProductContext(
  title: string,
  collectionTitle?: string | null,
) {
  const {seriesTitle} = splitProductIdentity(title);
  if (seriesTitle) return seriesTitle;

  const collection = collectionTitle?.trim();
  if (!collection || GENERIC_CATALOG_LABELS.has(collection.toLowerCase())) {
    return undefined;
  }

  return collection;
}

export function isGenericCatalogLabel(value?: string | null) {
  const label = value?.trim().toLowerCase();
  return Boolean(label && GENERIC_CATALOG_LABELS.has(label));
}

export function parseProductSizeDimensions(
  value?: string | null,
): ProductSizeDimensions | undefined {
  if (!value) return undefined;

  const match = value.match(
    /(\d+(?:\.\d+)?)\s*(?:in(?:ches)?|"|”)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:in(?:ches)?|"|”)?/i,
  );
  if (!match) return undefined;

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined;
  }

  return {width, height};
}
