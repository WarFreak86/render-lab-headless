import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CollectionProductCardData} from '~/lib/collection';

export interface CollectionProductCardContext {
  artistName?: string;
  collectionTitle?: string;
}

const GENERIC_COLLECTION_TITLES = new Set([
  'All Art',
  'Wall Art',
  'Metal Wall Art',
  'Canvas Prints',
  'Posters',
  'Bundles',
]);

function splitArtworkTitle(title: string) {
  const parts = title.split(/\s+[—–]\s+/).map((part) => part.trim()).filter(Boolean);
  return {
    artworkTitle: parts[0] ?? title,
    seriesTitle: parts.length > 1 ? parts.slice(1).join(' — ') : undefined,
  };
}

function cardAttribution(
  context: CollectionProductCardContext | undefined,
  seriesTitle: string | undefined,
) {
  const contextualCollection = context?.collectionTitle?.trim();
  const collectionTitle =
    seriesTitle ??
    (contextualCollection && !GENERIC_COLLECTION_TITLES.has(contextualCollection)
      ? contextualCollection
      : undefined);
  return Array.from(
    new Set(
      [context?.artistName?.trim(), collectionTitle]
        .filter((value): value is string => Boolean(value)),
    ),
  ).join(' · ');
}

export function CollectionProductCard({
  product,
  context,
  loading = 'lazy',
}: {
  product: CollectionProductCardData;
  context?: CollectionProductCardContext;
  loading?: 'eager' | 'lazy';
}) {
  const isApparel = /hoodie|apparel|shirt|garment/i.test(product.productType);
  const isLandscape = Boolean(
    product.image?.width &&
      product.image?.height &&
      product.image.width / product.image.height > 1.12,
  );
  const useContain = isApparel || isLandscape;
  const {artworkTitle, seriesTitle} = splitArtworkTitle(product.title);
  const attribution = cardAttribution(context, seriesTitle);
  const mediaClassName = [
    'collection-product-card__media',
    isApparel ? 'collection-product-card__media--apparel' : '',
    useContain ? 'collection-product-card__media--contain' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className="collection-product-card">
      <Link prefetch="intent" to={product.to}>
        <div className={mediaClassName}>
          {product.image ? (
            <Image
              alt={product.image.altText}
              aspectRatio={isApparel ? '4/3' : '3/4'}
              data={product.image}
              loading={loading}
              sizes="(min-width: 90rem) 26vw, (min-width: 64rem) 30vw, (min-width: 48rem) 46vw, 92vw"
            />
          ) : (
            <span className="collection-product-card__placeholder">
              Artwork unavailable
            </span>
          )}
          {!product.availableForSale ? (
            <span className="collection-product-card__availability">
              Unavailable
            </span>
          ) : null}
        </div>
        <div className="collection-product-card__details">
          {attribution ? (
            <p className="collection-product-card__attribution">{attribution}</p>
          ) : null}
          <h2>{artworkTitle}</h2>
          <div className="collection-product-card__price">
            <span>From </span>
            <Money data={product.minPrice} />
          </div>
        </div>
      </Link>
    </article>
  );
}
