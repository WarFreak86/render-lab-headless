export type Material = 'Metal' | 'Canvas';
export interface Variant {
  id: string;
  selectedOptions: Array<{name: string; value: string}>;
  material: Material;
  size: string;
  price: string;
  currencyCode: string;
  availableForSale: boolean;
}
export interface Artwork {
  id: string;
  title: string;
  handle: string;
  image: string;
  variants: Variant[];
}
export interface Catalog {
  fetchedAt: string;
  source: 'Shopify Storefront API';
  products: Artwork[];
}
export function materialsFor(art: Artwork): Material[] {
  return [...new Set(art.variants.map((v) => v.material))];
}
export function sizesFor(art: Artwork, material: Material) {
  return [
    ...new Set(
      art.variants.filter((v) => v.material === material).map((v) => v.size),
    ),
  ].sort((a, b) => Number(a.split('x')[0]) - Number(b.split('x')[0]));
}
export function selectedVariant(
  art: Artwork,
  material: Material,
  size: string,
) {
  return art.variants.find((v) => v.material === material && v.size === size);
}
export function priceFor(variant: Variant) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: variant.currencyCode,
    maximumFractionDigits: 2,
  }).format(Number(variant.price));
}
