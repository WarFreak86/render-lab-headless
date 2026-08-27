import {
  clearCollectionFilters,
  getActiveCollectionFilters,
  getCollectionSortVariables,
  normalizeCollectionPage,
  parseProductFilters,
  parseSortValue,
  removeActiveFilter,
  serializeProductFilters,
  type RawCollectionPage,
} from './collection';

const product = {
  id: 'gid://shopify/Product/1',
  handle: 'real-artwork',
  title: 'Real Artwork',
  productType: 'Aluminum',
  availableForSale: true,
  featuredImage: {
    url: 'https://cdn.shopify.com/real.jpg',
    altText: '59434f3d-52f7-408e-b019-002c646de7e8',
    width: 1600,
    height: 1200,
  },
  priceRange: {
    minVariantPrice: {amount: '80.00', currencyCode: 'USD' as const},
    maxVariantPrice: {amount: '150.00', currencyCode: 'USD' as const},
  },
};

const rawCollection: RawCollectionPage = {
  id: 'gid://shopify/Collection/1',
  handle: 'metal',
  title: 'Metal',
  description: '',
  image: null,
  products: {
    nodes: [product],
    filters: [
      {
        id: 'filter.v.availability',
        label: 'Availability',
        type: 'LIST',
        values: [
          {
            id: 'filter.v.availability.1',
            label: 'In stock',
            count: 1,
            input: {available: true},
          },
        ],
      },
      {
        id: 'filter.v.price',
        label: 'Price',
        type: 'PRICE_RANGE',
        values: [
          {
            id: 'filter.v.price',
            label: 'Price',
            count: 0,
            input: {price: {min: 0, max: 150}},
          },
        ],
      },
    ],
  },
};

describe('collection data and URL state', () => {
  it('falls back from absent editorial collection data to real product imagery', () => {
    const page = normalizeCollectionPage(rawCollection);
    expect(page.hero.title).toBe('Metal');
    expect(page.hero.description).toBeUndefined();
    expect(page.hero.image).toMatchObject({
      url: 'https://cdn.shopify.com/real.jpg',
      altText: 'Real Artwork artwork',
    });
  });

  it('normalizes only filter groups returned by Shopify', () => {
    const page = normalizeCollectionPage(rawCollection);
    expect(page.filterGroups.map((group) => group.label)).toEqual([
      'Availability',
      'Price',
    ]);
  });

  it('parses Shopify-compatible filter state from the URL', () => {
    const params = new URLSearchParams(
      'filter.v.availability=1&filter.v.price.gte=40&filter.v.price.lte=120',
    );
    expect(parseProductFilters(params)).toEqual([
      {available: true},
      {price: {min: 40, max: 120}},
    ]);
  });

  it('serializes filter and sort state to shareable URL parameters', () => {
    const params = serializeProductFilters(
      [{available: true}, {price: {max: 120}}],
      'price-ascending',
    );
    expect(params.toString()).toBe(
      'filter.v.availability=1&filter.v.price.lte=120&sort_by=price-ascending',
    );
  });

  it('removes one active filter without resetting sort or other filters', () => {
    const params = new URLSearchParams(
      'filter.v.availability=1&filter.v.price.lte=120&sort_by=newest&cursor=abc',
    );
    const page = normalizeCollectionPage(rawCollection);
    const [availability] = getActiveCollectionFilters(params, page.filterGroups);
    expect(removeActiveFilter(params, availability)).toBe(
      '?filter.v.price.lte=120&sort_by=newest',
    );
  });

  it('clears every filter while preserving sort state', () => {
    const params = new URLSearchParams(
      'filter.v.availability=1&filter.v.price.gte=20&sort_by=best-selling&direction=next',
    );
    expect(clearCollectionFilters(params)).toBe('?sort_by=best-selling');
  });

  it('uses supported Shopify sort keys and a safe featured default', () => {
    expect(parseSortValue(new URLSearchParams('sort_by=price-descending'))).toBe(
      'price-descending',
    );
    expect(parseSortValue(new URLSearchParams('sort_by=unknown'))).toBe(
      'featured',
    );
    expect(getCollectionSortVariables('newest', 'collection')).toEqual({
      sortKey: 'CREATED',
      reverse: true,
    });
  });
});
