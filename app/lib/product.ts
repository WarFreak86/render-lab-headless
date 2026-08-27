export interface ProductImageData {
  id: string;
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
}

export interface ProductEditorialData {
  artworkStory?: string;
  artistNote?: string;
  badge?: string;
  careInstructions?: string;
  collectorInformation?: string;
  editionSize?: string;
  fabricDetails?: string;
  fitNotes?: string;
  highlights: string[];
  materialDescription?: string;
  roomImages: ProductImageData[];
}

export interface ProductPageData {
  breadcrumb?: {handle: string; title: string};
  editorial: ProductEditorialData;
  gallery: ProductImageData[];
}

interface RawImage {
  id?: string | null;
  url?: string | null;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

interface RawMetafield {
  value?: string | null;
  references?: {
    nodes?: Array<{
      id?: string | null;
      image?: RawImage | null;
    } | null> | null;
  } | null;
}

export interface RawProductPage {
  title: string;
  media?: {
    nodes?: Array<{
      id?: string | null;
      image?: RawImage | null;
    } | null> | null;
  } | null;
  collections?: {
    nodes?: Array<{handle: string; title: string} | null> | null;
  } | null;
  artworkStory?: RawMetafield | null;
  artistNote?: RawMetafield | null;
  badge?: RawMetafield | null;
  careInstructions?: RawMetafield | null;
  collectorInformation?: RawMetafield | null;
  editionSize?: RawMetafield | null;
  fabricDetails?: RawMetafield | null;
  fitNotes?: RawMetafield | null;
  productHighlights?: RawMetafield | null;
  materialDescription?: RawMetafield | null;
  roomMockups?: RawMetafield | null;
}

export interface VariantLike {
  availableForSale: boolean;
  selectedOptions: Array<{name: string; value: string}>;
}

const UUID_ALT_TEXT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function metafieldText(field?: RawMetafield | null) {
  const value = field?.value?.trim();
  return value || undefined;
}

function normalizeAltText(altText: string | null | undefined, title: string) {
  const value = altText?.trim();
  if (!value || UUID_ALT_TEXT.test(value)) return `${title} artwork`;
  return value;
}

function normalizeImage(
  image: RawImage | null | undefined,
  title: string,
  fallbackId?: string | null,
): ProductImageData | undefined {
  if (!image?.url) return undefined;
  return {
    id: image.id || fallbackId || image.url,
    url: image.url,
    altText: normalizeAltText(image.altText, title),
    width: image.width,
    height: image.height,
  };
}

export function parseMetafieldList(field?: RawMetafield | null) {
  const value = metafieldText(field);
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Plain text metafields remain useful when merchants do not use a list type.
  }

  return value
    .split(/\r?\n|\s*\|\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeProductPage(product: RawProductPage): ProductPageData {
  const gallery = (product.media?.nodes ?? [])
    .map((node) => normalizeImage(node?.image, product.title, node?.id))
    .filter((image): image is ProductImageData => Boolean(image));

  const roomImages = (product.roomMockups?.references?.nodes ?? [])
    .map((node) => normalizeImage(node?.image, product.title, node?.id))
    .filter((image): image is ProductImageData => Boolean(image));
  const breadcrumb = product.collections?.nodes?.find(Boolean) ?? undefined;

  return {
    breadcrumb: breadcrumb
      ? {handle: breadcrumb.handle, title: breadcrumb.title}
      : undefined,
    gallery,
    editorial: {
      artworkStory: metafieldText(product.artworkStory),
      artistNote: metafieldText(product.artistNote),
      badge: metafieldText(product.badge),
      careInstructions: metafieldText(product.careInstructions),
      collectorInformation: metafieldText(product.collectorInformation),
      editionSize: metafieldText(product.editionSize),
      fabricDetails: metafieldText(product.fabricDetails),
      fitNotes: metafieldText(product.fitNotes),
      highlights: parseMetafieldList(product.productHighlights),
      materialDescription: metafieldText(product.materialDescription),
      roomImages,
    },
  };
}

export function variantMatchesSelection(
  variant: VariantLike,
  selection: Record<string, string>,
) {
  return Object.entries(selection).every(([name, value]) =>
    variant.selectedOptions.some(
      (option) => option.name === name && option.value === value,
    ),
  );
}

export function resolveVariant(
  variants: VariantLike[],
  selection: Record<string, string>,
) {
  return variants.find((variant) =>
    variantMatchesSelection(variant, selection),
  );
}

export function getOptionState({
  available,
  exists,
  selected,
}: {
  available: boolean;
  exists: boolean;
  selected: boolean;
}) {
  if (!exists) return 'impossible' as const;
  if (!available)
    return selected ? ('selected-sold-out' as const) : ('sold-out' as const);
  return selected ? ('selected' as const) : ('available' as const);
}
