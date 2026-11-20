import {Image} from '@shopify/hydrogen';
import {Link, useLoaderData} from 'react-router';
import type {ApparelCategoryDirectoryQuery} from 'storefrontapi.generated';
import type {Route} from './+types/apparel';
import {APPAREL_CATEGORIES} from '~/lib/apparel-categories';
import {getProductionUrl, getStorefrontEnvironment} from '~/lib/config';
import apparelStyles from '~/styles/apparel.css?url';

const TITLE = 'Shop Apparel by Category | Render-Lab';
const DESCRIPTION =
  'Shop artist-designed clothing at Render-Lab. Explore graphic hoodies and other garment categories as they become available.';

export const links = () => [{rel: 'stylesheet', href: apparelStyles}];

export const meta: Route.MetaFunction = ({data}) => {
  const canonical = getProductionUrl('/apparel');
  const image = data?.heroImage;
  return [
    {title: TITLE},
    {name: 'description', content: DESCRIPTION},
    {tagName: 'link', rel: 'canonical', href: canonical},
    ...(!data?.categories?.length ? [{name: 'robots', content: 'noindex,follow'}] : []),
    {property: 'og:title', content: TITLE},
    {property: 'og:description', content: DESCRIPTION},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
    ...(image?.url ? [
      {property: 'og:image', content: image.url},
      {property: 'og:image:alt', content: image.altText || 'Render-Lab artist-designed clothing'},
    ] : []),
  ];
};

type ShopifyCategoryCollection = NonNullable<ApparelCategoryDirectoryQuery['hoodies']>;

export async function loader({context, request}: Route.LoaderArgs) {
  const result = await context.storefront.query(APPAREL_CATEGORY_DIRECTORY_QUERY, {
    cache: context.storefront.CacheShort(),
  });

  const found: ReadonlyArray<{
    category: (typeof APPAREL_CATEGORIES)[number];
    collection: ShopifyCategoryCollection | null;
  }> = [
    {category: APPAREL_CATEGORIES[0], collection: result.hoodies ?? null},
    {category: APPAREL_CATEGORIES[1], collection: result.tShirts ?? null},
    {category: APPAREL_CATEGORIES[2], collection: result.sweatshirts ?? null},
    {category: APPAREL_CATEGORIES[3], collection: result.jackets ?? null},
  ];
  // Never advertise empty, draft or unlisted Shopify collections to customers.
  const categories = found.flatMap(({category, collection}) => {
    if (!collection?.products.nodes.length) return [];
    const products = collection.products.nodes;
    const featured = products.find((p) => p.availableForSale && p.featuredImage)
      ?? products.find((p) => p.featuredImage) ?? null;
    return [{
      ...category,
      collectionId: collection.id,
      image: featured?.featuredImage ?? null,
      hasPurchasableProducts: products.some((p) => p.availableForSale),
    }];
  });

  if (!categories.length && getStorefrontEnvironment(request.url) === 'production') {
    throw new Response('Apparel is not yet available', {status: 404});
  }

  const heroImage = categories.find((c) => c.hasPurchasableProducts && c.image)?.image
    ?? categories.find((c) => c.image)?.image ?? null;
  return {categories, heroImage};
}

export default function ApparelDepartment() {
  const {categories, heroImage} = useLoaderData<typeof loader>();

  return (
    <div className="apparel-page apparel-department">
      <section className="apparel-hero" aria-labelledby="apparel-heading">
        <div className="apparel-hero__copy">
          <p className="apparel-kicker">Render-Lab / Clothing</p>
          <h1 id="apparel-heading">Art you <em>wear.</em></h1>
          <p className="apparel-hero__description">
            A home for wearable artwork, organized by garment. Explore each
            category for its own designs, sizes and material details.
          </p>
          {categories.length ? (
            <a className="apparel-hero__cta" href="#apparel-categories">
              Shop by category <span aria-hidden="true">↓</span>
            </a>
          ) : (
            <p className="apparel-hero__status" role="status">
              Apparel is being prepared for release.
            </p>
          )}
        </div>
        {heroImage ? (
          <div className="apparel-hero__visual">
            <Image
              alt={heroImage.altText || 'Render-Lab graphic apparel'}
              data={heroImage}
              loading="eager"
              sizes="(min-width: 47rem) 50vw, 100vw"
            />
          </div>
        ) : (
          <div className="apparel-hero__visual apparel-hero__visual--empty" aria-hidden="true">
            <span>RENDER-LAB</span>
          </div>
        )}
      </section>

      <section
        className="apparel-shop apparel-category-section container container--standard"
        id="apparel-categories"
        aria-labelledby="apparel-categories-title"
      >
        <div className="apparel-section-heading">
          <div>
            <p className="apparel-kicker">01 / Clothing categories</p>
            <h2 id="apparel-categories-title">Shop by category</h2>
          </div>
        </div>
        <p className="apparel-category-intro">
          Find the garment you want first, then explore the artwork. Only
          categories with published products are shown.
        </p>
        {categories.length ? (
          <div className={'apparel-category-grid' + (categories.length === 1 ? ' apparel-category-grid--single' : '')}>
            {categories.map((category, index) => (
              <article className="apparel-category-card" key={category.slug}>
                <Link to={'/apparel/' + category.slug} prefetch="intent">
                  <div className="apparel-category-card__media">
                    {category.image ? (
                      <Image
                        alt={category.image.altText || 'Explore ' + category.title}
                        data={category.image}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        sizes="(min-width: 70rem) 42vw, (min-width: 47rem) 50vw, 100vw"
                      />
                    ) : (
                      <span>Render-Lab / {category.title}</span>
                    )}
                  </div>
                  <div className="apparel-category-card__info">
                    <p className="apparel-kicker">Clothing / {category.title}</p>
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                    <span className="apparel-category-card__action">
                      Explore {category.title.toLowerCase()} <span aria-hidden="true">↗</span>
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="apparel-empty">
            <h3>Apparel categories are being prepared.</h3>
            <p>New categories will appear once their products are ready.</p>
          </div>
        )}
        <p className="apparel-category-footnote">
          More garment categories will be added as new designs become available.
        </p>
      </section>

      <section className="apparel-standards" aria-labelledby="apparel-standards-heading">
        <div className="container container--editorial apparel-standards__inner">
          <div className="apparel-standards__heading">
            <p className="apparel-kicker">02 / Good to know</p>
            <h2 id="apparel-standards-heading">Find your fit.</h2>
          </div>
          <div className="apparel-standards__items">
            <p>
              Sizing, fabric and production times vary by garment. Visit a
              category and open a product to see its specific size guide and details.
            </p>
            <div className="apparel-standards__links">
              <Link to="/policies/shipping-policy">Shipping information ↗</Link>
              <Link to="/policies/refund-policy">Returns policy ↗</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const APPAREL_CATEGORY_DIRECTORY_QUERY = `#graphql
  query ApparelCategoryDirectory($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    hoodies: collection(handle: "hoodies") { ...CategoryPreview }
    tShirts: collection(handle: "t-shirts") { ...CategoryPreview }
    sweatshirts: collection(handle: "sweatshirts") { ...CategoryPreview }
    jackets: collection(handle: "jackets") { ...CategoryPreview }
  }
  fragment CategoryPreview on Collection {
    id
    products(first: 8) {
      nodes {
        id
        availableForSale
        featuredImage { url altText width height }
      }
    }
  }
` as const;
