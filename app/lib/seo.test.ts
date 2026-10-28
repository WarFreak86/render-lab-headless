import {
  getBrandedTitle,
  getCollectionCanonicalUrl,
  getCommerceStructuredData,
  getEnvironmentRobotsDirective,
  getGlobalStructuredData,
  getMetaDescription,
  getProductGroupStructuredData,
  getProductionRequest,
  getRobotsTxt,
  PREVIEW_ROBOTS_DIRECTIVE,
  safeJsonLd,
} from '~/lib/seo';

describe('launch SEO helpers', () => {
  it('prevents preview indexing without noindexing production', () => {
    expect(
      getEnvironmentRobotsDirective('https://preview.myshopify.dev/'),
    ).toBe(PREVIEW_ROBOTS_DIRECTIVE);
    expect(getEnvironmentRobotsDirective('http://localhost:3000/')).toBe(
      PREVIEW_ROBOTS_DIRECTIVE,
    );
    expect(
      getEnvironmentRobotsDirective('https://render-lab.org/'),
    ).toBeUndefined();
    expect(getRobotsTxt('https://preview.myshopify.dev/')).toBe(
      'User-agent: *\nDisallow: /',
    );
    expect(getRobotsTxt('https://render-lab.org/')).toContain(
      'Sitemap: https://render-lab.org/sitemap.xml',
    );
    const robots = getRobotsTxt('https://render-lab.org/');
    expect(robots).not.toContain('Disallow: /policies/');
    expect(robots).toContain('User-agent: *\nDisallow: /cart');
    expect(robots).toContain(
      'User-agent: Storebot-Google\nAllow: /cart\nDisallow: /account',
    );
  });

  it('pins sitemap requests and brand schema to the production origin', () => {
    const request = getProductionRequest(
      new Request('https://preview.myshopify.dev/sitemap_products_1.xml'),
    );
    expect(request.url).toBe('https://render-lab.org/sitemap_products_1.xml');
    expect(JSON.stringify(getGlobalStructuredData())).not.toContain(
      'myshopify.dev',
    );
    const organization = getGlobalStructuredData()['@graph'][0];
    expect(organization).toMatchObject({
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        '@id': 'https://render-lab.org/#merchant-return-policy',
        merchantReturnLink: 'https://render-lab.org/policies/refund-policy',
      },
    });
  });

  it('uses real commerce values and never invents ratings', () => {
    const data = getCommerceStructuredData({
      canonical: 'https://render-lab.org/products/example',
      title: 'Example',
      images: ['https://cdn.shopify.com/example.jpg'],
      variant: {
        availableForSale: true,
        price: {amount: '90.00', currencyCode: 'USD'},
        sku: 'REAL-SKU',
      },
    });
    const serialized = safeJsonLd(data);
    expect(serialized).toContain('90.00');
    expect(serialized).not.toContain('AggregateRating');
    expect(serialized).not.toContain('Review');
    expect(safeJsonLd({value: '</script>'})).not.toContain('</script>');
  });

  it('adds the product brand suffix exactly once', () => {
    expect(getBrandedTitle('Example Artwork')).toBe(
      'Example Artwork | Render-Lab',
    );
    expect(getBrandedTitle('Example Artwork | Render-Lab')).toBe(
      'Example Artwork | Render-Lab',
    );
    expect(getBrandedTitle('Example Artwork | render-lab')).toBe(
      'Example Artwork | render-lab',
    );
  });

  it('prefers the first description and keeps it within the SERP limit', () => {
    const explicit = `Explicit Shopify SEO description ${'detail '.repeat(30)}`;
    const description = getMetaDescription(explicit, 'Visible collection copy');

    expect(description).toMatch(/^Explicit Shopify SEO description/);
    expect(description?.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/…$/);
  });

  it('self-canonicalizes clean pagination and collapses filters and sort', () => {
    expect(
      getCollectionCanonicalUrl(
        'wall-art',
        '?direction=next&cursor=opaque-cursor',
      ),
    ).toBe(
      'https://render-lab.org/collections/wall-art?direction=next&cursor=opaque-cursor',
    );
    expect(
      getCollectionCanonicalUrl(
        'wall-art',
        '?direction=next&cursor=opaque-cursor&sort_by=price-ascending',
      ),
    ).toBe('https://render-lab.org/collections/wall-art');
    expect(
      getCollectionCanonicalUrl(
        'wall-art',
        '?cursor=opaque-cursor&filter.v.availability=1',
      ),
    ).toBe('https://render-lab.org/collections/wall-art');
  });
});

const canonical = 'https://render-lab.org/products/example-artwork';
const productId = 'gid://shopify/Product/123456789';
const productImage = 'https://cdn.shopify.com/product.jpg';
const variantImage = 'https://cdn.shopify.com/variant.jpg';

function materialVariant({
  availableForSale = true,
  id = '111',
  image = variantImage,
  material = 'Metal',
  price = '79.00',
  size = '16x12',
  sku = 'RL-EXAMPLE-MET-1216',
} = {}) {
  return {
    availableForSale,
    id: `gid://shopify/ProductVariant/${id}`,
    image: image ? {url: image} : null,
    price: {amount: price, currencyCode: 'USD'},
    selectedOptions: [
      {name: 'Material', value: material},
      {name: 'Size', value: size},
    ],
    sku,
  };
}

function productGroupData(
  variants = [
    materialVariant(),
    materialVariant({
      id: '222',
      image: '',
      material: 'Canvas',
      price: '59.00',
      size: '24 x 18',
      sku: 'RL-EXAMPLE-CAN-1824',
    }),
  ],
) {
  return getProductGroupStructuredData({
    canonical,
    productId,
    title: 'Example Artwork',
    description: 'An example description.',
    images: [productImage],
    vendor: 'Render-Lab',
    variants,
    breadcrumb: [
      {name: 'Shop', url: 'https://render-lab.org/collections'},
      {name: 'Example Artwork', url: canonical},
    ],
  });
}

function productGroup(variants?: Parameters<typeof productGroupData>[0]) {
  const group = productGroupData(variants)['@graph'].find(
    (entity) => entity['@type'] === 'ProductGroup',
  );
  if (!group) throw new Error('Expected ProductGroup');
  return group;
}

describe('ProductGroup structured data', () => {
  it('emits one stable group with every real variant and preserves breadcrumbs', () => {
    const data = productGroupData();
    const groups = data['@graph'].filter(
      (entity) => entity['@type'] === 'ProductGroup',
    );
    const breadcrumbs = data['@graph'].filter(
      (entity) => entity['@type'] === 'BreadcrumbList',
    );
    const group = groups[0];

    expect(groups).toHaveLength(1);
    expect(breadcrumbs).toHaveLength(1);
    expect(group).toMatchObject({
      '@id': `${canonical}#product-group`,
      productGroupID: productId,
      url: canonical,
      brand: {'@type': 'Brand', name: 'Render-Lab'},
    });
    expect(group).not.toHaveProperty('sku');
    expect(group).not.toHaveProperty('offers');
    expect(group.hasVariant).toHaveLength(2);
    expect(
      new Set(group.hasVariant.map((variant) => variant['@id'])).size,
    ).toBe(2);
    expect(new Set(group.hasVariant.map((variant) => variant.sku)).size).toBe(
      2,
    );
    expect(group.hasVariant).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          '@id': `${canonical}#variant-111`,
          isVariantOf: {'@id': `${canonical}#product-group`},
        }),
        expect.objectContaining({
          '@id': `${canonical}#variant-222`,
          isVariantOf: {'@id': `${canonical}#product-group`},
        }),
      ]),
    );
  });

  it('maps Material and Size and emits exact, encoded variant Offer URLs', () => {
    const group = productGroup();
    const [metal, canvas] = group.hasVariant;

    expect(group.variesBy).toEqual([
      'https://schema.org/material',
      'https://schema.org/size',
    ]);
    expect(metal).toMatchObject({
      name: 'Example Artwork — Metal / 16x12',
      description: 'Example Artwork — Metal / 16x12. An example description.',
      material: 'Metal',
      size: '16x12',
      image: variantImage,
      offers: {
        availability: 'https://schema.org/InStock',
        price: '79.00',
        priceCurrency: 'USD',
        url: `${canonical}?Material=Metal&Size=16x12`,
        hasMerchantReturnPolicy: {
          '@id': 'https://render-lab.org/#merchant-return-policy',
        },
      },
    });
    expect(canvas).toMatchObject({
      name: 'Example Artwork — Canvas / 24 x 18',
      description: 'Example Artwork — Canvas / 24 x 18. An example description.',
      material: 'Canvas',
      size: '24 x 18',
      image: productImage,
      url: `${canonical}?Material=Canvas&Size=24+x+18`,
    });
    expect(canvas.offers.url).toBe(canvas.url);
    expect(canvas.offers.url).not.toContain('?variant=');
    expect(metal.offers.shippingDetails?.shippingRate).toMatchObject({value: 10.56, currency: 'USD'});
    expect(canvas.offers.shippingDetails?.shippingRate).toMatchObject({value: 18.29, currency: 'USD'});
  });

  it('includes genuine product subject matter in distinct variant descriptions', () => {
    const structured = getProductGroupStructuredData({
      canonical,
      productId,
      title: 'Automotive Study',
      description: 'Theme: Automotive wall art featuring a vintage muscle car.',
      images: [productImage],
      variants: [
        materialVariant(),
        materialVariant({id: '222', material: 'Canvas', sku: 'CAN-1824'}),
      ],
    });
    const group = structured['@graph'][0];
    if (!('hasVariant' in group)) throw new Error('Expected ProductGroup');

    const descriptions = group.hasVariant.map((variant) => variant.description);
    expect(new Set(descriptions).size).toBe(2);
    expect(descriptions.every((value) => value.includes('Theme: Automotive wall art'))).toBe(true);
    expect(descriptions[0]).toContain('Metal');
    expect(descriptions[1]).toContain('Canvas');
  });

  it('represents Finish conservatively without claiming it is material', () => {
    const finishVariants = [
      materialVariant({id: '333', sku: 'UI-POSTER-1216'}),
      materialVariant({id: '444', sku: 'UI-CANVAS-1824'}),
    ].map((variant, index) => ({
      ...variant,
      selectedOptions: [
        {name: 'Finish', value: index ? 'Canvas' : 'Poster'},
        {name: 'Size', value: index ? '18×24' : '12×16'},
      ],
    }));
    const group = productGroup(finishVariants);
    const poster = group.hasVariant[0];

    expect(group.variesBy).toEqual([
      {
        '@type': 'PropertyValue',
        name: 'Finish',
        value: ['Poster', 'Canvas'],
      },
      'https://schema.org/size',
    ]);
    expect(poster).not.toHaveProperty('material');
    expect(poster.additionalProperty).toEqual([
      {'@type': 'PropertyValue', name: 'Finish', value: 'Poster'},
    ]);
    expect(poster.offers.url).toBe(
      `${canonical}?Finish=Poster&Size=12%C3%9716`,
    );
  });

  it('emits verified U.S. shipping rates for all material and size tiers', () => {
    const samples = [
      ['Metal', '12x16', 10.56],
      ['Metal', '18x24', 20.58],
      ['Metal', '24x32', 31.84],
      ['Canvas', '12x16', 9.19],
      ['Canvas', '18x24', 18.29],
      ['Canvas', '24x32', 18.29],
      ['Poster', '12x16', 4.9],
      ['Poster', '18x24', 4.9],
      ['Poster', '24x32', 5.9],
    ] as const;
    for (const [material, size, amount] of samples) {
      const variant = materialVariant({
        material, size, sku: `RL-TEST-${material}-${size}`,
      });
      const group = productGroup([variant]);
      expect(group.hasVariant[0].offers.shippingDetails).toMatchObject({
        shippingDestination: {'@type': 'DefinedRegion', addressCountry: 'US'},
        shippingRate: {'@type': 'MonetaryAmount', value: amount, currency: 'USD'},
        deliveryTime: {
          handlingTime: {minValue: 2, maxValue: 4, unitCode: 'DAY'},
          transitTime: {minValue: 5, maxValue: 8, unitCode: 'DAY'},
        },
      });
    }
  });

  it('omits shipping claims for unsupported formats or currencies', () => {
    const unsupported = materialVariant({material: 'Acrylic', size: '18x24'});
    const foreignCurrency = materialVariant({id: '222', sku: 'RL-EUR'});
    foreignCurrency.price.currencyCode = 'EUR';
    const group = productGroup([unsupported, foreignCurrency]);
    expect(group.hasVariant.every((variant) => !('shippingDetails' in variant.offers))).toBe(true);
  });

  it('maps unavailable variants without assuming future stock', () => {
    const group = productGroup([materialVariant({availableForSale: false})]);

    expect(group.hasVariant[0].offers.availability).toBe(
      'https://schema.org/OutOfStock',
    );
  });

  it('does not depend on a selected variant and remains deterministic', () => {
    const firstRender = safeJsonLd(productGroupData());
    const optionUrlRender = safeJsonLd(productGroupData());

    expect(optionUrlRender).toBe(firstRender);
    expect(firstRender).not.toContain('AggregateRating');
    expect(firstRender).not.toContain('Review');
    expect(firstRender).toContain('shippingDetails');
    expect(firstRender).toContain('hasMerchantReturnPolicy');
    expect(firstRender).not.toContain('priceValidUntil');
    expect(safeJsonLd({value: '</script>'})).not.toContain('</script>');
  });

  it('rejects duplicate IDs and SKUs instead of emitting ambiguous variants', () => {
    expect(() =>
      productGroupData([
        materialVariant(),
        materialVariant({id: '222', sku: 'RL-EXAMPLE-MET-1216'}),
      ]),
    ).toThrow('Duplicate Shopify variant SKU');
    expect(() =>
      productGroupData([
        materialVariant(),
        materialVariant({id: '111', sku: 'UNIQUE-SKU'}),
      ]),
    ).toThrow('Duplicate Shopify variant ID');
  });

  it('rejects incomplete price data rather than fabricating an Offer', () => {
    const variant = materialVariant();
    variant.price.amount = '';
    expect(() => productGroupData([variant])).toThrow('requires a price');
  });

  it('preserves global Organization and WebSite entities separately', () => {
    const global = getGlobalStructuredData();
    const group = productGroup();

    expect(global['@graph'].map((entity) => entity['@type'])).toEqual([
      'Organization',
      'WebSite',
    ]);
    expect(safeJsonLd(group)).not.toContain('Organization');
    expect(safeJsonLd(group)).not.toContain('WebSite');
  });
});
