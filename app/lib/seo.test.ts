import {
  getCommerceStructuredData,
  getEnvironmentRobotsDirective,
  getGlobalStructuredData,
  getProductionRequest,
  getRobotsTxt,
  PREVIEW_ROBOTS_DIRECTIVE,
  safeJsonLd,
} from '~/lib/seo';

describe('launch SEO helpers', () => {
  it('prevents preview indexing without noindexing production', () => {
    expect(getEnvironmentRobotsDirective('https://preview.myshopify.dev/')).toBe(
      PREVIEW_ROBOTS_DIRECTIVE,
    );
    expect(getEnvironmentRobotsDirective('http://localhost:3000/')).toBe(
      PREVIEW_ROBOTS_DIRECTIVE,
    );
    expect(getEnvironmentRobotsDirective('https://render-lab.org/')).toBeUndefined();
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
    expect(request.url).toBe(
      'https://render-lab.org/sitemap_products_1.xml',
    );
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
});
