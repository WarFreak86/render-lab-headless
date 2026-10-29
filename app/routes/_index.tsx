import homeStyles from '~/styles/home-bundle.css?url';
import {LIVE_COLLECTION_QUERY} from '~/lib/catalog-collections';
import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {MockShopNotice} from '~/components/MockShopNotice';
import {HomepageView} from '~/components/homepage/HomepageView';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {getProductionUrl} from '~/lib/config';
import {isStorefrontArtistReady} from '~/lib/navigation';
import {
  HOMEPAGE_EDITORIAL_FALLBACK,
  HOMEPAGE_HERO_IMAGE,
  normalizeHomepageData,
} from '~/lib/homepage';

const HOME_TITLE =
  'Dark Modern Wall Art, Metal Prints & Stretched Canvas | Render-Lab';
export const links = () => [{rel: 'stylesheet', href: homeStyles}];
const HOME_DESCRIPTION =
  'Shop bold metal wall art, gallery-wrapped canvas prints, and archival posters by J.B. Render and Render-Lab Studio. Explore dark gothic, classic muscle car, macro botanical, military, and cinematic art collections.';

export const meta: Route.MetaFunction = () => {
  const canonical = getProductionUrl('/');
  const image = HOMEPAGE_HERO_IMAGE;
  return [
    {title: HOME_TITLE},
    {name: 'description', content: HOME_DESCRIPTION},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: HOME_TITLE},
    {property: 'og:description', content: HOME_DESCRIPTION},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
    {property: 'og:image', content: image.url},
    {property: 'og:image:alt', content: image.altText},
    {property: 'og:image:width', content: String(image.width)},
    {property: 'og:image:height', content: String(image.height)},
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const {collections, artists} = await context.storefront.query(
    HOMEPAGE_QUERY,
    {variables: {collectionQuery: LIVE_COLLECTION_QUERY}},
  );

  const homepageArtists = artists.nodes
    .filter((artist) => isStorefrontArtistReady(artist.handle))
    .map((artist) => {
      const photoReference = artist.photo?.reference;
      return {
        id: artist.id,
        handle: artist.handle,
        name: artist.name?.value?.trim() || artist.handle,
        biography: artist.biography?.value?.trim() || '',
        image:
          photoReference && 'image' in photoReference
            ? photoReference.image
            : null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    artists: homepageArtists,
    homepage: normalizeHomepageData(
      {
        collections: collections.nodes,
        products: [],
      },
      HOMEPAGE_EDITORIAL_FALLBACK,
    ),
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      {data.isShopLinked ? null : <MockShopNotice />}
      <HomepageView artists={data.artists} data={data.homepage} />
    </>
  );
}

const HOMEPAGE_QUERY = `#graphql
  fragment HomepageCollection on Collection {
    id
    handle
    title
    description
    descriptionHtml
    image {
      id
      url
      altText
      width
      height
    }
    products(first: 6) {
      nodes {
        ...ProductCard
        description
        descriptionHtml
        options { name optionValues { name } }
        productType
        availableForSale
      }
    }
  }

  query Homepage(
    $collectionQuery: String!
    $country: CountryCode
    $language: LanguageCode
  )
    @inContext(country: $country, language: $language) {
    collections(query: $collectionQuery, first: 100, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...HomepageCollection
      }
    }
    artists: metaobjects(type: "artist", first: 100) {
      nodes {
        id
        handle
        name: field(key: "name") { value }
        biography: field(key: "bio") { value }
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
  ${PRODUCT_CARD_FRAGMENT}
` as const;
