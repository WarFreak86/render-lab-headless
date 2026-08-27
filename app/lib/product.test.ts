import {
  getOptionState,
  normalizeProductPage,
  parseMetafieldList,
  resolveVariant,
} from './product';

const variants = [
  {
    availableForSale: true,
    selectedOptions: [
      {name: 'Size', value: '30 × 45 cm'},
      {name: 'Finish', value: 'Matte'},
    ],
  },
  {
    availableForSale: false,
    selectedOptions: [
      {name: 'Size', value: '40 × 60 cm'},
      {name: 'Finish', value: 'Matte'},
    ],
  },
];

describe('product data and variant state', () => {
  it('resolves a valid available variant from its complete selection', () => {
    expect(
      resolveVariant(variants, {
        Size: '30 × 45 cm',
        Finish: 'Matte',
      }),
    ).toBe(variants[0]);
  });

  it('preserves a valid sold-out variant and rejects an impossible combination', () => {
    expect(
      resolveVariant(variants, {
        Size: '40 × 60 cm',
        Finish: 'Matte',
      }),
    ).toMatchObject({availableForSale: false});
    expect(
      resolveVariant(variants, {
        Size: '40 × 60 cm',
        Finish: 'Gloss',
      }),
    ).toBeUndefined();
  });

  it('distinguishes selectable, sold-out, selected, and impossible option values', () => {
    expect(
      getOptionState({exists: true, available: true, selected: false}),
    ).toBe('available');
    expect(
      getOptionState({exists: true, available: false, selected: false}),
    ).toBe('sold-out');
    expect(
      getOptionState({exists: true, available: true, selected: true}),
    ).toBe('selected');
    expect(
      getOptionState({exists: false, available: false, selected: false}),
    ).toBe('impossible');
  });

  it('normalizes live media, replaces UUID alt text, and omits absent editorial data', () => {
    const page = normalizeProductPage({
      title: 'Alt History',
      media: {
        nodes: [
          {
            id: 'media-1',
            image: {
              id: 'image-1',
              url: 'https://cdn.shopify.com/art.jpg',
              altText: '59434f3d-52f7-408e-b019-002c646de7e8',
              width: 1600,
              height: 1200,
            },
          },
        ],
      },
    });

    expect(page.gallery[0]).toMatchObject({
      altText: 'Alt History artwork',
      id: 'image-1',
    });
    expect(page.editorial).toMatchObject({highlights: [], roomImages: []});
    expect(page.editorial.editionSize).toBeUndefined();
  });

  it('supports Shopify list metafields and plain-text merchant fallbacks', () => {
    expect(
      parseMetafieldList({value: '["Archival inks","Made to order"]'}),
    ).toEqual(['Archival inks', 'Made to order']);
    expect(parseMetafieldList({value: 'Archival inks\nMade to order'})).toEqual(
      ['Archival inks', 'Made to order'],
    );
  });
});
