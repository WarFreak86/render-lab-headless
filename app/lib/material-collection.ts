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
  const params = new URLSearchParams({Material: preferredMaterial});

  return {
    ...product,
    to: `${product.to}?${params.toString()}`,
    minPrice: prices[0],
    maxPrice: prices[prices.length - 1],
    availableForSale: matchingVariants.some((variant) =>
      Boolean(variant.availableForSale),
    ),
  };
}
