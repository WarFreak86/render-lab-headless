/**
 * Keep unavailable but published garments visible with a truthful sold-out
 * state. Drafts and unpublished products never arrive via Storefront API.
 */
export function purchasableApparel<T extends {availableForSale: boolean}>(
  products: ReadonlyArray<T>,
): T[] {
  return products.filter((product) => product.availableForSale);
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
