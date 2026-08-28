import {
  HOMEPAGE_EDITORIAL_FALLBACK,
  normalizeHomepageData,
  type HomepageCommerceInput,
} from '~/lib/homepage';

const art = (name: string) => ({
  url: `https://cdn.shopify.com/${name}.jpg`,
  altText: null,
  width: 1600,
  height: 1000,
});

function commerce(): HomepageCommerceInput {
  const release = {
    id: 'product-release',
    handle: 'real-release',
    title: 'Real Release',
    description: 'Printed on brushed aluminum. Additional product details follow.',
    productType: 'Aluminum',
    availableForSale: true,
    featuredImage: art('release'),
    priceRange: {minVariantPrice: {amount: '80.0', currencyCode: 'USD'}},
  };
  return {
    products: [release],
    collections: [
      {
        id: 'collection-after-dark',
        handle: 'after-dark',
        title: 'After Dark',
        image: null,
        products: {nodes: [release]},
      },
      {
        id: 'collection-limited',
        handle: 'limited-editions',
        title: 'Limited Editions',
        image: art('limited'),
        products: {nodes: [release]},
      },
      {
        id: 'collection-metal',
        handle: 'metal-wall-art',
        title: 'Metal Wall Art',
        image: art('metal'),
        products: {nodes: [release]},
      },
    ],
  };
}

describe('homepage data normalization', () => {
  it('normalizes Shopify collections into real category and feature URLs', () => {
    const data = normalizeHomepageData(commerce());
    expect(data.categories.map((category) => category.to)).toEqual([
      '/collections/after-dark',
      '/collections/limited-editions',
      '/collections/metal-wall-art',
    ]);
    expect(data.featuredCollections[0]).toMatchObject({
      title: 'After Dark',
      to: '/collections/after-dark',
    });
  });

  it('uses a Shopify product for the featured release and real price', () => {
    const data = normalizeHomepageData(commerce());
    expect(data.featuredDrop).toMatchObject({
      title: 'Real Release',
      to: '/products/real-release',
      price: {amount: '80.0', currencyCode: 'USD'},
    });
  });

  it('handles missing optional release and commerce data safely', () => {
    const data = normalizeHomepageData({collections: [], products: []});
    expect(data.hero).toBeNull();
    expect(data.featuredDrop).toBeNull();
    expect(data.categories).toEqual([]);
  });

  it('keeps claim-safe editorial benefits centralized', () => {
    const copy = HOMEPAGE_EDITORIAL_FALLBACK.benefits
      .flatMap((benefit) => [benefit.title, benefit.description])
      .join(' ');
    expect(copy).not.toMatch(/free worldwide shipping|30-day returns|lifetime guarantee/i);
  });

  it('links a legitimately configured apparel release to the drop route', () => {
    const source = commerce();
    const marine = {
      ...source.products[0],
      id: 'product-marine',
      handle: 'marine-heavyweight-oversized-hoodie',
      title: 'Marine Heavyweight Oversized Hoodie',
      featuredImage: art('marine'),
    };
    const data = normalizeHomepageData({
      ...source,
      products: [marine, ...source.products],
    });
    expect(data.featuredDrop).toMatchObject({
      handle: 'marine-heavyweight-oversized-hoodie',
      to: '/drops/marine-heavyweight-oversized-hoodie',
    });
  });

  it('prioritizes an explicitly queried configured drop for the homepage release', () => {
    const source = commerce();
    const marine = {
      ...source.products[0],
      id: 'product-marine',
      handle: 'marine-heavyweight-oversized-hoodie',
      title: 'Marine Heavyweight Oversized Hoodie',
      featuredImage: art('marine'),
    };
    const data = normalizeHomepageData({
      ...source,
      featuredDropProduct: marine,
    });
    expect(data.featuredDrop).toMatchObject({
      title: 'Marine Heavyweight Oversized Hoodie',
      to: '/drops/marine-heavyweight-oversized-hoodie',
    });
  });

  it('removes embedded Shopify styling from featured-release copy', () => {
    const source = commerce();
    const release = {
      ...source.products[0],
      id: 'product-marine-styled',
      handle: 'marine-heavyweight-oversized-hoodie',
      descriptionHtml:
        '<style>.size-table { color: red; }</style><p>Warm heavyweight cotton.</p>',
    };
    const data = normalizeHomepageData({
      ...source,
      products: [release],
      featuredDropProduct: release,
    });
    expect(data.featuredDrop?.description).toBe('Warm heavyweight cotton.');
    expect(data.featuredDrop?.description).not.toContain('.size-table');
  });
});
