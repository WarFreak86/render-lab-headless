import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  const showCompareAtPrice = Boolean(
    price && compareAtPrice?.amount &&
      Number(compareAtPrice.amount) > 0 &&
      Number(compareAtPrice.amount) > Number(price.amount),
  );
  return (
    <div
      aria-label="Price"
      aria-live="polite"
      className="product-price"
      role="group"
    >
      {showCompareAtPrice && compareAtPrice ? (
        <div className="product-price-on-sale">
          {price ? <Money data={price} /> : null}
          <s>
            <Money data={compareAtPrice} />
          </s>
        </div>
      ) : price ? (
        <Money data={price} />
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
