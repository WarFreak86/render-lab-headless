import {filterCollectionSitemapXml} from '~/lib/catalog-collections';
import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {getSitemap} from '@shopify/hydrogen';
import {filterSuppressedSitemapXml} from '~/lib/merchandising';
import {getProductionRequest} from '~/lib/seo';
import {withProductSitemapLastmod} from '~/lib/product-sitemap';

export async function loader({
  request,
  params,
  context: {storefront},
}: Route.LoaderArgs) {
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
  if (params.type === 'products' && response.ok) {
    xml = await withProductSitemapLastmod(xml, storefront);
  }

  return new Response(xml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
