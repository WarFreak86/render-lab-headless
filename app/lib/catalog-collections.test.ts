import {
  isStorefrontSeriesCollection,
  storefrontSeriesCollectionsAlphabetical,
} from './catalog-collections';

function collection(handle: string, title: string, productCount = 1) {
  return {
    id: `collection-${handle}`,
    handle,
    title,
    products: {
      nodes: Array.from({length: productCount}, (_, index) => ({
        id: `product-${handle}-${index}`,
      })),
    },
  };
}

describe('storefront series collection rules', () => {
  it('accepts a new published non-empty series without a code-maintained allowlist', () => {
    expect(
      isStorefrontSeriesCollection(
        collection('machine-monument', 'Machine & Monument'),
      ),
    ).toBe(true);
  });

  it('keeps structural, empty, and suppressed collections out of series navigation', () => {
    expect(isStorefrontSeriesCollection(collection('wall-art', 'Wall Art'))).toBe(false);
    expect(isStorefrontSeriesCollection(collection('empty-series', 'Empty Series', 0))).toBe(false);
    expect(isStorefrontSeriesCollection(collection('nightmare-lab', 'Nightmare Lab'))).toBe(false);
  });

  it('orders dynamic series alphabetically for stable navigation', () => {
    const result = storefrontSeriesCollectionsAlphabetical([
      collection('urban-icon', 'Urban Icon'),
      collection('blood-shadow', 'Blood & Shadow'),
      collection('wall-art', 'Wall Art'),
    ]);
    expect(result.map((item) => item.title)).toEqual([
      'Blood & Shadow',
      'Urban Icon',
    ]);
  });
});
