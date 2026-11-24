const mocks = vi.hoisted(() => ({
  getSitemap: vi.fn(),
}));

vi.mock('@shopify/hydrogen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shopify/hydrogen')>()),
  getSitemap: mocks.getSitemap,
}));

import {loader} from '~/routes/sitemap.$type.$page[.xml]';
import {loader as storefrontSitemap} from '~/routes/sitemap.storefront[.xml]';

it('excludes storefront pages that redirect, are unavailable or are noindex', async () => {
  const query = vi.fn(async (operation: string) => {
    if (operation.includes('query ApparelCategoryDirectory')) return {};
    if (operation.includes('query ApparelCategoryProducts')) {
      return {collection: {products: {nodes: [{availableForSale: false}]}}};
    }
    if (operation.includes('query ArtistProfile')) {
      return {metaobject: {id: 'artist', handle: 'jb-render'}, collections: {nodes: []}};
    }
    if (operation.includes('query Policy')) {
      return {shop: {privacyPolicy: {handle: 'different-policy'}}};
    }
    throw new Error('Unexpected storefront query');
  });
  const response = await storefrontSitemap({
    context: {storefront: {query, CacheShort: vi.fn(), CacheNone: vi.fn()}},
    params: {},
    request: new Request('https://preview.myshopify.dev/sitemap/storefront.xml'),
  } as never);
  const document = new DOMParser().parseFromString(await response.text(), 'application/xml');
  expect(document.querySelector('parsererror')).toBeNull();
  expect([...document.querySelectorAll('loc')].map((entry) => entry.textContent)).toEqual([
    'https://render-lab.org/',
    'https://render-lab.org/materials',
    'https://render-lab.org/collections',
    'https://render-lab.org/artists',
    'https://render-lab.org/policies',
    'https://render-lab.org/legal/rights-notice',
    'https://render-lab.org/policies/refund-policy',
  ]);
});

describe('sitemap child routes', () => {
  afterEach(() => vi.useRealTimers());

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

  it.each(['1', '2', '37'])(
    'uses stable product dates on partition %s and preserves XML',
    async (page) => {
      const date = '2026-10-25T02:28:19Z';
      const query = vi.fn().mockResolvedValue({
        p0: {handle: 'cathedral-of-the-void', updatedAt: date},
        p1: {handle: 'art-the-clown', updatedAt: '2026-10-24T10:00:00Z'},
      });
      vi.useFakeTimers();
      const run = async (now: string) => {
        vi.setSystemTime(new Date(now));
        mocks.getSitemap.mockResolvedValueOnce(
          new Response(
            `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://render-lab.org/products/cathedral-of-the-void</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>
        <url><loc>https://render-lab.org/products/art-the-clown</loc><lastmod>${now}</lastmod></url>
        <url><loc>https://render-lab.org/products/nightmare-lab-hidden</loc><lastmod>${now}</lastmod></url></urlset>`,
            {headers: {'Content-Type': 'application/xml'}},
          ),
        );
        return loader({
          context: {storefront: {query}},
          params: {type: 'products', page},
          request: new Request(
            `https://render-lab.org/sitemap/products/${page}.xml`,
          ),
        } as never);
      };
      const response = await run('2026-10-27T08:39:24Z');
      const first = await response.text();
      const second = await (await run('2026-10-27T08:40:03Z')).text();
      expect(first).toBe(second);
      expect(response.headers.get('Content-Type')).toBe('application/xml');
      expect(response.headers.get('Cache-Control')).toBe('max-age=86400');
      const document = new DOMParser().parseFromString(
        first,
        'application/xml',
      );
      expect(document.querySelector('parsererror')).toBeNull();
      expect(
        [...document.querySelectorAll('lastmod')].map((e) => e.textContent),
      ).toEqual([date, '2026-10-24T10:00:00Z']);
      expect(document.querySelectorAll('url')).toHaveLength(2);
      expect(first).toContain('<changefreq>weekly</changefreq>');
      expect(query.mock.calls[0][0]).not.toContain('nightmare-lab');
    },
  );

  it.each([
    {handle: 'example', updatedAt: 'invalid'},
    {handle: 'example', updatedAt: '2999-01-01T00:00:00Z'},
  ])('omits untrustworthy or missing product dates (%j)', async (product) => {
    const {withProductSitemapLastmod} = await import('~/lib/product-sitemap');
    const query = vi.fn().mockResolvedValue({p0: product});
    const xml =
      '<urlset><url><loc>https://render-lab.org/products/example</loc><lastmod>2026-10-27T08:39:24Z</lastmod></url></urlset>';
    const result = await withProductSitemapLastmod(xml, {query});
    expect(result).not.toContain('lastmod');
    expect(result).toContain(
      '<loc>https://render-lab.org/products/example</loc>',
    );
  });

  it.each([
    null,
    {handle: 'different-product', updatedAt: '2020-01-01T00:00:00Z'},
    {handle: 'example', title: 'Nightmare Lab artwork'},
    {handle: 'example', featuredImage: {url: 'https://cdn.shopify.com/nightmare-lab.jpg'}},
  ])('removes confirmed unavailable, noncanonical or suppressed products (%j)', async (product) => {
    const {withProductSitemapLastmod} = await import('~/lib/product-sitemap');
    const query = vi.fn().mockResolvedValue({p0: product});
    const xml =
      '<urlset><url><loc>https://render-lab.org/products/example</loc><lastmod>wrong</lastmod></url></urlset>';
    expect(await withProductSitemapLastmod(xml, {query})).toBe('<urlset></urlset>');
    expect(await withProductSitemapLastmod(xml, {
      query: vi.fn().mockResolvedValue({p0: null, errors: [{message: 'Partial failure'}]}),
    })).toContain('/products/example');
  });

  it.each(['https://render-lab.org/', 'https://render-lab.org/blogs/news'])(
    'rejects a child containing only an ineligible location (%s)',
    async (location) => {
      mocks.getSitemap.mockResolvedValueOnce(
        new Response(`<urlset><url><loc>${location}</loc></url></urlset>`),
      );
      const response = await loader({
        context: {storefront: {}},
        params: {type: 'blogs', page: '1'},
        request: new Request('https://render-lab.org/sitemap/blogs/1.xml'),
      } as never);
      expect(response.status).toBe(404);
    },
  );

  it('omits dates on lookup failure without failing discovery', async () => {
    const {withProductSitemapLastmod} = await import('~/lib/product-sitemap');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const query = vi.fn().mockRejectedValue(new Error('API unavailable'));
    const result = await withProductSitemapLastmod(
      '<urlset><url><loc>https://render-lab.org/products/example</loc><lastmod>wrong</lastmod></url></urlset>',
      {query},
    );
    expect(result).not.toContain('lastmod');
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it('reflects real product edits and ignores partial GraphQL error metadata', async () => {
    const {withProductSitemapLastmod} = await import('~/lib/product-sitemap');
    const xml =
      '<urlset><url><loc>https://render-lab.org/products/example</loc><lastmod>wrong</lastmod></url></urlset>';
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        p0: {handle: 'example', updatedAt: '2020-01-01T00:00:00Z'},
        errors: [{message: 'Another field failed'}],
      })
      .mockResolvedValueOnce({
        p0: {handle: 'example', updatedAt: '2020-01-02T00:00:00Z'},
      });
    expect(await withProductSitemapLastmod(xml, {query})).toContain(
      '<lastmod>2020-01-01T00:00:00Z</lastmod>',
    );
    expect(await withProductSitemapLastmod(xml, {query})).toContain(
      '<lastmod>2020-01-02T00:00:00Z</lastmod>',
    );
  });

  it('batches lookups and preserves empty-partition homepage fallbacks', async () => {
    const {withProductSitemapLastmod} = await import('~/lib/product-sitemap');
    const query = vi.fn().mockResolvedValue({});
    const fallback =
      '<urlset><url><loc>https://render-lab.org/</loc></url></urlset>';
    expect(await withProductSitemapLastmod(fallback, {query})).toBe(fallback);
    expect(query).not.toHaveBeenCalled();
    await withProductSitemapLastmod(
      `<urlset>${Array.from({length: 101}, (_, i) => `<url><loc>https://render-lab.org/products/p-${i}</loc><lastmod>wrong</lastmod></url>`).join('')}</urlset>`,
      {query},
    );
    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[0][0]).toContain('p49: product');
    expect(query.mock.calls[0][0]).not.toContain('p50: product');
  });

  it.each(['collections', 'pages', 'blogs'])(
    'leaves %s dates untouched',
    async (type) => {
      const xml = `<urlset><url><loc>https://render-lab.org/${type}/carnivora</loc><lastmod>2020-01-01T00:00:00Z</lastmod></url></urlset>`;
      mocks.getSitemap.mockResolvedValueOnce(new Response(xml));
      const query = vi.fn();
      const response = await loader({
        context: {storefront: {query}},
        params: {type, page: '1'},
        request: new Request(`https://render-lab.org/sitemap/${type}/1.xml`),
      } as never);
      expect(await response.text()).toBe(xml);
      expect(query).not.toHaveBeenCalled();
    },
  );
});
