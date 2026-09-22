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
  });

  it('pins sitemap requests and brand schema to the production origin', () => {
    const request = getProductionRequest(
      new Request('https://preview.myshopify.dev/sitemap_products_1.xml'),
    );
    expect(request.url).toBe('https://render-lab.org/sitemap_products_1.xml');
    expect(JSON.stringify(getGlobalStructuredData())).not.toContain(
      'myshopify.dev',
    );
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
      material: 'Metal',
      size: '16x12',
      image: variantImage,
      offers: {
        availability: 'https://schema.org/InStock',
        price: '79.00',
        priceCurrency: 'USD',
        url: `${canonical}?Material=Metal&Size=16x12`,
      },
    });
    expect(canvas).toMatchObject({
      material: 'Canvas',
      size: '24 x 18',
      image: productImage,
      url: `${canonical}?Material=Canvas&Size=24+x+18`,
    });
    expect(canvas.offers.url).toBe(canvas.url);
    expect(canvas.offers.url).not.toContain('?variant=');
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
    expect(firstRender).not.toContain('shippingDetails');
    expect(firstRender).not.toContain('hasMerchantReturnPolicy');
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
