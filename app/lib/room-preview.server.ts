import type {HydrogenRouterContextProvider} from '@shopify/hydrogen';
import type {Catalog, Artwork} from '~/components/room-preview/catalog';
import {ROOM_PREVIEW_HEADERS} from './room-preview-access';
import {
  guardRoomPreview,
  type RoomPreviewStagingConfig,
} from './room-preview-access.server';

import {ROOM_PREVIEW_HANDLE} from './room-preview-navigation';
export {ROOM_PREVIEW_HANDLE} from './room-preview-navigation';
export const ROOM_PREVIEW_QUERY = `#graphql
  query HydrogenRoomPreviewProduct($handle: String!) @inContext(country: US, language: EN) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage { url width height }
      variants(first: 100) {
        nodes {
          id
          availableForSale
          selectedOptions { name value }
          price { amount currencyCode }
        }
        pageInfo { hasNextPage }
      }
    }
  }
` as const;

// A small port of the verified pilot mapper, using generated Hydrogen query types.
export function mapRoomProduct(
  product: {
    id: string;
    title: string;
    handle: string;
    featuredImage?: {
      url: string;
      width?: number | null;
      height?: number | null;
    } | null;
    variants: {
      nodes: Array<{
        id: string;
        availableForSale: boolean;
        selectedOptions: Array<{name: string; value: string}>;
        price: {amount: string; currencyCode: string};
      }>;
      pageInfo: {hasNextPage: boolean};
    };
  } | null,
): Artwork {
  if (
    !product ||
    product.handle !== ROOM_PREVIEW_HANDLE ||
    !product.title ||
    !product.featuredImage ||
    !/^https:\/\/cdn\.shopify\.com\//.test(product.featuredImage.url) ||
    !product.variants.nodes.length ||
    product.variants.pageInfo.hasNextPage
  )
    throw new Error('Published preview product unavailable');
  const variants = product.variants.nodes.map<Artwork['variants'][number]>(
    (v) => {
      const options = new Map(
        v.selectedOptions.map((option) => [
          option.name.toLowerCase(),
          option.value,
        ]),
      );
      const material = options.get('material');
      const size = options
        .get('size')
        ?.toLowerCase()
        .replace(/\s/g, '')
        .replace('×', 'x');
      if (
        (material !== 'Metal' && material !== 'Canvas') ||
        !size ||
        !/^(12x16|18x24|24x32)$/.test(size) ||
        v.selectedOptions.length !== 2 ||
        !/^\d+(\.\d+)?$/.test(v.price.amount) ||
        !Number.isFinite(Number(v.price.amount))
      )
        throw new Error('Unsupported preview variant');
      return {
        id: v.id,
        selectedOptions: v.selectedOptions,
        material,
        size,
        price: v.price.amount,
        currencyCode: v.price.currencyCode,
        availableForSale: v.availableForSale,
      };
    },
  );
  if (
    new Set(variants.map((v) => `${v.material}/${v.size}`)).size !==
    variants.length
  )
    throw new Error('Ambiguous preview variants');
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    image: product.featuredImage.url,
    variants,
  };
}

export async function loadRoomCatalog(
  request: Request,
  storefront: HydrogenRouterContextProvider['storefront'],
  development: boolean,
  config: RoomPreviewStagingConfig = {},
): Promise<Catalog> {
  guardRoomPreview(request, development, config);
  try {
    const result = await storefront.query(ROOM_PREVIEW_QUERY, {
      variables: {handle: ROOM_PREVIEW_HANDLE},
      cache: storefront.CacheNone(),
    });
    return {
      source: 'Shopify Storefront API',
      fetchedAt: new Date().toISOString(),
      products: [mapRoomProduct(result.product ?? null)],
    };
  } catch {
    throw new Response(
      'The live artwork catalog is unavailable. Please retry.',
      {status: 502, headers: ROOM_PREVIEW_HEADERS},
    );
  }
}
