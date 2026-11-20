/**
 * Products must be visible through the Storefront API and purchasable before
 * this page advertises a link, a price, or an indexable assortment.
 */
export function purchasableApparel<T extends {availableForSale: boolean}>(
  products: ReadonlyArray<T>,
): T[] {
  return products.filter((product) => product.availableForSale);
}

export function isGarmentProductType(productType: string | null | undefined) {
  return /hoodie|sweatshirt|shirt|apparel|garment|tee|fleece/i.test(
    productType ?? '',
  );
}
