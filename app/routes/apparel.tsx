import {Analytics, Image, Money} from '@shopify/hydrogen';
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/apparel';
import {getProductionUrl} from '~/lib/config';
import apparelStyles from '~/styles/apparel.css?url';

const HOODIE_COLLECTION_HANDLE = 'hoodies';
const APPAREL_TITLE = 'Graphic Hoodies & Wearable Art | Render-Lab';
const APPAREL_DESCRIPTION =
  'Discover Render-Lab graphic hoodies featuring bold, original artwork. Explore each design, compare garment options, and find your fit.';

export const links = () => [{rel: 'stylesheet', href: apparelStyles}];

export const meta: Route.MetaFunction = ({data}) => {
  const canonical = getProductionUrl('/apparel');
  const image = data?.heroImage;
  return [
    {title: APPAREL_TITLE},
    {name: 'description', content: APPAREL_DESCRIPTION},
    {tagName: 'link', rel: 'canonical', href: canonical},
    // Keep an empty or unpublished assortment out of search results.
    ...(!data?.hasPurchasableProducts
      ? [{name: 'robots', content: 'noindex,follow'}]
      : []),
    {property: 'og:title', content: APPAREL_TITLE},
    {property: 'og:description', content: APPAREL_DESCRIPTION},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
    ...(image?.url
      ? [
          {property: 'og:image', content: image.url},
          {property: 'og:image:alt', content: image.altText || 'Render-Lab graphic hoodie'},
        ]
      : []),
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const {collection} = await context.storefront.query(APPAREL_COLLECTION_QUERY, {
    variables: {handle: HOODIE_COLLECTION_HANDLE},
  });

  // Storefront API excludes draft or unpublished merchandise. Never construct
  // public product links from Admin-only draft IDs or placeholder mockups.
  const products = (collection?.products.nodes ?? []).filter(
    (product) => product.availableForSale,
  );
  const heroImage = products[0]?.featuredImage ?? collection?.image ?? null;

  return {
    collectionId: collection?.id ?? null,
    heroImage,
    hasPurchasableProducts: products.length > 0,
    products,
  };
}

export default function ApparelPage() {
  const {collectionId, heroImage, hasPurchasableProducts, products} =
    useLoaderData<typeof loader>();

  return (
    <div className="apparel-page">
      <section className="apparel-hero" aria-labelledby="apparel-heading">
        <div className="apparel-hero__copy">
          <p className="apparel-kicker">Render-Lab / Wearable art</p>
          <h1 id="apparel-heading">Art that goes <em>everywhere.</em></h1>
          <p className="apparel-hero__description">
            Not just another graphic hoodie. Bold visual work made to be worn,
            seen, and remembered.
          </p>
          {hasPurchasableProducts ? (
            <a className="apparel-hero__cta" href="#shop-hoodies">
              Explore the hoodies <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <p className="apparel-hero__status" role="status">
              Our first apparel release is being prepared.
            </p>
          )}
          <p className="apparel-hero__footnote">
            Designed by Render-Lab. Details and sizing on each garment page.
          </p>
        </div>
        {heroImage ? (
          <div className="apparel-hero__visual">
            <Image
              alt={heroImage.altText || 'Render-Lab graphic hoodie'}
              data={heroImage}
              loading="eager"
              sizes="(min-width: 70rem) 50vw, 100vw"
            />
            <span className="apparel-hero__image-caption">
              The art, on the garment.
            </span>
          </div>
        ) : (
          <div className="apparel-hero__visual apparel-hero__visual--empty">
            <span aria-hidden="true">RENDER-LAB</span>
          </div>
        )}
      </section>

      <div className="apparel-marquee" aria-label="Collection values">
        <span>Artwork first</span>
        <span aria-hidden="true">✳</span>
        <span>Wearable expression</span>
        <span aria-hidden="true">✳</span>
        <span>Made for the details</span>
      </div>

      <section className="apparel-shop container container--wide" id="shop-hoodies">
        <div className="apparel-section-heading">
          <div>
            <p className="apparel-kicker">01 / The collection</p>
            <h2>Graphic hoodies</h2>
          </div>
          {hasPurchasableProducts ? (
            <p className="apparel-section-heading__note">
              {products.length} {products.length === 1 ? 'design' : 'designs'} to explore
            </p>
          ) : null}
        </div>

        {hasPurchasableProducts ? (
          <div className="apparel-grid">
            {products.map((product, index) => (
              <article className="apparel-card" key={product.id}>
                <Link prefetch="intent" to={'/products/' + product.handle}>
                  <div className="apparel-card__media">
                    {product.featuredImage ? (
                      <Image
                        alt={product.featuredImage.altText || product.title}
                        data={product.featuredImage}
                        loading={index < 2 ? 'eager' : 'lazy'}
                        sizes="(min-width: 70rem) 30vw, (min-width: 40rem) 46vw, 100vw"
                      />
                    ) : (
                      <span className="apparel-card__no-image">
                        Image not available
                      </span>
                    )}
                    <span className="apparel-card__explore" aria-hidden="true">
                      Explore design ↗
                    </span>
                  </div>
                  <div className="apparel-card__details">
                    <div>
                      <p className="apparel-card__eyebrow">Render-Lab / Hoodie</p>
                      <h3>{product.title}</h3>
                    </div>
                    <p className="apparel-card__price">
                      From <Money data={product.priceRange.minVariantPrice} />
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="apparel-empty">
            <h3>First release in preparation.</h3>
            <p>
              The hoodies are being finalized. Product pages will appear here
              when their sizing, pricing, and checkout are ready.
            </p>
            <Link to="/collections/wall-art">Explore wall art while you are here ↗</Link>
          </div>
        )}
      </section>

      <section className="apparel-standards" aria-labelledby="apparel-standards-heading">
        <div className="container container--wide apparel-standards__inner">
          <div className="apparel-standards__heading">
            <p className="apparel-kicker">02 / Before you buy</p>
            <h2 id="apparel-standards-heading">
              Look closer.<br /><em>Choose confidently.</em>
            </h2>
          </div>
          <div className="apparel-standards__items">
            <div>
              <span>01</span>
              <h3>See the artwork</h3>
              <p>Explore the actual garment mockups on each design’s product page.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Check the fit</h3>
              <p>Review available sizes and fit information before selecting a variant.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Know the details</h3>
              <p>Check current materials, care guidance, shipping, and total price before checkout.</p>
            </div>
          </div>
        </div>
      </section>

      {collectionId && hasPurchasableProducts ? (
        <Analytics.CollectionView
          data={{
            collection: {id: collectionId, handle: HOODIE_COLLECTION_HANDLE},
          }}
        />
      ) : null}
    </div>
  );
}

const APPAREL_COLLECTION_QUERY = `#graphql
  query ApparelCollection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      image {
        id
        url
        altText
        width
        height
      }
      products(first: 24) {
        nodes {
          id
          handle
          title
          availableForSale
          featuredImage {
            id
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
` as const;
