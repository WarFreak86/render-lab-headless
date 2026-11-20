/**
 * The Storefront API excludes draft and unpublished products, but a published
 * sold-out garment must still be shown honestly rather than disappearing.
 */
export function apparelListingState<T extends {availableForSale: boolean}>(
  products: ReadonlyArray<T>,
) {
  return {
    hasPublishedProducts: products.length > 0,
    hasPurchasableProducts: products.some((product) => product.availableForSale),
  };
}

export function isGarmentProductType(productType: string | null | undefined) {
  return /\b(hoodies?|sweatshirts?|t-?shirts?|apparel|garments?|tees?|fleece)\b/i.test(
    productType ?? '',
  );
}

type Money = {amount: string; currencyCode: string};
export type ApparelPrice = {
  amount: Money | null;
  label: 'From' | 'Available size' | '';
};

/**
 * Prefer a real available variant over an unpurchasable minimum. A fixed
 * catalog price needs no prefix; a range only says "From" if that minimum is
 * actually the first available variant's price.
 */
export function apparelCardPrice({
  min,
  max,
  firstAvailable,
  availableForSale,
}: {
  min: Money;
  max: Money;
  firstAvailable: Money | null;
  availableForSale: boolean;
}): ApparelPrice {
  const fixed = min.amount === max.amount && min.currencyCode === max.currencyCode;
  if (!availableForSale) return {amount: min, label: fixed ? '' : 'From'};
  if (fixed) return {amount: min, label: ''};
  if (!firstAvailable) return {amount: null, label: ''};
  return firstAvailable.amount === min.amount &&
    firstAvailable.currencyCode === min.currencyCode
    ? {amount: min, label: 'From'}
    : {amount: firstAvailable, label: 'Available size'};
}
