import {Analytics, getPaginationVariables} from '@shopify/hydrogen';
import {redirect, useLoaderData, useSearchParams} from 'react-router';
import type {CollectionDirectoryQuery} from 'storefrontapi.generated';
import type {Route} from './+types/collections.$handle';
import {CollectionView} from '~/components/collection/CollectionView';
import {CollectionDirectoryView} from '~/components/collection/CollectionDirectoryView';
import {getProductionUrl} from '~/lib/config';
import {
  getCollectionSortVariables,
  normalizeCollectionPage,
  parseProductFilters,
  parseSortValue,
  type CollectionPageData,
  type RawCollectionPage,
} from '~/lib/collection';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {applyMaterialCollectionContext} from '~/lib/material-collection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  buildCollectionDirectoryEntries,
  getCollectionDirectoryPresentation,
  isCollectionDirectoryHandle,
} from '~/lib/collection-directory';

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

  if (isCollectionDirectoryHandle(handle)) {
    const directory = await loadCollectionDirectory(context, handle);
    return {
      mode: 'directory' as const,
      collectionPage: directory.collectionPage,
      directoryEntries: directory.entries,
      analyticsCollectionId: directory.analyticsCollectionId,
    };
  }

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
    artist:
      collection.artist?.reference && 'name' in collection.artist.reference
        ? {reference: collection.artist.reference}
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
    mode: 'products' as const,
    collectionPage,
    productConnection: {
      nodes: products,
      pageInfo: collection.products.pageInfo,
    },
  };
}

export default function CollectionRoute() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  if (data.mode === 'directory') {
    return (
      <>
        <CollectionDirectoryView
          entries={data.directoryEntries}
          hero={data.collectionPage.hero}
        />
        {data.analyticsCollectionId ? (
          <Analytics.CollectionView
            data={{
              collection: {
                id: data.analyticsCollectionId,
                handle: data.collectionPage.handle,
              },
            }}
          />
        ) : null}
      </>
    );
  }

  const {collectionPage, productConnection} = data;
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

async function loadCollectionDirectory(
  context: Route.LoaderArgs['context'],
  handle: Parameters<typeof buildCollectionDirectoryEntries>[1],
) {
  const {collection, collections} = await context.storefront.query(
    COLLECTION_DIRECTORY_QUERY,
    {variables: {handle}},
  );
  const collectionPage = collection
    ? normalizeDirectoryCollection(collection)
    : buildFallbackDirectoryPage(handle);

  return {
    collectionPage,
    entries: buildCollectionDirectoryEntries(collections.nodes, handle),
    analyticsCollectionId: collection?.id ?? null,
  };
}

function normalizeDirectoryCollection(
  collection: NonNullable<CollectionDirectoryQuery['collection']>,
) {
  const heroReference = collection.heroMedia?.reference;
  return normalizeCollectionPage({
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
}

function buildFallbackDirectoryPage(
  handle: Parameters<typeof getCollectionDirectoryPresentation>[0],
): CollectionPageData {
  const presentation = getCollectionDirectoryPresentation(handle);
  return {
    id: `directory:${handle}`,
    handle,
    hero: {
      title: presentation.title,
      eyebrow: presentation.eyebrow,
      editorialHeading: presentation.editorialHeading,
      description: presentation.description,
      image: null,
    },
    products: [],
    filterGroups: [],
  };
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
      artist: metafield(namespace: "custom", key: "artist") {
        reference {
          ... on Metaobject {
            id
            handle
            name: field(key: "name") { value }
            biography: field(key: "biography") { value }
            profileUrl: field(key: "profile_url") { value }
            photo: field(key: "photo") {
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

const COLLECTION_DIRECTORY_QUERY = `#graphql
  query CollectionDirectory(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
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
      products(first: 1) {
        nodes {
          ...ProductCard
          productType
          availableForSale
        }
      }
    }
    collections(first: 100) {
      nodes {
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
        directoryGroups: metafield(namespace: "custom", key: "directory_groups") {
          value
        }
        products(first: 1) {
          nodes { id }
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
