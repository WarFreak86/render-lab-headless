import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {MockShopNotice} from '~/components/MockShopNotice';
import {HomepageView} from '~/components/homepage/HomepageView';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {getProductionUrl} from '~/lib/config';
import {
  HOMEPAGE_EDITORIAL_FALLBACK,
  normalizeHomepageData,
} from '~/lib/homepage';

const HOME_DESCRIPTION =
  'Discover Render-Lab wall art, collector editions, and apparel across metal, canvas, and poster formats.';

export const meta: Route.MetaFunction = ({data}) => {
  const canonical = getProductionUrl('/');
  const image = data?.homepage.hero?.image;
  return [
    {title: 'Render-Lab | Art for considered spaces'},
    {name: 'description', content: HOME_DESCRIPTION},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Render-Lab | Art for considered spaces'},
    {property: 'og:description', content: HOME_DESCRIPTION},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
    ...(image
      ? [
          {property: 'og:image', content: image.url},
          {property: 'og:image:alt', content: image.altText},
        ]
      : []),
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const {collections, products, artists} =
    await context.storefront.query(HOMEPAGE_QUERY);

  const homepageArtists = artists.nodes
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
        products: products.nodes,
        featuredDropProduct: null,
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
        productType
        availableForSale
      }
    }
  }

  query Homepage(
    $country: CountryCode
    $language: LanguageCode
  )
    @inContext(country: $country, language: $language) {
    collections(first: 100, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...HomepageCollection
      }
    }
    products(first: 12, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...ProductCard
        description
        descriptionHtml
        productType
        availableForSale
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
