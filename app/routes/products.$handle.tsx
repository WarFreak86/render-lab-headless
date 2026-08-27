import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductDetails} from '~/components/product/ProductDetails';
import {ProductGallery} from '~/components/product/ProductGallery';
import {ProductPurchasePanel} from '~/components/product/ProductPurchasePanel';
import {getProductionUrl} from '~/lib/config';
import {normalizeProductPage} from '~/lib/product';
import {PRODUCT_QUERY} from '~/lib/product-query';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {getCommerceStructuredData, safeJsonLd} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data}) => {
  const product = data?.product;
  const description = product?.seo?.description || product?.description;
  const image = product?.media?.nodes?.[0]?.image;
  const canonical = getProductionUrl(`/products/${product?.handle ?? ''}`);
  const variant = product?.selectedOrFirstAvailableVariant;
  const title = `${product?.seo?.title || product?.title || 'Product'} | Render-Lab`;
  return [
    {title},
    ...(description ? [{name: 'description', content: description}] : []),
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: title},
    ...(description
      ? [{property: 'og:description', content: description}]
      : []),
    {property: 'og:type', content: 'product'},
    {property: 'og:url', content: canonical},
    ...(image?.url
      ? [
          {property: 'og:image', content: image.url},
          ...(image.altText
            ? [{property: 'og:image:alt', content: image.altText}]
            : []),
        ]
      : []),
    ...(variant
      ? [
          {property: 'product:price:amount', content: variant.price.amount},
          {
            property: 'product:price:currency',
            content: variant.price.currencyCode,
          },
          {
            property: 'product:availability',
            content: variant.availableForSale ? 'in stock' : 'out of stock',
          },
        ]
      : []),
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: Route.LoaderArgs) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const page = normalizeProductPage(product);
  const selectedImageId = selectedVariant?.image?.id;
  const canonical = getProductionUrl(`/products/${product.handle}`);
  const jsonLdString = safeJsonLd(
    getCommerceStructuredData({
      canonical,
      title: product.title,
      description: product.description,
      images: page.gallery.map((image) => image.url),
      vendor: product.vendor,
      variant: selectedVariant
        ? {
            availableForSale: selectedVariant.availableForSale,
            price: selectedVariant.price,
            sku: selectedVariant.sku,
          }
        : null,
      breadcrumb: [
        {name: 'Shop', url: getProductionUrl('/collections')},
        ...(page.breadcrumb
          ? [
              {
                name: page.breadcrumb.title,
                url: getProductionUrl(`/collections/${page.breadcrumb.handle}`),
              },
            ]
          : []),
        {name: product.title, url: canonical},
      ],
    }),
  );

  return (
    <article className="product-detail">
      <script
        dangerouslySetInnerHTML={{__html: jsonLdString}}
        type="application/ld+json"
      />
      <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to="/collections">Shop</Link>
        <span aria-hidden>/</span>
        {page.breadcrumb ? (
          <>
            <Link to={`/collections/${page.breadcrumb.handle}`}>
              {page.breadcrumb.title}
            </Link>
            <span aria-hidden>/</span>
          </>
        ) : null}
        <span aria-current="page">{product.title}</span>
      </nav>

      <div className="product-detail__hero">
        <ProductGallery
          images={page.gallery}
          selectedVariantImageId={selectedImageId}
          title={product.title}
        />
        <div className="product-detail__purchase-column">
          <ProductPurchasePanel
            badge={page.editorial.badge}
            product={product}
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />
        </div>
      </div>

      <ProductDetails
        descriptionHtml={product.descriptionHtml}
        editorial={page.editorial}
      />
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </article>
  );
}
