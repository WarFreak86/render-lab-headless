import {applyMaterialCollectionContext} from './material-collection';
import type {CollectionProductCardData} from './collection';

const product: CollectionProductCardData = {
  id: 'gid://shopify/Product/1',
  handle: 'test-artwork',
  title: 'Test Artwork',
  to: '/products/test-artwork',
  productType: 'Wall Art',
  availableForSale: true,
  image: null,
  minPrice: {amount: '29.00', currencyCode: 'USD'},
  maxPrice: {amount: '169.00', currencyCode: 'USD'},
};

const variants = [
  {
    availableForSale: true,
    price: {amount: '89.00', currencyCode: 'USD' as const},
    selectedOptions: [
      {name: 'Material', value: 'Metal'},
      {name: 'Size', value: '12×18'},
    ],
  },
  {
    availableForSale: true,
    price: {amount: '169.00', currencyCode: 'USD' as const},
    selectedOptions: [
      {name: 'Material', value: 'Metal'},
      {name: 'Size', value: '24×36'},
    ],
  },
  {
    availableForSale: true,
    price: {amount: '69.00', currencyCode: 'USD' as const},
    selectedOptions: [
      {name: 'Material', value: 'Canvas'},
      {name: 'Size', value: '12×18'},
    ],
  },
  {
    availableForSale: true,
    price: {amount: '149.00', currencyCode: 'USD' as const},
    selectedOptions: [
      {name: 'Material', value: 'Canvas'},
      {name: 'Size', value: '24×36'},
    ],
  },
  {
    availableForSale: true,
    price: {amount: '29.00', currencyCode: 'USD' as const},
    selectedOptions: [
      {name: 'Material', value: 'Poster'},
      {name: 'Size', value: '12×18'},
    ],
  },
  {
    availableForSale: true,
    price: {amount: '49.00', currencyCode: 'USD' as const},
    selectedOptions: [
      {name: 'Material', value: 'Poster'},
      {name: 'Size', value: '24×36'},
    ],
  },
];

describe('material-aware collection links and prices', () => {
  it('preselects a complete Poster variant and shows the poster-only price range', () => {
    const result = applyMaterialCollectionContext({
      product,
      collectionHandle: 'posters',
      variants,
    });

    expect(result.to).toBe(
      '/products/test-artwork?Material=Poster&Size=12%C3%9718',
    );
    expect(result.minPrice.amount).toBe('29.00');
    expect(result.maxPrice.amount).toBe('49.00');
  });

  it('preselects a complete Canvas variant and shows the canvas-only price range', () => {
    const result = applyMaterialCollectionContext({
      product,
      collectionHandle: 'canvas-art',
      variants,
    });

    expect(result.to).toBe(
      '/products/test-artwork?Material=Canvas&Size=12%C3%9718',
    );
    expect(result.minPrice.amount).toBe('69.00');
    expect(result.maxPrice.amount).toBe('149.00');
  });

  it('preselects a complete Metal variant and shows the metal-only price range', () => {
    const result = applyMaterialCollectionContext({
      product,
      collectionHandle: 'metal-wall-art',
      variants,
    });

    expect(result.to).toBe(
      '/products/test-artwork?Material=Metal&Size=12%C3%9718',
    );
    expect(result.minPrice.amount).toBe('89.00');
    expect(result.maxPrice.amount).toBe('169.00');
  });

  it('links to the first available matching variant when an earlier size is unavailable', () => {
    const unavailableFirstCanvas = variants.map((variant) =>
      variant.selectedOptions.some(
        (option) => option.name === 'Material' && option.value === 'Canvas',
      ) &&
      variant.selectedOptions.some(
        (option) => option.name === 'Size' && option.value === '12×18',
      )
        ? {...variant, availableForSale: false}
        : variant,
    );

    const result = applyMaterialCollectionContext({
      product,
      collectionHandle: 'canvas-art',
      variants: unavailableFirstCanvas,
    });

    expect(result.to).toBe(
      '/products/test-artwork?Material=Canvas&Size=24%C3%9736',
    );
  });

  it('keeps series collections on the premium first variant behavior', () => {
    expect(
      applyMaterialCollectionContext({
        product,
        collectionHandle: 'neon-memento',
        variants,
      }),
    ).toEqual(product);
  });

  it('does not add unsupported Material options to legacy products', () => {
    const legacy = {...product, productType: 'Poster'};
    expect(
      applyMaterialCollectionContext({
        product: legacy,
        collectionHandle: 'posters',
        variants: [],
      }),
    ).toEqual(legacy);
  });

  it('leaves a product unchanged when the requested material is unavailable', () => {
    const metalOnly = variants.filter(
      (variant) =>
        variant.selectedOptions.find((option) => option.name === 'Material')
          ?.value === 'Metal',
    );

    expect(
      applyMaterialCollectionContext({
        product,
        collectionHandle: 'canvas-art',
        variants: metalOnly,
      }),
    ).toEqual(product);
  });
});
