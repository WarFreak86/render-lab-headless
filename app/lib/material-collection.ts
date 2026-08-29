import type {CollectionProductCardData, CollectionMoney} from './collection';

export type MaterialCollectionVariant = {
  availableForSale?: boolean | null;
  price: CollectionMoney;
  selectedOptions: Array<{name: string; value: string}>;
};

const MATERIAL_BY_COLLECTION_HANDLE: Record<string, string> = {
  posters: 'Poster',
  'canvas-art': 'Canvas',
  'metal-wall-art': 'Metal',
};

function selectedMaterial(variant: MaterialCollectionVariant) {
  return variant.selectedOptions.find(
    (option) => option.name.toLowerCase() === 'material',
  )?.value;
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
  if (!preferredMaterial || product.productType !== 'Wall Art') return product;

  const matchingVariants = variants.filter(
    (variant) =>
      selectedMaterial(variant)?.toLowerCase() === preferredMaterial.toLowerCase(),
  );

  if (!matchingVariants.length) return product;

  const prices = matchingVariants.map((variant) => variant.price).sort(compareMoney);
  const linkedVariant =
    matchingVariants.find((variant) => Boolean(variant.availableForSale)) ??
    matchingVariants[0];
  const params = variantSearchParams(linkedVariant);

  return {
    ...product,
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
