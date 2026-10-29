import {getProductionUrl, normalizeStorefrontLink} from '~/lib/config';
import {sanitizeMenuItems} from '~/lib/navigation';
import {
  FORMAT_COLLECTION_HANDLES,
  SERIES_COLLECTION_HANDLES,
  filterCollectionSitemapXml,
} from '~/lib/catalog-collections';
import {
  getGlobalStructuredData,
  getRobotsTxt,
  getEnvironmentRobotsDirective,
} from '~/lib/seo';
import {loader as collectionLoader} from '~/routes/collections.$handle';
import {loader as allLoader} from '~/routes/collections.all';
import {loader as artistLoader} from '~/routes/artists.$handle';
import {loader as rootLoader} from '~/root';

vi.mock('@shopify/hydrogen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shopify/hydrogen')>()),
  getShopAnalytics: vi.fn().mockResolvedValue({shopId: 'shop-1'}),
}));

it('normalizes internal domains without dropping queries or rewriting external hosts', () => {
  for (const host of [
    'checkout.render-lab.org',
    'kn0xfa-4t.myshopify.com',
    'render-lab.org',
  ]) {
    expect(
      normalizeStorefrontLink(
        `https://${host}/products/art?Material=Metal#details`,
      ),
    ).toBe('/products/art?Material=Metal#details');
    expect(getProductionUrl(`https://${host}/products/art`)).toBe(
      'https://render-lab.org/products/art',
    );
  }
  expect(
    normalizeStorefrontLink(
      'https://example.com/?next=checkout.render-lab.org',
    ),
  ).toBe('https://example.com/?next=checkout.render-lab.org');
  expect(normalizeStorefrontLink('mailto:support@render-lab.org')).toBe(
    'mailto:support@render-lab.org',
  );
});

it('filters nested menu entries before serialization', () => {
  const items = sanitizeMenuItems([
    {
      url: '/collections',
      items: [
        {
          url: 'https://checkout.render-lab.org/collections/carnivora?sort_by=title#art',
        },
        {url: 'https://kn0xfa-4t.myshopify.com/collections/hoodies'},
        {url: '/artists/dante-mercer'},
      ],
    },
  ]);
  expect(items[0].items).toEqual([
    {url: '/collections/carnivora?sort_by=title#art'},
  ]);
});

it('sanitizes the root and deferred footer while preserving the checkout URL', async () => {
  const checkoutUrl = 'https://checkout.render-lab.org/cart/c/opaque-token';
  const query = vi.fn().mockImplementation((source: string) =>
    Promise.resolve(
      source.includes('query Header')
        ? {
            shop: {
              id: 'shop',
              primaryDomain: {url: 'https://checkout.render-lab.org'},
            },
            menu: {
              items: [
                {url: 'https://checkout.render-lab.org/collections/hoodies'},
              ],
            },
            collections: {
              nodes: [{handle: 'carnivora'}, {handle: 'alt-history'}],
            },
            artists: {nodes: [{handle: 'jb-render'}, {handle: 'dante-mercer'}]},
          }
        : {
            menu: {
              items: [
                {
                  url: 'https://checkout.render-lab.org/policies/privacy-policy',
                },
                {url: '/collections/neon-speed'},
              ],
            },
          },
    ),
  );
  const data = await rootLoader({
    request: new Request('https://render-lab.org/'),
    context: {
      storefront: {
        query,
        CacheShort: vi.fn(),
        CacheLong: vi.fn(),
        i18n: {country: 'US', language: 'EN'},
      },
      env: {},
      cart: {get: vi.fn().mockResolvedValue({checkoutUrl})},
      customerAccount: {isLoggedIn: vi.fn().mockResolvedValue(false)},
    },
  } as never);
  expect(data.header.shop.primaryDomain.url).toBe('https://render-lab.org');
  expect(data.header.collections.nodes).toEqual([{handle: 'carnivora'}]);
  expect(data.header.artists.nodes).toEqual([{handle: 'jb-render'}]);
  expect(data.header.menu?.items).toEqual([]);
  expect((await data.footer)?.menu?.items).toEqual([
    {url: '/policies/privacy-policy'},
  ]);
  expect(await data.cart).toEqual({checkoutUrl});
});

it.each([
  'alt-history',
  'neon-speed',
  'limited-editions',
  'hoodies',
  'bundles',
  'unknown',
])(
  'redirects non-live collection %s before querying Shopify',
  async (handle) => {
    const query = vi.fn();
    await expect(
      collectionLoader({
        params: {handle},
        context: {storefront: {query}},
      } as never),
    ).rejects.toMatchObject({status: 301, headers: expect.any(Headers)});
    try {
      await collectionLoader({params: {handle}} as never);
    } catch (response) {
      expect((response as Response).headers.get('Location')).toBe(
        '/collections/wall-art',
      );
    }
    expect(query).not.toHaveBeenCalled();
    expect(allLoader().headers.get('Location')).toBe('/collections/wall-art');
  },
);

it.each(['dante-mercer', 'kai-stratos', 'mara-voss', 'nico-vale'])(
  'permanently redirects retired artist %s',
  async (handle) => {
    await expect(
      artistLoader({params: {handle}} as never),
    ).rejects.toMatchObject({status: 301});
  },
);

it('keeps all thirteen live collection sitemap URLs, preserving dates and product entries', () => {
  const handles = [
    ...FORMAT_COLLECTION_HANDLES,
    ...SERIES_COLLECTION_HANDLES,
    'alt-history',
    'neon-speed',
    'hoodies',
    'limited-editions',
  ];
  const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${handles.map((handle) => `<url><loc>https://render-lab.org/collections/${handle}</loc><lastmod>2026-01-01</lastmod></url>`).join('')}<url><loc>https://render-lab.org/products/art</loc></url></urlset>`;
  const doc = new DOMParser().parseFromString(
    filterCollectionSitemapXml(xml),
    'application/xml',
  );
  expect(doc.querySelector('parsererror')).toBeNull();
  expect(doc.querySelectorAll('url')).toHaveLength(14);
  expect(doc.querySelectorAll('lastmod')).toHaveLength(13);
  expect(doc.documentElement.textContent).not.toContain('alt-history');
});

it('adds homepage ItemList, studio identity, search and preserves return policy', () => {
  const graph = getGlobalStructuredData(
    SERIES_COLLECTION_HANDLES.map((handle) => ({
      title: handle,
      to: `/collections/${handle}`,
    })),
  )['@graph'];
  expect(graph.find((node) => node['@type'] === 'ItemList')).toMatchObject({
    itemListElement: expect.any(Array),
  });
  expect(graph.find((node) => node['@type'] === 'Organization')).toMatchObject({
    logo: 'https://render-lab.org/favicon.svg',
    founder: {name: 'J.B. Render'},
    hasMerchantReturnPolicy: expect.any(Object),
  });
  expect(graph.find((node) => node['@type'] === 'WebSite')).toMatchObject({
    potentialAction: {
      target: {
        urlTemplate: 'https://render-lab.org/search?q={search_term_string}',
      },
    },
  });
  expect(
    getGlobalStructuredData()['@graph'].some(
      (node) => node['@type'] === 'ItemList',
    ),
  ).toBe(false);
});

it('allows requested crawlers on public pages while preserving checkout noindex', () => {
  const robots = getRobotsTxt('https://render-lab.org/robots.txt');
  for (const agent of [
    'Googlebot',
    'Google-Extended',
    'OAI-SearchBot',
    'bingbot',
  ])
    expect(robots).toContain(`User-agent: ${agent}`);
  expect(robots).toContain('Sitemap: https://render-lab.org/sitemap.xml');
  expect(robots).toContain('Disallow: /account');
  expect(getRobotsTxt('https://checkout.render-lab.org/robots.txt')).toBe(
    'User-agent: *\nDisallow: /',
  );
  expect(
    getEnvironmentRobotsDirective('https://checkout.render-lab.org/'),
  ).toContain('noindex');
});
