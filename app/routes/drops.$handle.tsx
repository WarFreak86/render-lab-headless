import {
  Analytics,
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  getSelectedProductOptions,
  useOptimisticVariant,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {useLoaderData} from 'react-router';
import type {Route} from './+types/drops.$handle';
import {DropCountdown} from '~/components/drop/DropCountdown';
import {
  DropCollectorBenefits,
  DropEdition,
  DropSizeGuide,
  DropStory,
} from '~/components/drop/DropEditorial';
import {ProductDetails} from '~/components/product/ProductDetails';
import {ProductGallery} from '~/components/product/ProductGallery';
import {ProductPurchasePanel} from '~/components/product/ProductPurchasePanel';
import {getProductionUrl} from '~/lib/config';
import {
  canPurchaseDrop,
  getDropConfig,
  getDropCountdownTarget,
  getDropStatusLabel,
  resolveDropLifecycle,
} from '~/lib/drops';
import {normalizeProductPage} from '~/lib/product';
import {DROP_PRODUCT_QUERY} from '~/lib/product-query';
import {getCommerceStructuredData, safeJsonLd} from '~/lib/seo';

function descriptionText(descriptionHtml?: string | null) {
  return descriptionHtml
    ?.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortDescription(description?: string | null) {
  const value = description?.trim();
  if (!value) return undefined;
  return value.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || value.slice(0, 220);
}

function hasEditorialDetails(
  editorial: ReturnType<typeof normalizeProductPage>['editorial'],
) {
  return Boolean(
    editorial.artworkStory ||
      editorial.artistNote ||
      editorial.careInstructions ||
      editorial.collectorInformation ||
      editorial.editionSize ||
      editorial.fabricDetails ||
      editorial.fitNotes ||
      editorial.materialDescription ||
      editorial.highlights.length ||
      editorial.roomImages.length,
  );
}

export const meta: Route.MetaFunction = ({data}) => {
  const product = data?.product;
  const drop = data?.drop;
  const description =
    drop?.statement ||
    product?.seo?.description ||
    shortDescription(descriptionText(product?.descriptionHtml));
  const canonical = getProductionUrl(`/drops/${drop?.handle ?? ''}`);
  const image = product?.media?.nodes?.[0]?.image;
  const title = `${product?.seo?.title || product?.title || 'Drop'} | Render-Lab`;

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
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const drop = getDropConfig(params.handle);
  if (!drop) throw new Response(null, {status: 404});

  const {product} = await context.storefront.query(DROP_PRODUCT_QUERY, {
    variables: {
      handle: drop.productHandle,
      selectedOptions: getSelectedProductOptions(request),
    },
  });

  if (!product?.id) throw new Response(null, {status: 404});

  const serverNow = Date.now();
  const lifecycle = resolveDropLifecycle({
    now: serverNow,
    releaseDate: drop.releaseDate,
    endDate: drop.endDate,
    available: product.availableForSale,
  });

  return {drop, lifecycle, product, serverNow};
}

export default function DropPage() {
  const {drop, lifecycle, product, serverNow} = useLoaderData<typeof loader>();
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });
  const page = normalizeProductPage(product);
  const countdownTarget = getDropCountdownTarget(
    lifecycle,
    drop.releaseDate,
    drop.endDate,
  );
  const purchaseAllowed = canPurchaseDrop(lifecycle, drop);
  const storyImage = page.gallery[drop.story?.mediaIndex ?? 1];
  const disabledLabel =
    lifecycle === 'PRE_LAUNCH'
      ? 'Not yet available'
      : lifecycle === 'ENDED'
        ? 'Release ended'
        : 'Sold out';
  const canonical = getProductionUrl(`/drops/${drop.handle}`);
  const jsonLdString = safeJsonLd(
    getCommerceStructuredData({
      canonical,
      title: product.title,
      description:
        drop.statement || shortDescription(descriptionText(product.descriptionHtml)),
      images: page.gallery.map((image) => image.url),
      vendor: product.vendor,
      variant: selectedVariant
        ? {
            availableForSale: selectedVariant.availableForSale,
            price: selectedVariant.price,
            sku: selectedVariant.sku,
          }
        : null,
    }),
  );

  return (
    <article className="drop-page" data-lifecycle={lifecycle}>
      <script
        dangerouslySetInnerHTML={{__html: jsonLdString}}
        type="application/ld+json"
      />
      <header className="drop-hero">
        <div className="drop-hero__intro">
          {drop.eyebrow ? <p className="drop-hero__eyebrow">{drop.eyebrow}</p> : null}
          <h1>{product.title}</h1>
          <p className="drop-hero__status">
            <span aria-hidden />
            {getDropStatusLabel(lifecycle)}
          </p>
          {drop.statement || product.descriptionHtml ? (
            <p className="drop-hero__statement">
              {drop.statement ||
                shortDescription(descriptionText(product.descriptionHtml))}
            </p>
          ) : null}
          {countdownTarget !== undefined ? (
            <DropCountdown
              initialNow={serverNow}
              label={
                lifecycle === 'PRE_LAUNCH'
                  ? 'Release begins in'
                  : 'Release ends in'
              }
              target={countdownTarget}
            />
          ) : null}
        </div>

        <div className="drop-hero__media">
          <ProductGallery
            images={page.gallery}
            presentation="drop"
            selectedVariantImageId={selectedVariant?.image?.id}
            title={product.title}
          />
        </div>

        <div className="drop-hero__purchase">
          <ProductPurchasePanel
            auxiliaryAction={<DropSizeGuide guide={drop.sizeGuide} />}
            disabledLabel={disabledLabel}
            presentation="drop"
            product={product}
            productOptions={productOptions}
            purchaseAllowed={purchaseAllowed}
            selectedVariant={selectedVariant}
            showIdentity={false}
            statusLabel={getDropStatusLabel(lifecycle)}
          />
          {lifecycle === 'PRE_LAUNCH' && !drop.allowPurchaseBeforeRelease ? (
            <p className="drop-hero__boundary-note">
              Release notifications are not connected for this storefront.
            </p>
          ) : null}
          {lifecycle === 'ENDED' && drop.allowPurchaseAfterEnd ? (
            <p className="drop-hero__boundary-note">
              The campaign has ended; this product remains available through Shopify.
            </p>
          ) : null}
        </div>
      </header>

      <div className="drop-page__editorial">
        <DropCollectorBenefits benefits={drop.collectorBenefits} />
        <DropStory
          body={
            drop.story?.body ||
            (drop.story?.useProductDescription
              ? descriptionText(product.descriptionHtml)
              : undefined)
          }
          heading={drop.story?.heading}
          image={storyImage}
        />
        <DropEdition edition={drop.edition} />
        {hasEditorialDetails(page.editorial) ? (
          <ProductDetails descriptionHtml="" editorial={page.editorial} />
        ) : null}
      </div>

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
