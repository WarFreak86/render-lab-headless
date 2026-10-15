import {renderHook, waitFor} from '@testing-library/react';
import {useSelectedOptionInUrlParam} from '@shopify/hydrogen';
import {loader} from '~/routes/products.$handle';

const PRODUCT_ID = 'gid://shopify/Product/8727473553569';

function variant({
  id,
  material,
  price,
  productId = PRODUCT_ID,
  size = '24x32',
}: {
  id: string;
  material: string;
  price: string;
  productId?: string;
  size?: string;
}) {
  return {
    __typename: 'ProductVariant',
    availableForSale: true,
    compareAtPrice: null,
    id: `gid://shopify/ProductVariant/${id}`,
    image: {
      __typename: 'Image',
      id: `gid://shopify/ProductImage/${id}`,
      url: `https://cdn.shopify.com/${material.toLowerCase()}.png`,
      altText: `${material} variant`,
      width: 928,
      height: 1232,
    },
    price: {amount: price, currencyCode: 'USD'},
    product: {
      id: productId,
      handle: 'after-the-collapse',
      title: 'After the Collapse',
    },
    selectedOptions: [
      {name: 'Size', value: size},
      {name: 'Material', value: material},
    ],
    sku: `RL-${material.toUpperCase()}-${size}`,
    title: `${size} / ${material}`,
    unitPrice: null,
  };
}

const defaultVariant = variant({
  id: '47375048769697',
  material: 'Metal',
  price: '79.0',
  size: '12x16',
});

function product(selectedOrFirstAvailableVariant = defaultVariant) {
  return {
    id: PRODUCT_ID,
    handle: 'after-the-collapse',
    selectedOrFirstAvailableVariant,
    variants: {nodes: [], pageInfo: {hasNextPage: false}},
  };
}

function loaderArgs(url: string, query: ReturnType<typeof vi.fn>) {
  return {
    context: {
      storefront: {
        CacheShort: vi.fn(() => ({mode: 'public'})),
        query,
      },
    },
    params: {handle: 'after-the-collapse'},
    request: new Request(url),
  };
}

describe('Google Merchant Center product variant deep links', () => {
  it('preserves the numeric deep link while hydration adds selected options', async () => {
    window.history.replaceState(
      {},
      '',
      '/products/after-the-collapse?variant=47375048933537',
    );

    renderHook(() =>
      useSelectedOptionInUrlParam([
        {name: 'Size', value: '24x32'},
        {name: 'Material', value: 'Canvas'},
      ]),
    );

    await waitFor(() => {
      const searchParams = new URLSearchParams(window.location.search);
      expect(searchParams.get('variant')).toBe('47375048933537');
      expect(searchParams.get('Material')).toBe('Canvas');
      expect(searchParams.get('Size')).toBe('24x32');
    });
  });

  it.each([
    {
      label: 'Canvas / 24x32',
      id: '47375048933537',
      material: 'Canvas',
      price: '119.0',
    },
    {
      label: 'Metal / 24x32',
      id: '47375048835233',
      material: 'Metal',
      price: '149.0',
    },
  ])('SSR selects the advertised $label variant', async ({id, material, price}) => {
    const requestedVariant = variant({id, material, price});
    const query = vi
      .fn()
      .mockResolvedValueOnce({product: product()})
      .mockResolvedValueOnce({variant: requestedVariant});

    const result = await loader(
      loaderArgs(
        `https://render-lab.org/products/after-the-collapse?variant=${id}`,
        query,
      ) as never,
    );

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        variables: {
          handle: 'after-the-collapse',
          selectedOptions: [],
        },
      }),
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        variables: {id: `gid://shopify/ProductVariant/${id}`},
      }),
    );
    expect(result.product.selectedOrFirstAvailableVariant).toMatchObject({
      id: `gid://shopify/ProductVariant/${id}`,
      price: {amount: price, currencyCode: 'USD'},
      selectedOptions: expect.arrayContaining([
        {name: 'Material', value: material},
        {name: 'Size', value: '24x32'},
      ]),
    });
  });

  it('preserves normal material and size option selection without an ID lookup', async () => {
    const canvas = variant({
      id: '47375048933537',
      material: 'Canvas',
      price: '119.0',
    });
    const query = vi.fn().mockResolvedValue({product: product(canvas)});

    const result = await loader(
      loaderArgs(
        'https://render-lab.org/products/after-the-collapse?Material=Canvas&Size=24x32',
        query,
      ) as never,
    );

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        variables: {
          handle: 'after-the-collapse',
          selectedOptions: [
            {name: 'Material', value: 'Canvas'},
            {name: 'Size', value: '24x32'},
          ],
        },
      }),
    );
    expect(result.product.selectedOrFirstAvailableVariant?.id).toBe(canvas.id);
  });

  it.each([
    ['missing', 'https://render-lab.org/products/after-the-collapse'],
    [
      'malformed',
      'https://render-lab.org/products/after-the-collapse?variant=not-an-id',
    ],
  ])('falls back safely for a %s variant parameter', async (_label, url) => {
    const query = vi.fn().mockResolvedValue({product: product()});

    const result = await loader(loaderArgs(url, query) as never);

    expect(query).toHaveBeenCalledTimes(1);
    expect(result.product.selectedOrFirstAvailableVariant?.id).toBe(
      defaultVariant.id,
    );
  });

  it('falls back safely when the variant ID is unknown', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({product: product()})
      .mockResolvedValueOnce({variant: null});

    const result = await loader(
      loaderArgs(
        'https://render-lab.org/products/after-the-collapse?variant=99999999999999',
        query,
      ) as never,
    );

    expect(result.product.selectedOrFirstAvailableVariant?.id).toBe(
      defaultVariant.id,
    );
  });

  it('rejects a valid variant belonging to another product', async () => {
    const foreignVariant = variant({
      id: '47375048933537',
      material: 'Canvas',
      price: '119.0',
      productId: 'gid://shopify/Product/another-product',
    });
    const query = vi
      .fn()
      .mockResolvedValueOnce({product: product()})
      .mockResolvedValueOnce({variant: foreignVariant});

    const result = await loader(
      loaderArgs(
        'https://render-lab.org/products/after-the-collapse?variant=47375048933537',
        query,
      ) as never,
    );

    expect(result.product.selectedOrFirstAvailableVariant?.id).toBe(
      defaultVariant.id,
    );
  });
});
