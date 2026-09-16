import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';
import {Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {getProductionUrl} from '~/lib/config';
import {isSuppressedMerchandisingAssetUrl} from '~/lib/merchandising';
import {storefrontSeriesCollectionsAlphabetical} from '~/lib/catalog-collections';

export const meta: Route.MetaFunction = () => {
  const canonical = getProductionUrl('/collections');
  const title = 'Collections | Render-Lab';
  const description =
    'Explore Render-Lab wall art, curated series, and collector bundles.';
  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const {collections} = await context.storefront.query(COLLECTIONS_QUERY);
  const visibleCollections = storefrontSeriesCollectionsAlphabetical(
    collections.nodes,
  );

  const safeFallbackImage = visibleCollections
    .map((collection) => collection.image)
    .find(
      (image) =>
        image?.url && !isSuppressedMerchandisingAssetUrl(image.url),
    );
  const displayCollections = visibleCollections.map((collection) => ({
    ...collection,
    image:
      collection.image?.url &&
      !isSuppressedMerchandisingAssetUrl(collection.image.url)
        ? collection.image
        : safeFallbackImage ?? null,
  }));

  return {collections: displayCollections};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="collections">
      <h1>Collections</h1>
      <div className="collections-grid">
        {collections.map((collection, index) => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function CollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  return (
    <Link
      className="collection-item"
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      {collection.image ? (
        <Image
          alt={collection.image.altText || collection.title}
          aspectRatio="1/1"
          data={collection.image}
          loading={index < 3 ? 'eager' : undefined}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      ) : null}
      <h2>{collection.title}</h2>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
    products(first: 1) {
      nodes {
        id
      }
    }
  }
  query StoreCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 100, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...Collection
      }
    }
  }
` as const;
