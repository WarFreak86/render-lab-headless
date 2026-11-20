import {Analytics, Image, Money, Pagination, getPaginationVariables} from '@shopify/hydrogen';
import {Link, useLoaderData} from 'react-router';
import type {ApparelCollectionQuery} from 'storefrontapi.generated';
import type {Route} from './+types/apparel';
import {getProductionUrl, getStorefrontEnvironment} from '~/lib/config';
import {apparelCardPrice, apparelListingState} from '~/lib/apparel';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import apparelStyles from '~/styles/apparel.css?url';

const COLLECTION_HANDLE = 'hoodies';
const APPAREL_TITLE = 'Graphic Hoodies & Artist-Designed Apparel | Render-Lab';
const APPAREL_DESCRIPTION =
  'Explore Render-Lab artwork on clothing. Browse available graphic hoodies, compare prices, and find sizing details for each design.';

type ApparelProduct = NonNullable<ApparelCollectionQuery['collection']>['products']['nodes'][number];

export const links = () => [{rel: 'stylesheet', href: apparelStyles}];

export const meta: Route.MetaFunction = ({data, location}) => {
  const search = new URLSearchParams(location.search);
  const cursor = search.get('cursor');
  const direction = search.get('direction');
  const pagination = cursor
    ? '?' + new URLSearchParams({
        cursor,
        ...(direction ? {direction} : {}),
      }).toString()
    : '';
  const canonical = getProductionUrl('/apparel' + pagination);
  const heroImage = data?.heroImage;

  return [
    {title: APPAREL_TITLE},
    {name: 'description', content: APPAREL_DESCRIPTION},
    {tagName: 'link', rel: 'canonical', href: canonical},
    ...(!data?.hasPurchasableProducts ? [{name: 'robots', content: 'noindex,follow'}] : []),
    {property: 'og:title', content: APPAREL_TITLE},
    {property: 'og:description', content: APPAREL_DESCRIPTION},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
    ...(heroImage?.url
      ? [
          {property: 'og:image', content: heroImage.url},
          {property: 'og:image:alt', content: heroImage.altText || 'Render-Lab graphic hoodie front view'},
        ]
      : []),
  ];
};

export async function loader({context, request}: Route.LoaderArgs) {
  const pagination = getPaginationVariables(request, {pageBy: 12});
  const {collection} = await context.storefront.query(APPAREL_COLLECTION_QUERY, {
    cache: context.storefront.CacheShort(),
    variables: {handle: COLLECTION_HANDLE, ...pagination},
  });
  const products = collection?.products.nodes ?? [];
  const {hasPublishedProducts, hasPurchasableProducts} = apparelListingState(products);

  // No public "coming soon" shop when Shopify provides no published garments.
  // Preview may still render a safe empty state for development and review.
  if (!hasPublishedProducts && getStorefrontEnvironment(request.url) === 'production') {
    throw new Response('Apparel is not yet available', {status: 404});
  }

  // Choose a real garment photograph. A collection banner is not a valid
  // substitute for the front of a purchasable product.
  const leadProduct =
    products.find((product) => product.availableForSale && product.featuredImage) ??
    products.find((product) => product.featuredImage) ??
    null;

  return {
    collectionId: collection?.id ?? null,
    heroImage: leadProduct?.featuredImage ?? null,
    leadProductHandle: leadProduct?.availableForSale ? leadProduct.handle : null,
    hasPurchasableProducts,
    products: {nodes: products, pageInfo: collection?.products.pageInfo ?? {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    }},
  };
}

export default function ApparelPage() {
  const {collectionId, heroImage, leadProductHandle, hasPurchasableProducts, products} =
    useLoaderData<typeof loader>();
  const singleStyle = products.nodes.length === 1 && hasPurchasableProducts;
  const leadProduct = singleStyle ? products.nodes[0] : null;

  return (
    <div className="apparel-page">
      <section className="apparel-hero" aria-labelledby="apparel-heading">
        <div className="apparel-hero__copy">
          <p className="apparel-kicker">Render-Lab / Apparel</p>
          <h1 id="apparel-heading">Art you <em>wear.</em></h1>
          <p className="apparel-hero__description">
            Original graphic artwork on clothing. See each design on the garment,
            then choose your size on its product page.
          </p>
          {hasPurchasableProducts ? (
            singleStyle && leadProduct ? (
              <Link className="apparel-hero__cta" prefetch="intent" to={'/products/' + leadProduct.handle}>
                View {leadProduct.title} <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <a className="apparel-hero__cta" href="#garments">
                Shop the collection <span aria-hidden="true">↓</span>
              </a>
            )
          ) : (
            <p className="apparel-hero__status" role="status">
              This release is not yet available to purchase.
            </p>
          )}
        </div>
        {heroImage ? (
          <div className="apparel-hero__visual">
            <Image
              alt={heroImage.altText || 'Front view of a Render-Lab graphic hoodie'}
              data={heroImage}
              loading="eager"
              sizes="(min-width: 70rem) 50vw, (min-width: 47rem) 50vw, 100vw"
            />
          </div>
        ) : (
          <div className="apparel-hero__visual apparel-hero__visual--empty" aria-hidden="true">
            <span>RENDER-LAB</span>
          </div>
        )}
      </section>

      <section className="apparel-shop container container--standard" id="garments">
        <div className="apparel-section-heading">
          <div>
            <p className="apparel-kicker">01 / The collection</p>
            <h2>Shop apparel</h2>
          </div>
        </div>

        {products.nodes.length ? (
          <Pagination connection={products}>
            {({nodes, PreviousLink, NextLink, hasPreviousPage, hasNextPage, isLoading}) => (
              <div className="apparel-pagination">
                {hasPreviousPage ? (
                  <PreviousLink className="apparel-pagination__button">
                    {isLoading ? 'Loading…' : 'Previous designs'}
                  </PreviousLink>
                ) : null}
                <div className={'apparel-grid' + (singleStyle ? ' apparel-grid--single' : '')}>
                  {nodes.map((product, index) => (
                    <ApparelCard key={product.id} product={product} loading={index === 0 && !heroImage ? 'eager' : 'lazy'} />
                  ))}
                </div>
                {hasNextPage ? (
                  <NextLink className="apparel-pagination__button">
                    {isLoading ? 'Loading…' : 'Load more designs'}
                  </NextLink>
                ) : null}
              </div>
            )}
          </Pagination>
        ) : (
          <div className="apparel-empty">
            <h3>Apparel is being prepared.</h3>
            <p>Products will appear when they are published and ready for shoppers.</p>
          </div>
        )}
      </section>

      <section className="apparel-standards" aria-labelledby="apparel-standards-heading">
        <div className="container container--editorial apparel-standards__inner">
          <div className="apparel-standards__heading">
            <p className="apparel-kicker">02 / Before you buy</p>
            <h2 id="apparel-standards-heading">Fit and garment details</h2>
          </div>
          <div className="apparel-standards__items">
            <p>
              Sizes vary by garment. Open a design to review its available options,
              measurements where supplied, fabric and care details.
            </p>
            {leadProductHandle ? (
              <Link to={'/products/' + leadProductHandle + '#garment-size'}>
                View garment sizes and fit ↗
              </Link>
            ) : null}
            <div className="apparel-standards__links">
              <Link to="/policies/shipping-policy">Shipping information ↗</Link>
              <Link to="/policies/refund-policy">Returns policy ↗</Link>
            </div>
          </div>
        </div>
      </section>
      {collectionId && products.nodes.length > 0 ? (
        <Analytics.CollectionView data={{collection: {id: collectionId, handle: COLLECTION_HANDLE}}} />
      ) : null}
    </div>
  );
}

function ApparelCard({
  product,
  loading,
}: {
  product: ApparelProduct;
  loading: 'eager' | 'lazy';
}) {
  const price = apparelCardPrice({
    min: product.priceRange.minVariantPrice,
    max: product.priceRange.maxVariantPrice,
    firstAvailable: product.selectedOrFirstAvailableVariant?.availableForSale
      ? product.selectedOrFirstAvailableVariant.price
      : null,
    availableForSale: product.availableForSale,
  });
  return (
    <article className="apparel-card">
      <Link prefetch="intent" to={'/products/' + product.handle}>
        <div className="apparel-card__media">
          {product.featuredImage ? (
            <Image
              alt={product.featuredImage.altText || product.title + ' graphic hoodie front view'}
              data={product.featuredImage}
              loading={loading}
              sizes="(min-width: 70rem) 30vw, (min-width: 47rem) 45vw, (min-width: 27rem) 46vw, 100vw"
            />
          ) : (
            <span className="apparel-card__no-image">Photo not available</span>
          )}
          {!product.availableForSale ? (
            <span className="apparel-card__soldout">Currently unavailable</span>
          ) : null}
        </div>
        <div className="apparel-card__details">
          <div>
            <p className="apparel-card__eyebrow">Graphic hoodie</p>
            <h3>{product.title}</h3>
          </div>
          <p className="apparel-card__price">
            {price.amount ? (
              <>{price.label ? price.label + ' ' : ''}<Money data={price.amount} /></>
            ) : (
              'See pricing and size options'
            )}
          </p>
          <span className="apparel-card__fit">View sizes and fit details ↗</span>
        </div>
      </Link>
    </article>
  );
}

const APPAREL_COLLECTION_QUERY = `#graphql
  query ApparelCollection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
        nodes {
          ...ProductCard
          productType
          availableForSale
          selectedOrFirstAvailableVariant {
            availableForSale
            price {amount currencyCode}
          }
        }
        pageInfo {hasPreviousPage hasNextPage startCursor endCursor}
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
