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
import {DROP_CONFIGS} from '~/lib/drops';

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
  const {collections, products, featuredDropProduct} =
    await context.storefront.query(HOMEPAGE_QUERY, {
      variables: {dropHandle: DROP_CONFIGS[0].productHandle},
    });
  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    homepage: normalizeHomepageData(
      {
        collections: collections.nodes,
        products: products.nodes,
        featuredDropProduct,
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
      <HomepageView data={data.homepage} />
    </>
  );
}

const HOMEPAGE_QUERY = `#graphql
  query Homepage(
    $country: CountryCode
    $dropHandle: String!
    $language: LanguageCode
  )
    @inContext(country: $country, language: $language) {
    collections(first: 20, sortKey: UPDATED_AT, reverse: true) {
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
    featuredDropProduct: product(handle: $dropHandle) {
      ...ProductCard
      description
      descriptionHtml
      productType
      availableForSale
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
