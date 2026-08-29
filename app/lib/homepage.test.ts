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
    productType: 'Wall Art',
    availableForSale: true,
    featuredImage: art('release'),
    priceRange: {minVariantPrice: {amount: '80.0', currencyCode: 'USD'}},
  };
  return {
    products: [release],
    collections: [
      {
        id: 'collection-wall-art',
        handle: 'wall-art',
        title: 'Wall Art',
        image: art('wall-art'),
        products: {nodes: [release]},
      },
      {
        id: 'collection-metal',
        handle: 'metal-wall-art',
        title: 'Metal Wall Art',
        image: art('metal'),
        products: {nodes: [release]},
      },
      {
        id: 'collection-canvas',
        handle: 'canvas-art',
        title: 'Canvas Prints',
        image: art('canvas'),
        products: {nodes: [release]},
      },
      {
        id: 'collection-posters',
        handle: 'posters',
        title: 'Posters',
        image: art('posters'),
        products: {nodes: [release]},
      },
      {
        id: 'collection-nightmare',
        handle: 'nightmare-lab-halloween-2026',
        title: 'Nightmare Lab — Halloween 2026',
        description: 'A seasonal cinematic horror collection.',
        image: art('nightmare'),
        products: {nodes: [release]},
      },
      {
        id: 'collection-neon',
        handle: 'neon-memento',
        title: 'Neon Memento',
        image: art('neon'),
        products: {nodes: [release]},
      },
      {
        id: 'collection-limited',
        handle: 'limited-editions',
        title: 'Limited Editions',
        image: art('limited'),
        products: {nodes: [release]},
      },
    ],
  };
}

describe('homepage data normalization', () => {
  it('normalizes formats and curated series in merchandising order', () => {
    const data = normalizeHomepageData(commerce());
    expect(data.categories.map((category) => category.to)).toEqual([
      '/collections/metal-wall-art',
      '/collections/canvas-art',
      '/collections/posters',
    ]);
    expect(data.featuredCollections.slice(0, 2).map((collection) => collection.to)).toEqual([
      '/collections/nightmare-lab-halloween-2026',
      '/collections/neon-memento',
    ]);
  });

  it('aligns hero CTAs to the featured series and all wall art', () => {
    const data = normalizeHomepageData(commerce());
    expect(data.hero).toMatchObject({
      title: 'Nightmare Lab — Halloween 2026',
      to: '/collections/nightmare-lab-halloween-2026',
      productType: 'Collection',
    });
    expect(data.heroPrimaryCta).toEqual({
      label: 'Explore Nightmare Lab',
      to: '/collections/nightmare-lab-halloween-2026',
    });
    expect(data.heroSecondaryCta).toEqual({
      label: 'Shop All Wall Art',
      to: '/collections/wall-art',
    });
  });

  it('uses Limited Editions for a featured release when available', () => {
    const data = normalizeHomepageData(commerce());
    expect(data.featuredDrop).toMatchObject({
      title: 'Real Release',
      to: '/products/real-release',
      price: {amount: '80.0', currencyCode: 'USD'},
    });
  });

  it('does not mislabel an arbitrary active product as a featured release', () => {
    const source = commerce();
    const data = normalizeHomepageData({
      products: source.products,
      collections: source.collections.filter(
        (collection) => collection.handle !== 'limited-editions',
      ),
    });
    expect(data.featuredDrop).toBeNull();
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

  it('prioritizes a configured drop when Shopify returns it', () => {
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
      featuredDropProduct: release,
    });
    expect(data.featuredDrop?.description).toBe('Warm heavyweight cotton.');
    expect(data.featuredDrop?.description).not.toContain('.size-table');
  });
});
