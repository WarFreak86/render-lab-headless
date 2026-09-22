const mocks = vi.hoisted(() => ({
  getSitemap: vi.fn(),
}));

vi.mock('@shopify/hydrogen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shopify/hydrogen')>()),
  getSitemap: mocks.getSitemap,
}));

import {loader} from '~/routes/sitemap.$type.$page[.xml]';

describe('sitemap child routes', () => {
  it('generates only storefront-supported non-localized URLs', async () => {
    mocks.getSitemap.mockResolvedValue(
      new Response('<urlset></urlset>', {
        headers: {'Content-Type': 'application/xml'},
      }),
    );
    const storefront = {};
    const params = {type: 'products', page: '1'};

    await loader({
      context: {storefront},
      params,
      request: new Request(
        'https://preview.myshopify.dev/sitemap_products_1.xml',
      ),
    } as never);

    expect(mocks.getSitemap).toHaveBeenCalledOnce();
    const options = mocks.getSitemap.mock.calls[0]?.[0];
    expect(options).toMatchObject({storefront, params});
    expect(options.request.url).toBe(
      'https://render-lab.org/sitemap_products_1.xml',
    );
    expect(options).not.toHaveProperty('locales');
    expect(
      options.getLink({
        baseUrl: 'https://render-lab.org',
        handle: 'example',
        type: 'products',
      }),
    ).toBe('https://render-lab.org/products/example');
  });
});
