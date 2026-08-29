import type {
  CurrencyCode,
  ProductCollectionSortKeys,
  ProductSortKeys,
} from '@shopify/hydrogen/storefront-api-types';

export interface CollectionMoney {
  amount: string;
  currencyCode: CurrencyCode;
}

export interface CollectionImage {
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
}

export interface CollectionProductCardData {
  id: string;
  handle: string;
  title: string;
  to: string;
  productType: string;
  availableForSale: boolean;
  image: CollectionImage | null;
  minPrice: CollectionMoney;
  maxPrice: CollectionMoney;
}

export interface CollectionHeroData {
  title: string;
  eyebrow?: string;
  editorialHeading?: string;
  description?: string;
  image: CollectionImage | null;
}

export interface CollectionFilterOption {
  id: string;
  label: string;
  count: number;
  value: string;
}

export interface CollectionFilterGroup {
  id: string;
  label: string;
  type: 'list' | 'price-range';
  options: CollectionFilterOption[];
  price?: {
    min: number;
    max: number;
    currencyCode: CurrencyCode;
  };
}

export interface CollectionActiveFilter {
  id: string;
  label: string;
  params: Array<{name: string; value?: string}>;
}

export interface CollectionPageData {
  id: string;
  handle: string;
  hero: CollectionHeroData;
  products: CollectionProductCardData[];
  filterGroups: CollectionFilterGroup[];
}

export interface ProductFilterInput {
  available?: boolean;
  price?: {min?: number; max?: number};
}

interface RawImage {
  url?: string | null;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

interface RawMoney {
  amount: string;
  currencyCode: CurrencyCode;
}

export interface RawCollectionProduct {
  id: string;
  handle: string;
  title: string;
  productType?: string | null;
  availableForSale?: boolean | null;
  featuredImage?: RawImage | null;
  priceRange: {
    minVariantPrice: RawMoney;
    maxVariantPrice: RawMoney;
  };
}

export interface RawCollectionFilter {
  id: string;
  label: string;
  type: string;
  values: Array<{
    id: string;
    label: string;
    count: number;
    input: unknown;
  }>;
}

export interface RawCollectionPage {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  image?: RawImage | null;
  editorialHeading?: {value?: string | null} | null;
  editorialCopy?: {value?: string | null} | null;
  heroMedia?: {
    reference?: {image?: RawImage | null} | null;
  } | null;
  products: {
    nodes: RawCollectionProduct[];
    filters?: RawCollectionFilter[];
  };
}

export type CollectionSortValue =
  | 'featured'
  | 'best-selling'
  | 'newest'
  | 'price-ascending'
  | 'price-descending';

export const COLLECTION_SORT_OPTIONS: Array<{
  label: string;
  value: CollectionSortValue;
}> = [
  {label: 'Featured', value: 'featured'},
  {label: 'Best selling', value: 'best-selling'},
  {label: 'Newest', value: 'newest'},
  {label: 'Price: Low to high', value: 'price-ascending'},
  {label: 'Price: High to low', value: 'price-descending'},
];

const COLLECTION_MERCHANDISING_FALLBACKS: Record<
  string,
  {eyebrow: string; heading: string}
> = {
  'wall-art': {eyebrow: 'Wall art', heading: 'Art built to change the room.'},
  'metal-wall-art': {
    eyebrow: 'Format / Metal',
    heading: 'Brushed aluminum. Maximum impact.',
  },
  'canvas-art': {
    eyebrow: 'Format / Canvas',
    heading: 'Texture made for the wall.',
  },
  posters: {
    eyebrow: 'Format / Poster',
    heading: 'Easy to frame. Hard to ignore.',
  },
  bundles: {eyebrow: 'Curated sets', heading: 'Better together.'},
  hoodies: {eyebrow: 'Wearable art', heading: 'Wear the art.'},
  'neon-memento': {
    eyebrow: 'Series / Neon Memento',
    heading: 'Mortality in color.',
  },
  'nightmare-lab-halloween-2026': {
    eyebrow: 'Seasonal series / Halloween 2026',
    heading: 'When the lights go out, the experiments begin.',
  },
};

const FILTER_PREFIX = 'filter.';
const PAGINATION_PARAMS = ['cursor', 'direction'];

function cleanText(value?: string | null) {
  const text = value?.trim();
  return text || undefined;
}

function safeAltText(value: string | null | undefined, fallback: string) {
  const text = cleanText(value);
  if (!text || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(text)) return fallback;
  return text;
}

function normalizeImage(
  image: RawImage | null | undefined,
  fallbackAlt: string,
): CollectionImage | null {
  if (!image?.url) return null;
  return {
    url: image.url,
    altText: safeAltText(image.altText, fallbackAlt),
    width: image.width,
    height: image.height,
  };
}

export function normalizeCollectionProduct(
  product: RawCollectionProduct,
): CollectionProductCardData {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    to: `/products/${product.handle}`,
    productType: cleanText(product.productType) ?? '',
    availableForSale: Boolean(product.availableForSale),
    image: normalizeImage(product.featuredImage, `${product.title} artwork`),
    minPrice: product.priceRange.minVariantPrice,
    maxPrice: product.priceRange.maxVariantPrice,
  };
}

function parsePriceInput(input: unknown) {
  try {
    const parsed = (typeof input === 'string' ? JSON.parse(input) : input) as {
      price?: {min?: number | null; max?: number | null};
    };
    return parsed.price;
  } catch {
    return undefined;
  }
}

export function normalizeCollectionFilters(
  filters: RawCollectionFilter[] | undefined,
  currencyCode: CurrencyCode,
): CollectionFilterGroup[] {
  const groups: CollectionFilterGroup[] = [];
  for (const filter of filters ?? []) {
    if (filter.id === 'filter.v.availability' && filter.type === 'LIST') {
      groups.push({
        id: filter.id,
        label: filter.label,
        type: 'list',
        options: filter.values.map((value) => ({
          id: value.id,
          label: value.label,
          count: value.count,
          value: value.id.endsWith('.1') ? '1' : '0',
        })),
      });
      continue;
    }

    if (filter.id === 'filter.v.price' && filter.type === 'PRICE_RANGE') {
      const range = filter.values.map((value) => parsePriceInput(value.input))[0];
      if (range?.min == null || range.max == null) continue;
      groups.push({
        id: filter.id,
        label: filter.label,
        type: 'price-range',
        options: [],
        price: {
          min: 0,
          max: Math.max(range.max, 0),
          currencyCode,
        },
      });
    }
  }
  return groups;
}

export function normalizeCollectionPage(
  collection: RawCollectionPage,
  options?: {allArt?: boolean},
): CollectionPageData {
  const products = collection.products.nodes.map(normalizeCollectionProduct);
  const firstProduct = products[0];
  const title = options?.allArt ? 'All Art' : collection.title;
  const currencyCode = firstProduct?.minPrice.currencyCode ?? 'USD';
  const heroMedia = collection.heroMedia?.reference?.image;
  const merchandising = COLLECTION_MERCHANDISING_FALLBACKS[collection.handle];

  return {
    id: collection.id,
    handle: collection.handle,
    hero: {
      title,
      eyebrow: merchandising?.eyebrow,
      editorialHeading:
        cleanText(collection.editorialHeading?.value) ?? merchandising?.heading,
      description:
        cleanText(collection.editorialCopy?.value) ??
        cleanText(collection.description),
      image:
        normalizeImage(heroMedia, `${title} collection artwork`) ??
        normalizeImage(collection.image, `${title} collection artwork`) ??
        firstProduct?.image ??
        null,
    },
    products,
    filterGroups: normalizeCollectionFilters(
      collection.products.filters,
      currencyCode,
    ),
  };
}

function finiteNumber(value: string | null) {
  if (value == null || value.trim() === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

export function parseProductFilters(
  searchParams: URLSearchParams,
): ProductFilterInput[] {
  const filters: ProductFilterInput[] = [];
  for (const value of searchParams.getAll('filter.v.availability')) {
    if (value === '1') filters.push({available: true});
    if (value === '0') filters.push({available: false});
  }

  const min = finiteNumber(searchParams.get('filter.v.price.gte'));
  const max = finiteNumber(searchParams.get('filter.v.price.lte'));
  if (min !== undefined || max !== undefined) {
    filters.push({price: {...(min !== undefined ? {min} : {}), ...(max !== undefined ? {max} : {})}});
  }
  return filters;
}

export function serializeProductFilters(
  filters: ProductFilterInput[],
  sort?: CollectionSortValue,
) {
  const searchParams = new URLSearchParams();
  for (const filter of filters) {
    if (filter.available !== undefined) {
      searchParams.append(
        'filter.v.availability',
        filter.available ? '1' : '0',
      );
    }
    if (filter.price?.min !== undefined) {
      searchParams.set('filter.v.price.gte', String(filter.price.min));
    }
    if (filter.price?.max !== undefined) {
      searchParams.set('filter.v.price.lte', String(filter.price.max));
    }
  }
  if (sort && sort !== 'featured') searchParams.set('sort_by', sort);
  return searchParams;
}

export function parseSortValue(
  searchParams: URLSearchParams,
): CollectionSortValue {
  const value = searchParams.get('sort_by');
  return COLLECTION_SORT_OPTIONS.some((option) => option.value === value)
    ? (value as CollectionSortValue)
    : 'featured';
}

export function getCollectionSortVariables(
  sort: CollectionSortValue,
  mode: 'collection',
): {sortKey?: ProductCollectionSortKeys; reverse?: boolean};
export function getCollectionSortVariables(
  sort: CollectionSortValue,
  mode: 'all',
): {sortKey?: ProductSortKeys; reverse?: boolean};
export function getCollectionSortVariables(
  sort: CollectionSortValue,
  mode: 'collection' | 'all',
): {
  sortKey?: ProductCollectionSortKeys | ProductSortKeys;
  reverse?: boolean;
} {
  switch (sort) {
    case 'best-selling':
      return {sortKey: 'BEST_SELLING', reverse: false};
    case 'newest':
      return {
        sortKey: mode === 'collection' ? 'CREATED' : 'CREATED_AT',
        reverse: true,
      };
    case 'price-ascending':
      return {sortKey: 'PRICE', reverse: false};
    case 'price-descending':
      return {sortKey: 'PRICE', reverse: true};
    default:
      return {};
  }
}

function withoutPagination(searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams);
  for (const name of PAGINATION_PARAMS) next.delete(name);
  return next;
}

function toSearchUrl(searchParams: URLSearchParams) {
  const search = searchParams.toString();
  return search ? `?${search}` : '?';
}

function formatCurrency(value: number, currencyCode: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getActiveCollectionFilters(
  searchParams: URLSearchParams,
  groups: CollectionFilterGroup[],
): CollectionActiveFilter[] {
  const active: CollectionActiveFilter[] = [];
  const availability = groups.find(
    (group) => group.id === 'filter.v.availability',
  );
  if (availability) {
    for (const value of searchParams.getAll('filter.v.availability')) {
      const option = availability.options.find((item) => item.value === value);
      if (!option) continue;
      active.push({
        id: `${availability.id}:${value}`,
        label: option.label,
        params: [{name: availability.id, value}],
      });
    }
  }

  const price = groups.find((group) => group.id === 'filter.v.price')?.price;
  const min = finiteNumber(searchParams.get('filter.v.price.gte'));
  const max = finiteNumber(searchParams.get('filter.v.price.lte'));
  if (price && (min !== undefined || max !== undefined)) {
    const label =
      min !== undefined && max !== undefined
        ? `${formatCurrency(min, price.currencyCode)}–${formatCurrency(max, price.currencyCode)}`
        : min !== undefined
          ? `From ${formatCurrency(min, price.currencyCode)}`
          : `Up to ${formatCurrency(max ?? 0, price.currencyCode)}`;
    active.push({
      id: 'filter.v.price',
      label,
      params: [
        {name: 'filter.v.price.gte'},
        {name: 'filter.v.price.lte'},
      ],
    });
  }
  return active;
}

export function removeActiveFilter(
  searchParams: URLSearchParams,
  filter: CollectionActiveFilter,
) {
  const next = withoutPagination(searchParams);
  for (const param of filter.params) {
    if (param.value === undefined) {
      next.delete(param.name);
      continue;
    }
    const remaining = next
      .getAll(param.name)
      .filter((value) => value !== param.value);
    next.delete(param.name);
    for (const value of remaining) next.append(param.name, value);
  }
  return toSearchUrl(next);
}

export function clearCollectionFilters(searchParams: URLSearchParams) {
  const next = withoutPagination(searchParams);
  for (const name of Array.from(next.keys())) {
    if (name.startsWith(FILTER_PREFIX)) next.delete(name);
  }
  return toSearchUrl(next);
}
