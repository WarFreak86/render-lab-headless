import type {CollectionProductCardData, CollectionMoney} from './collection';

export type MaterialCollectionVariant = {
  availableForSale?: boolean | null;
  price: CollectionMoney;
  selectedOptions: Array<{name: string; value: string}>;
};

export const MATERIAL_BY_COLLECTION_HANDLE: Record<string, string> = {
  posters: 'Poster',
  'canvas-art': 'Canvas',
  'metal-wall-art': 'Metal',
};

export function selectedMaterial(variant: MaterialCollectionVariant) {
  return variant.selectedOptions.find(
    (option) => /^(material|finish)$/i.test(option.name),
  )?.value;
}

export function productSupportsMaterial(
  variants: ReadonlyArray<MaterialCollectionVariant>,
  material: string,
) {
  return variants.some(
    (variant) =>
      selectedMaterial(variant)?.toLowerCase() === material.toLowerCase(),
  );
}

export function materialCollectionHandleForValue(material?: string | null) {
  const normalized = material?.trim().toLowerCase();
  if (!normalized) return null;
  return (
    Object.entries(MATERIAL_BY_COLLECTION_HANDLE).find(
      ([, value]) => value.toLowerCase() === normalized,
    )?.[0] ?? null
  );
}

function compareMoney(a: CollectionMoney, b: CollectionMoney) {
  return Number(a.amount) - Number(b.amount);
}

function variantSearchParams(variant: MaterialCollectionVariant) {
  const params = new URLSearchParams();
  for (const option of variant.selectedOptions) {
    const name = option.name.trim();
    const value = option.value.trim();
    if (name && value) params.set(name, value);
  }
  return params;
}

export function applyMaterialCollectionContext({
  product,
  collectionHandle,
  variants,
}: {
  product: CollectionProductCardData;
  collectionHandle: string;
  variants: MaterialCollectionVariant[];
}): CollectionProductCardData {
  const preferredMaterial = MATERIAL_BY_COLLECTION_HANDLE[collectionHandle];

  // Legacy single-material products and bundle products do not expose a Material
  // option. Leave those URLs and prices untouched.
  if (!preferredMaterial) return product;

  const matchingVariants = variants.filter(
    (variant) =>
      selectedMaterial(variant)?.toLowerCase() === preferredMaterial.toLowerCase(),
  );

  if (!matchingVariants.length) return product;

  const availableVariants = matchingVariants.filter((variant) => variant.availableForSale);
  const pricedVariants = (availableVariants.length ? availableVariants : matchingVariants)
    .slice().sort((a, b) => compareMoney(a.price, b.price));
  const prices = pricedVariants.map((variant) => variant.price);
  const linkedVariant = pricedVariants[0];
  const params = variantSearchParams(linkedVariant);

  return {
    ...product,
    priceMaterial: preferredMaterial,
    // A product route must receive a complete variant selection. Passing only
    // Material leaves Size unresolved, allowing Shopify to fall back to the first
    // Metal variant and making the server/client initial render disagree.
    to: `${product.to}?${params.toString()}`,
    minPrice: prices[0],
    maxPrice: prices[prices.length - 1],
    availableForSale: matchingVariants.some((variant) =>
      Boolean(variant.availableForSale),
    ),
  };
}
