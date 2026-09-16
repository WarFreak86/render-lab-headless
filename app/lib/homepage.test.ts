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
        id: 'collection-echoes',
        handle: 'echoes-of-war',
        title: 'Echoes of War',
        description: 'History carried in the silhouette.',
        image: art('echoes'),
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
  it('normalizes formats and published series in Shopify input order', () => {
    const data = normalizeHomepageData(commerce());
    expect(data.categories.map((category) => category.to)).toEqual([
      '/collections/wall-art',
      '/collections/metal-wall-art',
      '/collections/canvas-art',
      '/collections/posters',
      '/collections',
    ]);
    expect(data.featuredCollections.slice(0, 2).map((collection) => collection.to)).toEqual([
      '/collections/echoes-of-war',
      '/collections/neon-memento',
    ]);
  });

  it('replaces a suppressed collection image with a safe product image', () => {
    const source = commerce();
    const collections = source.collections.map((collection) =>
      collection.handle === 'wall-art'
        ? {
            ...collection,
            image: {
              ...art('nightmare-lab-nl-001-the-experiment'),
              url: 'https://cdn.shopify.com/collections/nightmare-lab-nl-001-the-experiment.png',
            },
          }
        : collection,
    );
    const data = normalizeHomepageData({...source, collections});
    const wallArt = data.categories.find(
      (category) => category.to === '/collections/wall-art',
    );

    expect(wallArt?.image.url).toBe('https://cdn.shopify.com/release.jpg');
    expect(wallArt?.image.url).not.toContain('nightmare-lab');
  });

  it('uses the first eligible Shopify series for the hero while suppressed collections stay out', () => {
    const data = normalizeHomepageData(commerce());
    expect(data.hero).toMatchObject({
      title: 'Echoes of War',
      to: '/collections/echoes-of-war',
      productType: 'Collection',
    });
    expect(data.heroPrimaryCta).toEqual({
      label: 'Explore Echoes of War',
      to: '/collections/echoes-of-war',
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
    });
  });

  it('does not mislabel an arbitrary active product as a featured release', () => {
    const source = commerce();
    const collections = source.collections.filter(
      (collection) => collection.handle !== 'limited-editions',
    );
    const data = normalizeHomepageData({...source, collections});
    expect(data.featuredDrop).toBeNull();
  });

  it('handles missing optional release and commerce data safely', () => {
    const data = normalizeHomepageData({collections: [], products: []});
    expect(data.hero).toBeNull();
    expect(data.featuredDrop).toBeNull();
    expect(data.categories).toEqual([]);
    expect(data.featuredCollections).toEqual([]);
  });

  it('keeps claim-safe editorial benefits centralized', () => {
    expect(HOMEPAGE_EDITORIAL_FALLBACK.benefits).toEqual([
      {
        icon: 'material',
        title: 'Premium quality',
        description: 'Gallery-grade material options.',
      },
      {
        icon: 'edition',
        title: 'Curated editions',
        description: 'Distinct visual stories for collectors.',
      },
      {
        icon: 'collection',
        title: 'Multiple formats',
        description: 'Metal, canvas, and poster options.',
      },
      {
        icon: 'checkout',
        title: 'Secure checkout',
        description: 'Checkout powered securely by Shopify.',
      },
      {
        icon: 'details',
        title: 'Clear details',
        description: 'Materials and sizing listed with each work.',
      },
    ]);
  });

  it('prioritizes a configured drop when Shopify returns it', () => {
    const source = commerce();
    const configuredDrop = {
      ...source.products[0],
      id: 'configured-drop',
      handle: 'marine-heavyweight-oversized-hoodie',
      title: 'Marine Heavyweight Oversized Hoodie',
    };
    const data = normalizeHomepageData({
      ...source,
      featuredDropProduct: configuredDrop,
    });
    expect(data.featuredDrop).toMatchObject({
      handle: 'marine-heavyweight-oversized-hoodie',
    });
  });

  it('removes embedded Shopify styling from featured-release copy', () => {
    const source = commerce();
    const collection = source.collections.find(
      (item) => item.handle === 'limited-editions',
    );
    if (!collection) throw new Error('Missing limited-editions fixture');
    collection.products = {
      nodes: [
        {
          ...source.products[0],
          descriptionHtml:
            '<style>.bad{color:red}</style><p>Clean release copy.</p>',
        },
      ],
    };
    const data = normalizeHomepageData(source);
    expect(data.featuredDrop?.description).toBe('Clean release copy.');
  });
});
