export type CartOption = {name: string; value: string};

export type ShippingThreshold = {
  amount: number;
  currencyCode: CurrencyCode;
};

export type ShippingProgress = {
  qualified: boolean;
  progress: number;
  remaining: number;
};

export function isMeaningfulCartOption(option: CartOption) {
  return option.value.trim().toLowerCase() !== 'default title';
}

export function getShippingProgress(
  subtotalAmount: number,
  threshold?: ShippingThreshold,
): ShippingProgress | null {
  if (!threshold || threshold.amount <= 0 || subtotalAmount < 0) return null;

  const remaining = Math.max(0, threshold.amount - subtotalAmount);
  return {
    qualified: remaining === 0,
    progress: Math.min(100, (subtotalAmount / threshold.amount) * 100),
    remaining,
  };
}

export function getCartMutationMessage(data: unknown) {
  if (!data || typeof data !== 'object') return undefined;
  const result = data as {errors?: unknown; warnings?: unknown};
  const messages = [result.errors, result.warnings]
    .flatMap((value) => (Array.isArray(value) ? value : []))
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'message' in item) {
        return String((item as {message: unknown}).message);
      }
      return '';
    })
    .filter(Boolean);

  const message = messages[0]?.toLowerCase();
  if (!message) return undefined;
  if (message.includes('sold out') || message.includes('unavailable')) {
    return 'This item is no longer available.';
  }
  if (
    message.includes('quantity') ||
    message.includes('inventory') ||
    message.includes('stock')
  ) {
    return 'That quantity is not available.';
  }
  return 'We couldn’t update your cart. Please try again.';
}

export function isStableShopifyLineId(lineId: string) {
  return lineId.startsWith('gid://shopify/CartLine/');
}

export function canQuickAddRecommendation(
  variants: Array<{availableForSale: boolean}>,
) {
  return variants.length === 1 && variants[0]?.availableForSale === true;
}
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
