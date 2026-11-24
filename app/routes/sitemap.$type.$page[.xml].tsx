import {filterCollectionSitemapXml} from '~/lib/catalog-collections';
import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {getSitemap} from '@shopify/hydrogen';
import {filterSuppressedSitemapXml} from '~/lib/merchandising';
import {getProductionRequest} from '~/lib/seo';
import {getProductionUrl} from '~/lib/config';
import {withProductSitemapLastmod} from '~/lib/product-sitemap';

export async function loader({
  request,
  params,
  context: {storefront},
}: Route.LoaderArgs) {
  if (
    !['products', 'pages', 'collections', 'blogs'].includes(params.type ?? '') ||
    !/^[1-9]\d*$/.test(params.page ?? '') ||
    !Number.isSafeInteger(Number(params.page))
  ) {
    return new Response('Sitemap page not found', {status: 404});
  }
  const response = await getSitemap({
    storefront,
    request: getProductionRequest(request),
    params,
    getLink: ({type, baseUrl, handle}) => `${baseUrl}/${type}/${handle}`,
  });
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);
  let xml = filterCollectionSitemapXml(
    filterSuppressedSitemapXml(await response.text()),
  );
  // Hydrogen supplies the homepage for empty partitions. Its only listing
  // belongs in the storefront sitemap. The parked News blog redirects.
  xml = xml.replace(/<url>[^]*?<\/url>/gi, (entry) => {
    const location = entry.match(/<loc>([^<]+)<\/loc>/i)?.[1];
    return location === getProductionUrl('/') ||
      location === getProductionUrl('/blogs/news')
      ? ''
      : entry;
  });
  if (params.type === 'products' && response.ok) {
    xml = await withProductSitemapLastmod(xml, storefront);
  }
  if (response.ok && !/<url>/i.test(xml)) {
    return new Response('Sitemap page not found', {status: 404});
  }

  return new Response(xml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
