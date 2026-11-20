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

type CartMoney = {amount: string; currencyCode: string};

type CartDiscountApplication = {
  targetType: string;
  totalAllocatedAmount: CartMoney;
};

/**
 * Show savings that Shopify has already priced into the cart. The subtotal
 * excludes cart-level discounts, while totalAmount reflects Shopify's latest
 * estimate. Don't infer a discount from shipping, tax, gift-card payment or
 * mismatched currencies, and don't invent a coupon percentage client-side.
 *
 * Product/automatic discount allocations can already be reflected in the
 * subtotal. Cap the displayed savings at the actual subtotal-to-total change
 * so the displayed subtotal, savings and estimated total stay consistent.
 */
export function getCartDiscountSavings({
  subtotal,
  total,
  applications,
}: {
  subtotal?: CartMoney | null;
  total?: CartMoney | null;
  applications?: ReadonlyArray<CartDiscountApplication> | null;
}): CartMoney | null {
  if (!subtotal || !total || subtotal.currencyCode !== total.currencyCode) {
    return null;
  }

  const subtotalCents = Math.round(Number(subtotal.amount) * 100);
  const totalCents = Math.round(Number(total.amount) * 100);
  if (!Number.isFinite(subtotalCents) || !Number.isFinite(totalCents)) {
    return null;
  }

  const cartReductionCents = Math.max(0, subtotalCents - totalCents);
  if (!cartReductionCents) return null;

  const allocatedCents = (applications ?? []).reduce((sum, application) => {
    if (
      application.targetType !== 'LINE_ITEM' ||
      application.totalAllocatedAmount.currencyCode !== subtotal.currencyCode
    ) {
      return sum;
    }
    const cents = Math.round(Number(application.totalAllocatedAmount.amount) * 100);
    return Number.isFinite(cents) && cents > 0 ? sum + cents : sum;
  }, 0);

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
