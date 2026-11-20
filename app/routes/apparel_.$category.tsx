import {Analytics, Image, Money, Pagination, getPaginationVariables} from '@shopify/hydrogen';
import {Link, useLoaderData} from 'react-router';
import type {ApparelCategoryProductsQuery} from 'storefrontapi.generated';
import type {Route} from './+types/apparel_.$category';
import {getApparelCategory, type ApparelCategory} from '~/lib/apparel-categories';
import {getProductionUrl, getStorefrontEnvironment} from '~/lib/config';
import {apparelCardPrice, apparelListingState} from '~/lib/apparel';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import apparelStyles from '~/styles/apparel.css?url';

type ApparelProduct = NonNullable<ApparelCategoryProductsQuery['collection']>['products']['nodes'][number];

export const links = () => [{rel: 'stylesheet', href: apparelStyles}];

export const meta: Route.MetaFunction = ({data, location}) => {
  const category = data?.category;
  const search = new URLSearchParams(location.search);
  const cursor = search.get('cursor');
  const direction = search.get('direction');
  const pagination = cursor
    ? '?' + new URLSearchParams({
        cursor,
        ...(direction ? {direction} : {}),
      }).toString()
    : '';
  const canonical = getProductionUrl('/apparel/' + (category?.slug ?? 'hoodies') + pagination);
  const title = category?.seoTitle ?? 'Shop Clothing | Render-Lab';
  const description = category?.seoDescription ?? 'Explore wearable artwork at Render-Lab.';
  const heroImage = data?.heroImage;

  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    ...(!data?.hasPurchasableProducts ? [{name: 'robots', content: 'noindex,follow'}] : []),
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
    ...(heroImage?.url
      ? [
          {property: 'og:image', content: heroImage.url},
          {property: 'og:image:alt', content: heroImage.altText || category?.productLabel || 'Render-Lab garment'},
        ]
      : []),
  ];
};

export async function loader({context, request, params}: Route.LoaderArgs) {
  const category = getApparelCategory(params.category);
  if (!category) throw new Response('Apparel category not found', {status: 404});
  const pagination = getPaginationVariables(request, {pageBy: 12});
  const {collection} = await context.storefront.query(APPAREL_COLLECTION_QUERY, {
    cache: context.storefront.CacheShort(),
    variables: {handle: category.collectionHandle, ...pagination},
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
    category,
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
  const {category, collectionId, heroImage, leadProductHandle, hasPurchasableProducts, products} =
    useLoaderData<typeof loader>();
  const singleStyle = products.nodes.length === 1 && hasPurchasableProducts;
  const leadProduct = singleStyle ? products.nodes[0] : null;

  return (
    <div className="apparel-page">
      <section className="apparel-hero" aria-labelledby="apparel-heading">
        <div className="apparel-hero__copy">
          <p className="apparel-kicker"><Link to="/apparel">Apparel</Link> / {category.title}</p>
          <h1 id="apparel-heading">{category.heroLead} <em>{category.heroEmphasis}</em></h1>
          <p className="apparel-hero__description">
            {category.description} Choose a design to see garment details,
            available sizes and full artwork views.
          </p>
          {hasPurchasableProducts ? (
            singleStyle && leadProduct ? (
              <Link className="apparel-hero__cta" prefetch="intent" to={'/products/' + leadProduct.handle}>
                View {leadProduct.title} <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <a className="apparel-hero__cta" href="#garments">
                Shop {category.title.toLowerCase()} <span aria-hidden="true">↓</span>
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
              alt={heroImage.altText || 'Front view of a Render-Lab ' + category.productLabel.toLowerCase()}
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
            <p className="apparel-kicker">01 / {category.title}</p>
            <h2>Shop {category.title.toLowerCase()}</h2>
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
                    <ApparelCard key={product.id} category={category} product={product} loading={index === 0 && !heroImage ? 'eager' : 'lazy'} />
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
            <h3>No designs available yet.</h3>
            <p>Explore the other available categories from the <Link to="/apparel">apparel department</Link>.</p>
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
            {category.deliveryNote ? <p>{category.deliveryNote}</p> : null}
            {category.slug === 'hoodies' && leadProductHandle ? (
              <Link to={'/products/' + leadProductHandle + '#garment-size-guide'}>
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
        <Analytics.CollectionView data={{collection: {id: collectionId, handle: category.collectionHandle}}} />
      ) : null}
    </div>
  );
}

function ApparelCard({
  category,
  product,
  loading,
}: {
  category: ApparelCategory;
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
              alt={product.featuredImage.altText || product.title + ' ' + category.productLabel.toLowerCase()}
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
            <p className="apparel-card__eyebrow">{category.productLabel}</p>
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
  query ApparelCategoryProducts(
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
