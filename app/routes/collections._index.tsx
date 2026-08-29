import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';
import {Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {getProductionUrl} from '~/lib/config';

const HIDDEN_COLLECTION_HANDLES = new Set([
  'frontpage',
  'digital-downloads',
  'limited-edition-clothing',
]);

const COLLECTION_PRIORITY = [
  'wall-art',
  'nightmare-lab-halloween-2026',
  'neon-memento',
  'metal-wall-art',
  'canvas-art',
  'posters',
  'bundles',
  'limited-editions',
  'after-dark',
  'neon-speed',
  'alt-history',
  'alt-timeline',
] as const;

export const meta: Route.MetaFunction = () => {
  const canonical = getProductionUrl('/collections');
  const title = 'Collections | Render-Lab';
  const description = 'Explore Render-Lab wall art, curated series, and collector bundles.';
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
  const rank = new Map(
    COLLECTION_PRIORITY.map((handle, index) => [handle, index]),
  );
  const visibleCollections = collections.nodes
    .filter(
      (collection) =>
        !HIDDEN_COLLECTION_HANDLES.has(collection.handle) &&
        collection.products.nodes.length > 0,
    )
    .sort((left, right) => {
      const leftRank = rank.get(left.handle) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = rank.get(right.handle) ?? Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank || left.title.localeCompare(right.title);
    });

  return {collections: visibleCollections};
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
    collections(first: 50) {
      nodes {
        ...Collection
      }
    }
  }
` as const;
