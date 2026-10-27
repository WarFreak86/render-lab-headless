// Read-only public/Storefront API audit. Never logs credentials or changes Shopify.
/* eslint-disable no-console -- CLI progress and machine-readable audit summary. */
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const origin = 'https://render-lab.org';
const output = new URL('../docs/indexing-evidence/', import.meta.url);
await mkdir(output, {recursive: true});
const env = Object.fromEntries(
  (await readFile(new URL('../.env', import.meta.url), 'utf8'))
    .split(/\r?\n/)
    .flatMap((line) => {
      const match = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$/);
      return match
        ? [[match[1], match[2].replace(/^(['"])(.*)\1$/, '$2')]]
        : [];
    }),
);
async function api(query, variables = {}) {
  const response = await fetch(
    `https://${env.PUBLIC_STORE_DOMAIN.replace(/^https?:\/\//, '')}/api/2026-04/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': env.PUBLIC_STOREFRONT_API_TOKEN,
      },
      body: JSON.stringify({query, variables}),
    },
  );
  const result = await response.json();
  if (!response.ok || result.errors)
    throw new Error(JSON.stringify(result.errors ?? response.status));
  return result.data;
}
async function get(url) {
  const start = Date.now();
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(45000),
  });
  return {
    url,
    status: response.status,
    headers: Object.fromEntries(response.headers),
    text: await response.text(),
    elapsedMs: Date.now() - start,
  };
}
function xml(text, selector) {
  const document = new JSDOM(text, {contentType: 'text/xml'}).window.document;
  return [...document.querySelectorAll(selector)];
}
const index = await get(`${origin}/sitemap.xml`);
const partitions = [];
for (const loc of xml(index.text, 'sitemap > loc')) {
  const first = await get(loc.textContent);
  const second = await get(loc.textContent);
  const entries = xml(first.text, 'url').map((entry) => ({
    url: entry.querySelector('loc').textContent,
    lastmod: entry.querySelector('lastmod')?.textContent ?? null,
  }));
  const again = xml(second.text, 'url').map((entry) => ({
    url: entry.querySelector('loc').textContent,
    lastmod: entry.querySelector('lastmod')?.textContent ?? null,
  }));
  partitions.push({
    url: first.url,
    status: first.status,
    entries,
    repeatedEntries: again,
    firstDate: first.headers.date,
    secondDate: second.headers.date,
  });
  await writeFile(
    new URL(
      first.url.replace(`${origin}/sitemap/`, '').replaceAll('/', '-'),
      output,
    ),
    first.text,
  );
}
console.log(
  'Sitemap partitions:',
  partitions.map((p) => ({
    url: p.url,
    count: p.entries.length,
    changingDates: p.entries.filter(
      (e, i) => e.lastmod !== p.repeatedEntries[i]?.lastmod,
    ).length,
  })),
);
const products = [];
let after = null;
do {
  const data = await api(
    `query IndexingProducts($after: String) { products(first: 100, after: $after) { nodes { handle title updatedAt publishedAt availableForSale description collections(first: 100) { nodes { handle } pageInfo { hasNextPage } } } pageInfo { hasNextPage endCursor } } }`,
    {after},
  );
  products.push(...data.products.nodes);
  after = data.products.pageInfo.hasNextPage
    ? data.products.pageInfo.endCursor
    : null;
} while (after);
const apiSitemaps = [];
for (const partition of partitions.filter((p) =>
  p.url.includes('/products/'),
)) {
  const page = Number(partition.url.match(/\/(\d+)\.xml$/)[1]);
  const query =
    'query IndexingSitemap($page: Int!) { sitemap(type: PRODUCT) { resources(page: $page) { items { handle updatedAt } } } }';
  apiSitemaps.push({
    page,
    first: await api(query, {page}),
    second: await api(query, {page}),
  });
}
const robots = await get(`${origin}/robots.txt`);
await writeFile(new URL('robots.txt', output), robots.text);
const sitemapUrls = partitions.flatMap((p) => p.entries.map((e) => e.url));
const queue = [
  ...new Set([
    origin + '/',
    origin + '/collections',
    ...sitemapUrls.filter((url) => /\/(products|collections)\//.test(url)),
  ]),
];
const visited = new Set();
const pages = [];
// Follow collection pagination and directory links as actual HTML anchors.
while (queue.length) {
  const url = queue.shift();
  if (visited.has(url)) continue;
  visited.add(url);
  if (visited.size > 400) throw new Error('Audit crawl cap exceeded');
  try {
    const response = await get(url);
    const document = new JSDOM(response.text).window.document;
    const links = [...document.querySelectorAll('a[href]')]
      .map((a) => new URL(a.getAttribute('href'), url).href)
      .filter((link) => link.startsWith(origin + '/'));
    const visible = document.body.cloneNode(true);
    visible
      .querySelectorAll('script, style, template')
      .forEach((node) => node.remove());
    const page = {
      url,
      status: response.status,
      redirect: response.headers.location ?? null,
      xRobotsTag: response.headers['x-robots-tag'] ?? null,
      canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map(
        (e) => e.getAttribute('href'),
      ),
      robots: [
        ...document.querySelectorAll(
          'meta[name="robots"], meta[name="googlebot"]',
        ),
      ].map((e) => e.getAttribute('content')),
      h1: [...document.querySelectorAll('h1')].map((e) => e.textContent.trim()),
      bodyTextLength: visible.textContent.trim().length,
      title: document.title,
      links: [...new Set(links)],
      elapsedMs: response.elapsedMs,
      productTitleInHtml: products.find(
        (p) => url === `${origin}/products/${p.handle}`,
      )?.title
        ? visible.textContent.includes(
            products.find((p) => url === `${origin}/products/${p.handle}`)
              .title,
          )
        : null,
      descriptionInHtml: products.find(
        (p) => url === `${origin}/products/${p.handle}`,
      )?.description
        ? visible.textContent
            .replace(/\s+/g, ' ')
            .includes(
              products
                .find((p) => url === `${origin}/products/${p.handle}`)
                .description.replace(/\s+/g, ' '),
            )
        : null,
      jsonLd: [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].map((e) => JSON.parse(e.textContent)),
    };
    pages.push(page);
    if (!url.includes('/products/'))
      for (const link of page.links) {
        const parsed = new URL(link);
        if (
          parsed.pathname.startsWith('/collections/') &&
          (!parsed.search ||
            (parsed.searchParams.has('cursor') &&
              [...parsed.searchParams.keys()].every((key) =>
                ['cursor', 'direction'].includes(key),
              )))
        )
          queue.push(link);
      }
  } catch (error) {
    pages.push({url, error: error.message});
  }
  if (pages.length % 25 === 0)
    console.log(`Audited ${pages.length} pages; ${queue.length} queued`);
}
const result = {
  observedAt: new Date().toISOString(),
  origin,
  partitions,
  apiSitemaps,
  products: products.map((product) => {
    const result = {...product};
    delete result.description;
    return result;
  }),
  pages: pages.map(({jsonLd, ...page}) => ({
    ...page,
    structuredDataTypes: jsonLd
      ?.flatMap((value) => value['@graph'] ?? [value])
      .map((value) => value['@type']),
  })),
};
await writeFile(
  new URL('audit.json', output),
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      products: products.length,
      pages: pages.length,
      errors: pages
        .filter((p) => p.error || p.status !== 200)
        .map((p) => ({url: p.url, status: p.status, error: p.error})),
      unlinkedProducts: products
        .filter(
          (p) =>
            !pages.some(
              (page) =>
                !page.url.includes('/products/') &&
                page.links?.some(
                  (link) => new URL(link).pathname === `/products/${p.handle}`,
                ),
            ),
        )
        .map((p) => p.handle),
    },
    null,
    2,
  ),
);
/* eslint-enable no-console */
