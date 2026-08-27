import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CollectionProductCardData} from '~/lib/collection';

export function CollectionProductCard({
  product,
  loading = 'lazy',
}: {
  product: CollectionProductCardData;
  loading?: 'eager' | 'lazy';
}) {
  const hasRange = product.minPrice.amount !== product.maxPrice.amount;
  const isApparel = /hoodie|apparel|shirt|garment/i.test(product.productType);

  return (
    <article className="collection-product-card">
      <Link prefetch="intent" to={product.to}>
        <div
          className={`collection-product-card__media ${
            isApparel ? 'collection-product-card__media--contain' : ''
          }`.trim()}
        >
          {product.image ? (
            <Image
              alt={product.image.altText}
              aspectRatio="4/3"
              data={product.image}
              loading={loading}
              sizes="(min-width: 90rem) 22vw, (min-width: 64rem) 28vw, (min-width: 40rem) 45vw, 46vw"
            />
          ) : (
            <span className="collection-product-card__placeholder">
              Artwork unavailable
            </span>
          )}
        </div>
        <div className="collection-product-card__details">
          {product.productType ? <p>{product.productType}</p> : null}
          <h2>{product.title}</h2>
          <div className="collection-product-card__price">
            {hasRange ? <span>From </span> : null}
            <Money data={product.minPrice} />
          </div>
          {!product.availableForSale ? (
            <span className="collection-product-card__availability">
              Currently unavailable
            </span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
