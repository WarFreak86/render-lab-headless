import {Analytics, getPaginationVariables} from '@shopify/hydrogen';
import {redirect, useLoaderData, useSearchParams} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {CollectionView} from '~/components/collection/CollectionView';
import {getProductionUrl} from '~/lib/config';
import {
  getCollectionSortVariables,
  normalizeCollectionPage,
  parseProductFilters,
  parseSortValue,
  type RawCollectionPage,
} from '~/lib/collection';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {applyMaterialCollectionContext} from '~/lib/material-collection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  const page = data?.collectionPage;
  const title = `${page?.hero.title ?? 'Collection'} | Render-Lab`;
  const description =
    page?.hero.description ??
    `Browse ${page?.hero.title ?? 'the collection'} at Render-Lab.`;
  const canonical = getProductionUrl(`/collections/${page?.handle ?? ''}`);
  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
    ...(page?.hero.image
      ? [
          {property: 'og:image', content: page.hero.image.url},
          {property: 'og:image:alt', content: page.hero.image.altText},
        ]
      : []),
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw redirect('/collections');

  const url = new URL(request.url);
  const pagination = getPaginationVariables(request, {pageBy: 12});
  const filters = parseProductFilters(url.searchParams);
  const sort = getCollectionSortVariables(
    parseSortValue(url.searchParams),
    'collection',
  );
  const {collection} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...pagination, filters, ...sort},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  const heroReference = collection.heroMedia?.reference;
  const normalizedPage = normalizeCollectionPage({
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    image: collection.image,
    editorialHeading: collection.editorialHeading,
    editorialCopy: collection.editorialCopy,
    heroMedia:
      heroReference && 'image' in heroReference
        ? {reference: {image: heroReference.image}}
        : null,
    products: collection.products,
  } satisfies RawCollectionPage);

  const products = normalizedPage.products.map((product, index) =>
    applyMaterialCollectionContext({
      product,
      collectionHandle: collection.handle,
      variants: collection.products.nodes[index]?.variants?.nodes ?? [],
    }),
  );
  const collectionPage = {...normalizedPage, products};

  return {
    collectionPage,
    productConnection: {
      nodes: products,
      pageInfo: collection.products.pageInfo,
    },
  };
}

export default function CollectionRoute() {
  const {collectionPage, productConnection} = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  return (
    <>
      <CollectionView
        connection={productConnection}
        data={collectionPage}
        searchParams={searchParams}
      />
      <Analytics.CollectionView
        data={{
          collection: {
            id: collectionPage.id,
            handle: collectionPage.handle,
          },
        }}
      />
    </>
  );
}

const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        id
        url
        altText
        width
        height
      }
      editorialHeading: metafield(namespace: "custom", key: "editorial_heading") {
        value
      }
      editorialCopy: metafield(namespace: "custom", key: "editorial_copy") {
        value
      }
      heroMedia: metafield(namespace: "custom", key: "hero_media") {
        reference {
          ... on MediaImage {
            image {
              id
              url
              altText
              width
              height
            }
          }
        }
      }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        filters: $filters
        sortKey: $sortKey
        reverse: $reverse
      ) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        nodes {
          ...ProductCard
          productType
          availableForSale
          variants(first: 20) {
            nodes {
              availableForSale
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
