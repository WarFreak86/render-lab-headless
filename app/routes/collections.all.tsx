import {getPaginationVariables} from '@shopify/hydrogen';
import {useLoaderData, useSearchParams} from 'react-router';
import type {Route} from './+types/collections.all';
import {CollectionView} from '~/components/collection/CollectionView';
import {getProductionUrl} from '~/lib/config';
import {
  getCollectionSortVariables,
  normalizeCollectionPage,
  parseSortValue,
  type RawCollectionPage,
} from '~/lib/collection';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {isSuppressedProduct} from '~/lib/merchandising';

const ALL_ART_DESCRIPTION = 'Browse all available Render-Lab art and objects.';

export const meta: Route.MetaFunction = () => {
  const canonical = getProductionUrl('/collections/all');
  const title = 'All Art | Render-Lab';
  return [
    {title},
    {name: 'description', content: ALL_ART_DESCRIPTION},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: title},
    {property: 'og:description', content: ALL_ART_DESCRIPTION},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
  ];
};

export async function loader({context, request}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const pagination = getPaginationVariables(request, {pageBy: 12});
  const sort = getCollectionSortVariables(parseSortValue(url.searchParams), 'all');
  const {products} = await context.storefront.query(CATALOG_QUERY, {
    variables: {...pagination, ...sort},
  });
  const visibleProducts = {
    ...products,
    nodes: products.nodes.filter(
      (product) =>
        !isSuppressedProduct({
          handle: product.handle,
          title: product.title,
          imageUrl: product.featuredImage?.url,
        }),
    ),
  };

  const collectionPage = normalizeCollectionPage(
    {
      id: 'all-art',
      handle: 'all',
      title: 'All Art',
      description: null,
      image: null,
      products: visibleProducts,
    } satisfies RawCollectionPage,
    {allArt: true},
  );

  return {
    collectionPage,
    productConnection: {
      nodes: collectionPage.products,
      pageInfo: products.pageInfo,
    },
  };
}

export default function AllCollectionsRoute() {
  const {collectionPage, productConnection} = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  return (
    <CollectionView
      connection={productConnection}
      data={collectionPage}
      searchParams={searchParams}
    />
  );
}

const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      sortKey: $sortKey
      reverse: $reverse
    ) {
      nodes {
        ...ProductCard
        productType
        availableForSale
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
