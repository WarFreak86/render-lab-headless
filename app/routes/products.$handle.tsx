import '~/styles/product-editorial.css';
import '~/styles/product-gallery-fit.css';
import productStyles from '~/styles/product.css?url';
import productEnhancements from '~/styles/enhancements-product.css?url';
import productGalleryStyles from '~/styles/gallery-product.css?url';
import confidenceStyles from '~/styles/product-confidence.css?url';
import {Link, useLoaderData, useLocation, useNavigate} from 'react-router';
import {useEffect, useState} from 'react';
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
import {ProductConfidenceSections} from '~/components/product/ProductConfidenceSections';
import {
  artworkImage,
  choiceQuery,
  hasPrintChoices,
  type ChoiceVariant,
} from '~/lib/product-confidence';
import {getProductionUrl} from '~/lib/config';
import {getVariantGidFromRequest, normalizeProductPage} from '~/lib/product';
import {PRODUCT_QUERY, PRODUCT_VARIANT_BY_ID_QUERY} from '~/lib/product-query';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  getBrandedTitle,
  getMetaDescription,
  getProductGroupStructuredData,
  safeJsonLd,
} from '~/lib/seo';

export const links = () => [
  {rel: 'stylesheet', href: productStyles},
  {rel: 'stylesheet', href: productEnhancements},
  {rel: 'stylesheet', href: productGalleryStyles},
  {rel: 'stylesheet', href: confidenceStyles},
];

export const meta: Route.MetaFunction = ({data}) => {
  const product = data?.product;
  const description = getMetaDescription(
    product?.seoDescriptionOverride?.value,
    product?.seo?.description,
    product?.description,
  );
  const image = product?.media?.nodes?.[0]?.image;
  const canonical = getProductionUrl(`/products/${product?.handle ?? ''}`);
  const variant = product?.selectedOrFirstAvailableVariant;
  const title = getBrandedTitle(
    product?.seoTitleOverride?.value.trim() ||
      product?.seo?.title?.trim() ||
      product?.title,
  );
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
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const selectedOptions = getSelectedProductOptions(request).filter(
    ({name}) => name !== 'variant',
  );
  const requestedVariantId = getVariantGidFromRequest(request);
  const [{product}, requestedVariantData] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      cache: storefront.CacheShort(),
      variables: {handle, selectedOptions},
    }),
    requestedVariantId
      ? storefront.query(PRODUCT_VARIANT_BY_ID_QUERY, {
          cache: storefront.CacheShort(),
          variables: {id: requestedVariantId},
        })
      : Promise.resolve(undefined),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  if (product.variants.pageInfo.hasNextPage) {
    throw new Error(
      `Product ${product.id} has more than 250 variants; refusing to emit a truncated ProductGroup`,
    );
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const requestedVariant = requestedVariantData?.variant;
  const matchingVariant =
    requestedVariant?.__typename === 'ProductVariant' &&
    requestedVariant.product.id === product.id
      ? requestedVariant
      : null;
  const selectedProduct = matchingVariant
    ? {...product, selectedOrFirstAvailableVariant: matchingVariant}
    : product;
  const hasMatchingOption = selectedOptions.some(({name, value}) =>
    selectedProduct.selectedOrFirstAvailableVariant?.selectedOptions?.some(
      (option) =>
        option.name.toLowerCase() === name.toLowerCase() &&
        option.value.toLowerCase() === value.toLowerCase(),
    ),
  );

  return {
    product: selectedProduct,
    initialVariantImageId:
      matchingVariant || hasMatchingOption
        ? selectedProduct.selectedOrFirstAvailableVariant?.image?.id
        : undefined,
    initialVariantImageUrl:
      matchingVariant || hasMatchingOption
        ? selectedProduct.selectedOrFirstAvailableVariant?.image?.url
        : undefined,
  };
}

function loadDeferredData({context, params}: Route.LoaderArgs) {
  return {};
}

export default function Product() {
  const navigate = useNavigate();
  const location = useLocation();
  const {product, initialVariantImageId, initialVariantImageUrl} =
    useLoaderData<typeof loader>();
  const [requestedChoice, setRequestedChoice] = useState<{
    id: string;
    handle: string;
  } | null>(null);

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);
  useEffect(() => {
    if (requestedChoice?.id === selectedVariant.id) setRequestedChoice(null);
  }, [requestedChoice, selectedVariant.id]);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const page = normalizeProductPage(product);
  const confidence = hasPrintChoices(product.variants.nodes);
  const artwork = confidence ? artworkImage(page.gallery) : undefined;
  function selectVariant(variant: ChoiceVariant) {
    setRequestedChoice({id: variant.id, handle: product.handle});
    void navigate(
      {
        search: `?${choiceQuery(location.search, variant.selectedOptions)}`,
        hash: location.hash,
      },
      {replace: true, preventScrollReset: true},
    );
  }
  const selectedImageId = selectedVariant?.image?.id;
  const canonical = getProductionUrl(`/products/${product.handle}`);
  const jsonLdString = safeJsonLd(
    getProductGroupStructuredData({
      canonical,
      productId: product.id,
      title: product.title,
      description: product.description,
      images: page.gallery.map((image) => image.url),
      vendor: product.vendor,
      variants: product.variants.nodes,
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
    <article
      className={`product-detail product-detail--editorial${confidence ? ' product-detail--confidence' : ''}`}
    >
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
          artwork={artwork}
          buyerConfidence={confidence}
          images={page.gallery}
          initialVariantImageId={
            initialVariantImageId ?? (confidence ? selectedImageId : undefined)
          }
          initialVariantImageUrl={
            initialVariantImageUrl ??
            (confidence ? selectedVariant?.image?.url : undefined)
          }
          selectedVariantImageId={selectedImageId}
          selectedVariantImageUrl={selectedVariant?.image?.url}
          title={product.title}
        />
        <div className="product-detail__purchase-column">
          <ProductPurchasePanel
            buyerConfidence={confidence}
            scaleAvailable={Boolean(artwork)}
            selectionUpdating={
              requestedChoice?.handle === product.handle &&
              requestedChoice.id !== selectedVariant.id
            }
            variants={product.variants.nodes}
            badge={page.editorial.badge}
            collectionTitle={page.breadcrumb?.title}
            product={product}
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />
        </div>
      </div>

      <ProductDetails
        descriptionHtml={product.descriptionHtml}
        editorial={page.editorial}
        variants={product.variants.nodes}
      />

      {confidence ? (
        <ProductConfidenceSections
          artwork={artwork}
          images={[...page.gallery, ...page.editorial.roomImages]}
          onSelect={selectVariant}
          selectedVariant={selectedVariant}
          variants={product.variants.nodes}
        />
      ) : null}

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
