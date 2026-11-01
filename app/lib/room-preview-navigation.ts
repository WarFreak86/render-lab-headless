import {ROOM_PREVIEW_PATH} from './room-preview-access';
import type {Artwork} from '~/components/room-preview/catalog';

export const ROOM_PREVIEW_HANDLE = 'the-sky-unbound';

type ProductSelection = {
  id: string;
  selectedOptions: Array<{name: string; value: string}>;
};

export function productSelectionSearch(variant: ProductSelection) {
  const params = new URLSearchParams();
  const id = variant.id.match(
    /^gid:\/\/shopify\/ProductVariant\/([1-9]\d{0,31})$/,
  )?.[1];
  if (!id) return undefined;
  params.set('variant', id);
  for (const option of variant.selectedOptions) {
    params.set(option.name, option.value);
  }
  return params;
}

export function roomPreviewHref(handle: string, variant: ProductSelection) {
  if (handle !== ROOM_PREVIEW_HANDLE) return undefined;
  const params = productSelectionSearch(variant);
  if (!params) return undefined;
  params.set('product', handle);
  return `${ROOM_PREVIEW_PATH}?${params}`;
}

export function roomPreviewSelection(url: string, art: Artwork) {
  const params = new URL(url).searchParams;
  if (params.has('product') && params.get('product') !== art.handle)
    return undefined;
  if (params.has('variant')) {
    return art.variants.find(
      (variant) =>
        productSelectionSearch(variant)?.get('variant') ===
        params.get('variant'),
    );
  }
  return (
    art.variants.find((v) => v.material === 'Metal' && v.size === '18x24') ??
    art.variants[0]
  );
}

export function roomProductHref(art: Artwork, variant: ProductSelection) {
  const params = productSelectionSearch(variant);
  return `/products/${encodeURIComponent(art.handle)}${params ? `?${params}` : ''}`;
}
