import {describe, expect, it} from 'vitest';
import {createPinterestAddToCartData, hasPinterestPrivacyPermission} from './PinterestAnalytics';

const line = (quantity: number, amount = '49.99') => ({
  quantity,
  cost: {
    amountPerQuantity: {amount, currencyCode: 'USD'},
  },
  merchandise: {
    id: 'gid://shopify/ProductVariant/456',
    title: '18 × 24 / Canvas',
    product: {
      id: 'gid://shopify/Product/123',
      title: 'Sunset Service Court',
      vendor: 'Render-Lab',
    },
  },
});

describe('Pinterest AddToCart mapping', () => {
  it('tracks only the units added to an existing cart line', () => {
    expect(createPinterestAddToCartData(line(3), line(1))).toEqual({
      value: 99.98,
      order_quantity: 2,
      currency: 'USD',
      line_items: [
        {
          product_id: 'gid://shopify/Product/123',
          product_variant_id: 'gid://shopify/ProductVariant/456',
          product_name: 'Sunset Service Court',
          product_variant: '18 × 24 / Canvas',
          product_brand: 'Render-Lab',
          product_price: 49.99,
          product_quantity: 2,
        },
      ],
    });
  });

  it('tracks the first addition to a new line', () => {
    expect(createPinterestAddToCartData(line(1))?.order_quantity).toBe(1);
  });

  it('does not record removals or unchanged quantities as additions', () => {
    expect(createPinterestAddToCartData(line(1), line(2))).toBeNull();
    expect(createPinterestAddToCartData(line(2), line(2))).toBeNull();
  });

  it('does not invent prices or product identifiers', () => {
    expect(createPinterestAddToCartData(line(1, 'invalid'))).toBeNull();
    expect(
      createPinterestAddToCartData({
        quantity: 1,
        cost: {amountPerQuantity: {amount: '10', currencyCode: 'USD'}},
      }),
    ).toBeNull();
  });
});

describe('Pinterest privacy permissions', () => {
  it('requires both marketing consent and permission to share data', () => {
    expect(
      hasPinterestPrivacyPermission({
        marketingAllowed: () => true,
        saleOfDataAllowed: () => true,
      }),
    ).toBe(true);
  });

  it('blocks tracking when a visitor opts out of data sharing', () => {
    expect(
      hasPinterestPrivacyPermission({
        marketingAllowed: () => true,
        saleOfDataAllowed: () => false,
      }),
    ).toBe(false);
  });

  it('blocks tracking when marketing permission is denied', () => {
    expect(
      hasPinterestPrivacyPermission({
        marketingAllowed: () => false,
        saleOfDataAllowed: () => true,
      }),
    ).toBe(false);
  });

  it('fails closed if Shopify privacy permission state is unavailable', () => {
    expect(hasPinterestPrivacyPermission(undefined)).toBe(false);
    expect(
      hasPinterestPrivacyPermission({marketingAllowed: () => true}),
    ).toBe(false);
  });
});
