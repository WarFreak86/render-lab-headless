import {
  canQuickAddRecommendation,
  getCartMutationMessage,
  getCartDiscountSavings,
  getShippingProgress,
  isMeaningfulCartOption,
  isStableShopifyLineId,
} from './cart';

describe('cart commerce helpers', () => {
  it('keeps real selected options', () => {
    expect(isMeaningfulCartOption({name: 'Size', value: 'Large'})).toBe(true);
  });

  it('hides meaningless Default Title options', () => {
    expect(
      isMeaningfulCartOption({name: 'Title', value: 'Default Title'}),
    ).toBe(false);
  });

  it('hides shipping progress without configuration', () => {
    expect(getShippingProgress(80)).toBeNull();
  });

  it('calculates configured shipping progress from the Shopify subtotal', () => {
    expect(getShippingProgress(99, {amount: 150, currencyCode: 'USD'})).toEqual(
      {
        qualified: false,
        progress: 66,
        remaining: 51,
      },
    );
  });

  it('caps configured shipping progress after qualification', () => {
    expect(
      getShippingProgress(175, {amount: 150, currencyCode: 'USD'}),
    ).toEqual({
      qualified: true,
      progress: 100,
      remaining: 0,
    });
  });

  it('does not arbitrary quick-add a multi-variant recommendation', () => {
    expect(
      canQuickAddRecommendation([
        {availableForSale: true},
        {availableForSale: true},
      ]),
    ).toBe(false);
  });

  it('permits quick-add architecture only for one available variant', () => {
    expect(canQuickAddRecommendation([{availableForSale: true}])).toBe(true);
    expect(canQuickAddRecommendation([{availableForSale: false}])).toBe(false);
  });

  it('shows a full-code discount against the subtotal and Shopify total', () => {
    expect(getCartDiscountSavings({
      subtotal: {amount: '79.00', currencyCode: 'USD'},
      total: {amount: '0.00', currencyCode: 'USD'},
      applications: [
        {
          targetType: 'LINE_ITEM',
          totalAllocatedAmount: {amount: '79.00', currencyCode: 'USD'},
        },
      ],
    })).toEqual({amount: '79.00', currencyCode: 'USD'});
  });

  it('shows an ordinary percentage discount without guessing its rate', () => {
    expect(getCartDiscountSavings({
      subtotal: {amount: '79.00', currencyCode: 'USD'},
      total: {amount: '71.10', currencyCode: 'USD'},
      applications: [
        {
          targetType: 'LINE_ITEM',
          totalAllocatedAmount: {amount: '7.90', currencyCode: 'USD'},
        },
      ],
    })).toEqual({amount: '7.90', currencyCode: 'USD'});
  });

  it('does not invent savings from shipping codes or gift-card payments', () => {
    const subtotal = {amount: '79.00', currencyCode: 'USD'};
    const total = {amount: '0.00', currencyCode: 'USD'};
    expect(getCartDiscountSavings({subtotal, total, applications: []})).toBeNull();
    expect(getCartDiscountSavings({
      subtotal,
      total,
      applications: [{
        targetType: 'SHIPPING_LINE',
        totalAllocatedAmount: {amount: '79.00', currencyCode: 'USD'},
      }],
    })).toBeNull();
  });

  it('caps allocation savings at the actual Shopify-reported reduction', () => {
    expect(getCartDiscountSavings({
      subtotal: {amount: '79.00', currencyCode: 'USD'},
      total: {amount: '74.00', currencyCode: 'USD'},
      applications: [{
        targetType: 'LINE_ITEM',
        totalAllocatedAmount: {amount: '9.00', currencyCode: 'USD'},
      }],
    })).toEqual({amount: '5.00', currencyCode: 'USD'});
  });

  it('does not mix currencies or display a negative discount', () => {
    expect(getCartDiscountSavings({
      subtotal: {amount: '79.00', currencyCode: 'USD'},
      total: {amount: '85.00', currencyCode: 'USD'},
      applications: [{
        targetType: 'LINE_ITEM',
        totalAllocatedAmount: {amount: '5.00', currencyCode: 'USD'},
      }],
    })).toBeNull();
    expect(getCartDiscountSavings({
      subtotal: {amount: '79.00', currencyCode: 'USD'},
      total: {amount: '0.00', currencyCode: 'EUR'},
      applications: [{
        targetType: 'LINE_ITEM',
        totalAllocatedAmount: {amount: '79.00', currencyCode: 'USD'},
      }],
    })).toBeNull();
  });

  it('maps inventory errors to safe cart language', () => {
    expect(
      getCartMutationMessage({
        errors: [{message: 'Inventory quantity exceeds stock'}],
      }),
    ).toBe('That quantity is not available.');
  });

  it('does not expose raw GraphQL errors', () => {
    expect(
      getCartMutationMessage({
        errors: [{message: 'GraphQL: invalid ID at cartLinesUpdate'}],
      }),
    ).toBe('We couldn’t update your cart. Please try again.');
  });

  it('distinguishes settled Shopify line IDs from optimistic placeholders', () => {
    expect(isStableShopifyLineId('gid://shopify/CartLine/abc?cart=123')).toBe(
      true,
    );
    expect(isStableShopifyLineId('optimistic-cart-line-1')).toBe(false);
  });
});
