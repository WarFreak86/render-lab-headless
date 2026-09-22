import {Analytics, getPaginationVariables} from '@shopify/hydrogen';
import {redirect, useLoaderData, useSearchParams} from 'react-router';
import type {CollectionDirectoryQuery} from 'storefrontapi.generated';
import type {Route} from './+types/collections.$handle';
import {CollectionView} from '~/components/collection/CollectionView';
import {CollectionDirectoryView} from '~/components/collection/CollectionDirectoryView';
import {getProductionUrl} from '~/lib/config';
import {
  getApprovedEditorialCollectionSeo,
  getCollectionSortVariables,
  normalizeCollectionPage,
  parseProductFilters,
  parseSortValue,
  type CollectionPageData,
  type RawCollectionPage,
} from '~/lib/collection';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {
  applyMaterialCollectionContext,
  MATERIAL_BY_COLLECTION_HANDLE,
  materialCollectionHandleForValue,
  productSupportsMaterial,
} from '~/lib/material-collection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {getCollectionCanonicalUrl, getMetaDescription} from '~/lib/seo';
import {
  buildCollectionDirectoryEntries,
  getCollectionDirectoryPresentation,
  getCollectionDirectorySeo,
  isCollectionDirectoryHandle,
} from '~/lib/collection-directory';

export const meta: Route.MetaFunction = ({data, location}) => {
  const page = data?.collectionPage;
  const directorySeo =
    data?.mode === 'directory' &&
    page &&
    isCollectionDirectoryHandle(page.handle)
      ? getCollectionDirectorySeo(page.handle)
      : null;
  const approvedEditorialSeo =
    data?.mode === 'products' && page
      ? getApprovedEditorialCollectionSeo(page.handle)
      : null;
  const shopifySeoTitle =
    (data?.mode === 'products' && data.collectionSeoTitle?.trim()) || null;
  const shopifySeoDescription =
    (approvedEditorialSeo &&
      data?.mode === 'products' &&
      data.collectionSeoDescription?.trim()) ||
    null;
  const title =
    directorySeo?.title ??
    approvedEditorialSeo?.title ??
    (approvedEditorialSeo ? shopifySeoTitle : null) ??
    `${page?.hero.title ?? 'Collection'} | Render-Lab`;
  const description =
    directorySeo?.description ??
    shopifySeoDescription ??
    getMetaDescription(
      data?.collectionSeoDescription,
      page?.hero.description,
      `Browse ${page?.hero.title ?? 'the collection'} at Render-Lab.`,
    );
  const canonical =
    data?.mode === 'products'
      ? getCollectionCanonicalUrl(page?.handle ?? '', location.search)
      : getProductionUrl(`/collections/${page?.handle ?? ''}`);
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
      directoryHandle: directory.handle,
      collectionPage: directory.collectionPage,
      directoryEntries: directory.entries,
      analyticsCollectionId: directory.analyticsCollectionId,
      collectionSeoDescription: directory.collectionSeoDescription,
    };
  }

  const url = new URL(request.url);
  const materialCollectionHandle = materialCollectionHandleForValue(
    url.searchParams.get('material'),
  );
  // Material-linked collection pages are small editorial sets. Fetch enough of the
  // collection at once so filtering by a real Material/Finish variant never leaves
  // a misleading product in the grid or an artificially sparse first page.
  const pagination = getPaginationVariables(request, {
    pageBy: materialCollectionHandle ? 50 : 12,
  });
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

  const preferredMaterial = materialCollectionHandle
    ? MATERIAL_BY_COLLECTION_HANDLE[materialCollectionHandle]
    : null;
  const products = normalizedPage.products.flatMap((product, index) => {
    const variants = collection.products.nodes[index]?.variants?.nodes ?? [];
    if (
      preferredMaterial &&
      !productSupportsMaterial(variants, preferredMaterial)
    ) {
      return [];
    }
    return [
      applyMaterialCollectionContext({
        product,
        collectionHandle: materialCollectionHandle ?? collection.handle,
        variants,
      }),
    ];
  });
  const collectionPage = {...normalizedPage, products};

  return {
    mode: 'products' as const,
    collectionPage,
    productConnection: {
      nodes: products,
      pageInfo: collection.products.pageInfo,
    },
    collectionSeoTitle: collection.seo.title,
    collectionSeoDescription: collection.seo.description,
  };
}

export default function CollectionRoute() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  if (data.mode === 'directory') {
    return (
      <>
        <CollectionDirectoryView
          directoryHandle={data.directoryHandle}
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
  const presentation = getCollectionDirectoryPresentation(handle);

  return {
    handle,
    collectionPage: {
      ...collectionPage,
      hero: {
        ...collectionPage.hero,
        title: presentation.title,
        eyebrow: collectionPage.hero.editorialHeading ?? presentation.eyebrow,
        editorialHeading: presentation.editorialHeading,
      },
    },
    entries: buildCollectionDirectoryEntries(collections.nodes, handle),
    analyticsCollectionId: collection?.id ?? null,
    collectionSeoDescription: collection?.seo.description ?? null,
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
      seo {
        title
        description
      }
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
            biography: field(key: "bio") { value }
            profileUrl: field(key: "profile_link") { value }
            photo: field(key: "profile_image") {
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
          variants(first: 50) {
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
      seo {
        description
      }
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
    collections(first: 100, sortKey: UPDATED_AT, reverse: true) {
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
        products(first: 20) {
          nodes {
            id
            variants(first: 50) {
              nodes {
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
