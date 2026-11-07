type ImageReference = {id?: string | null; url?: string | null};

const SHOPIFY_IMAGE_PARAMETERS = [
  'width', 'height', 'crop', 'crop_left', 'crop_top', 'crop_width',
  'crop_height', 'format', 'quality', 'pad_color', 'scale', 'v',
];

function imageAssetIdentity(value: string) {
  try {
    const url = new URL(value, 'https://render-lab.org');
    url.hash = '';
    const isShopifyImage =
      url.hostname === 'cdn.shopify.com' ||
      url.hostname.endsWith('.shopifycdn.com') ||
      url.pathname.startsWith('/cdn/shop/');

    if (isShopifyImage) {
      url.protocol = 'https:';
      for (const parameter of SHOPIFY_IMAGE_PARAMETERS) {
        url.searchParams.delete(parameter);
      }
      // Legacy Shopify resize URLs put the transformation before the extension.
      url.pathname = url.pathname.replace(
        /_(?:\d+x\d*|\d*x\d+)(?:_crop_(?:top|center|bottom|left|right))?(?:@\d+x)?(?=\.[a-z0-9]+$)/i,
        '',
      );
    }
    url.searchParams.sort();
    return url.href;
  } catch {
    return undefined;
  }
}

export function findProductImageIndex(
  images: ReadonlyArray<{id: string; url: string}>,
  selected?: ImageReference | null,
) {
  if (!selected) return -1;
  const idIndex = selected.id
    ? images.findIndex((image) => image.id === selected.id)
    : -1;
  if (idIndex >= 0) return idIndex;
  if (!selected.url) return -1;
  const identity = imageAssetIdentity(selected.url);
  return identity
    ? images.findIndex((image) => imageAssetIdentity(image.url) === identity)
    : -1;
}
