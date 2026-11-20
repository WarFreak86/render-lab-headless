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

type CartMoney<TCurrency extends string> = {
  amount?: string;
  currencyCode?: TCurrency;
};

type CartDiscountAllocation<TCurrency extends string> = {
  targetType?: string;
  discountedAmount?: CartMoney<TCurrency> | null;
};

/**
 * Read savings already allocated and priced by Shopify, not an assumed
 * percentage. Optimistic carts can temporarily contain partial money values,
 * so guard them before rendering a confirmed discounted cart amount.
 */
export function getCartDiscountSavings<TCurrency extends string>({
  subtotal,
  total,
  applications,
}: {
  subtotal?: CartMoney<TCurrency> | null;
  total?: CartMoney<TCurrency> | null;
  applications?: ReadonlyArray<CartDiscountAllocation<TCurrency>> | null;
}): {amount: string; currencyCode: TCurrency} | null {
  if (
    !subtotal?.amount ||
    !total?.amount ||
    !subtotal.currencyCode ||
    subtotal.currencyCode !== total.currencyCode
  ) {
    return null;
  }

  const subtotalCents = Math.round(Number(subtotal.amount) * 100);
  const totalCents = Math.round(Number(total.amount) * 100);
  if (!Number.isFinite(subtotalCents) || !Number.isFinite(totalCents)) {
    return null;
  }

  // CartCost.subtotalAmount excludes cart-level discounts; totalAmount is
  // Shopify's latest estimate after applicable offers.
  const cartReductionCents = Math.max(0, subtotalCents - totalCents);
  if (!cartReductionCents) return null;

  const allocatedCents = (applications ?? []).reduce((sum, allocation) => {
    const amount = allocation.discountedAmount;
    if (
      allocation.targetType !== 'LINE_ITEM' ||
      !amount?.amount ||
      amount.currencyCode !== subtotal.currencyCode
    ) {
      return sum;
    }
    const cents = Math.round(Number(amount.amount) * 100);
    return Number.isFinite(cents) && cents > 0 ? sum + cents : sum;
  }, 0);

  // Product-level discounts may already be included in the subtotal.
  // Cap the displayed savings at the change in Shopify's own totals.
  const savingsCents = Math.min(cartReductionCents, allocatedCents);
  return savingsCents > 0
    ? {amount: (savingsCents / 100).toFixed(2), currencyCode: subtotal.currencyCode}
    : null;
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
