import type {ProductImageData} from './product';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';

export interface ChoiceVariant {
  id: string;
  availableForSale: boolean;
  price: {amount: string; currencyCode: CurrencyCode};
  selectedOptions: Array<{name: string; value: string}>;
  sku?: string | null;
  image?: {url: string} | null;
}

export const PRINT_MATERIALS = {
  metal: {
    name: 'Metal',
    surface: 'Aluminum',
    presentation: 'Frameless',
    description: 'Clean edges and a contemporary presentation.',
  },
  canvas: {
    name: 'Canvas',
    surface: 'Textured matte canvas',
    presentation: 'Gallery-wrapped',
    description: 'Texture and dimensional presence on the wall.',
  },
  poster: {
    name: 'Poster',
    surface: 'Matte paper',
    presentation: 'Paper print',
    description: 'A flexible format for your own framing choice.',
  },
} as const;

export function printMaterial(value?: string) {
  const key = value?.toLowerCase() as keyof typeof PRINT_MATERIALS;
  return PRINT_MATERIALS[key];
}

export function optionValue(
  variant: Pick<ChoiceVariant, 'selectedOptions'> | null | undefined,
  name: RegExp,
) {
  return variant?.selectedOptions.find((option) => name.test(option.name))
    ?.value;
}

export function printDimensions(value?: string) {
  const match = value?.match(
    /^\s*(\d+(?:\.\d+)?)\s*(?:in(?:ches)?|["”])?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:in(?:ches)?|["”])?\s*$/i,
  );
  if (!match) return undefined;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 && width <= 200 && height <= 200
    ? {width, height}
    : undefined;
}

export function formatPrintSize(value: string) {
  const size = printDimensions(value);
  return size ? `${size.width} × ${size.height} in` : value;
}

/** Only opt recognized print products into the new presentation. Apparel stays unchanged. */
export function hasPrintChoices(variants: ReadonlyArray<ChoiceVariant>) {
  return (
    variants.length > 0 &&
    variants.every(
      (variant) =>
        printMaterial(optionValue(variant, /^(material|finish)$/i)) &&
        printDimensions(optionValue(variant, /^size$/i)),
    )
  );
}

/** Find the exact combination; never substitute an unrelated price. */
export function choiceForOptions(
  variants: ReadonlyArray<ChoiceVariant>,
  options: Record<string, string>,
) {
  return variants.find((variant) =>
    Object.entries(options).every(([name, value]) =>
      variant.selectedOptions.some(
        (option) =>
          option.name.toLowerCase() === name.toLowerCase() &&
          option.value === value,
      ),
    ),
  );
}

export function choiceQuery(
  search: string,
  options: ReadonlyArray<{name: string; value: string}>,
) {
  const params = new URLSearchParams(search);
  const names = new Set(options.map((option) => option.name.toLowerCase()));
  for (const name of Array.from(params.keys())) {
    if (name.toLowerCase() === 'variant' || names.has(name.toLowerCase()))
      params.delete(name);
  }
  for (const option of options) params.set(option.name, option.value);
  return params.toString();
}

export function isRoomImage(image: ProductImageData) {
  return /mockup|room|displayed|living room|office|above (?:a |the )?(?:sofa|desk)/i.test(
    `${image.url} ${image.altText}`,
  );
}

export function artworkImage(images: ReadonlyArray<ProductImageData>) {
  return images.find((image) => !isRoomImage(image));
}

export function roomImage(
  images: ReadonlyArray<ProductImageData>,
  material: string,
) {
  return images.find(
    (image) =>
      isRoomImage(image) &&
      new RegExp(material, 'i').test(`${image.url} ${image.altText}`),
  );
}

export function clampArtworkPan(
  x: number,
  y: number,
  scale: number,
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const maxX = Math.max(0, (imageWidth * scale - viewportWidth) / 2);
  const maxY = Math.max(0, (imageHeight * scale - viewportHeight) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}
