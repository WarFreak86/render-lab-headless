import type {Storefront} from '@shopify/hydrogen';

type ProductTimestamp = {handle: string; updatedAt: string};

/** Shopify's sitemap PRODUCT resources can report request time as updatedAt.
 * Resolve the actual products by handle instead, without changing membership,
 * partitioning, URLs, or other resource types. Missing dates are optional in XML.
 */
export async function withProductSitemapLastmod(
  xml: string,
  storefront: Pick<Storefront, 'query'>,
) {
  const handles = [
    ...xml.matchAll(
      /<loc>https:\/\/render-lab\.org\/products\/([^<]+)<\/loc>/g,
    ),
  ].map((match) => match[1]);
  const timestamps = new Map<string, string>();

  // Bounded alias batches avoid scanning the entire catalog for each partition.
  for (let offset = 0; offset < handles.length; offset += 50) {
    const batch = handles.slice(offset, offset + 50);
    const query = `query ProductSitemapTimestamps {
      ${batch.map((handle, index) => `p${index}: product(handle: ${JSON.stringify(handle)}) { handle updatedAt }`).join('\n')}
    }`;
    try {
      const data =
        await storefront.query<Record<string, ProductTimestamp | null>>(query);
      for (let index = 0; index < batch.length; index++) {
        const product = data[`p${index}`];
        if (
          product &&
          batch.includes(product.handle) &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(
            product.updatedAt,
          ) &&
          Number.isFinite(Date.parse(product.updatedAt)) &&
          Date.parse(product.updatedAt) <= Date.now()
        ) {
          timestamps.set(product.handle, product.updatedAt);
        }
      }
    } catch {
      // Sitemap discovery must still work when optional timestamp lookups fail.
      // Do not fall back to sitemap-resource updatedAt or the current time.
      console.warn(
        'Product sitemap timestamps unavailable; omitting lastmod for this batch.',
      );
    }
  }

  return xml.replace(/<url>[^]*?<\/url>/g, (entry) => {
    const handle = entry.match(
      /<loc>https:\/\/render-lab\.org\/products\/([^<]+)<\/loc>/,
    )?.[1];
    if (!handle) return entry;
    const withoutDate = entry.replace(/\s*<lastmod>[^<]*<\/lastmod>/g, '');
    const updatedAt = timestamps.get(handle);
    return updatedAt
      ? withoutDate.replace(
          '</loc>',
          `</loc>\n  <lastmod>${updatedAt}</lastmod>`,
        )
      : withoutDate;
  });
}
