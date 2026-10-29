import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  createGa4AddToCartData,
  createGa4ViewItemData,
  dispatchGa4EcommerceEvent,
} from './GoogleAnalytics';

const browser = window as Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[][];
};
const originalGtag = browser.gtag;
const originalDataLayer = browser.dataLayer;

afterEach(() => {
  browser.gtag = originalGtag;
  browser.dataLayer = originalDataLayer;
});

const line = (quantity: number, amount = '39.50') => ({
  quantity,
  cost: {
    amountPerQuantity: {amount, currencyCode: 'USD'},
  },
  merchandise: {
    id: 'gid://shopify/ProductVariant/456',
    title: 'Canvas / 18x24',
    product: {title: 'Cathedral of the Void', vendor: 'Render-Lab'},
  },
});

describe('GA4 direct ecommerce events', () => {
  it('creates view_item parameters without a GTM ecommerce wrapper', () => {
    const payload = createGa4ViewItemData({
      id: 'gid://shopify/Product/123',
      title: 'Cathedral of the Void',
      vendor: 'Render-Lab',
      variantId: 'gid://shopify/ProductVariant/456',
      variantTitle: 'Canvas / 18x24',
      price: '89.00',
    });

    expect(payload).toEqual({
      currency: 'USD',
      value: 89,
      items: [{
        item_id: 'gid://shopify/ProductVariant/456',
        item_name: 'Cathedral of the Void',
        item_brand: 'Render-Lab',
        item_variant: 'Canvas / 18x24',
        price: 89,
        quantity: 1,
      }],
    });
    expect(payload).not.toHaveProperty('ecommerce');
  });

  it('tracks only the added quantity and extended value for add_to_cart', () => {
    const payload = createGa4AddToCartData(line(3), line(1));
    expect(payload).toEqual({
      currency: 'USD',
      value: 79,
      items: [{
        item_id: 'gid://shopify/ProductVariant/456',
        item_name: 'Cathedral of the Void',
        item_brand: 'Render-Lab',
        item_variant: 'Canvas / 18x24',
        price: 39.5,
        quantity: 2,
      }],
    });
    expect(payload).not.toHaveProperty('ecommerce');
  });

  it('never records removals, invalid prices, or missing variants as additions', () => {
    expect(createGa4AddToCartData(line(2), line(2))).toBeNull();
    expect(createGa4AddToCartData(line(1), line(2))).toBeNull();
    expect(createGa4AddToCartData(line(1, 'invalid'))).toBeNull();
    expect(createGa4AddToCartData({quantity: 1})).toBeNull();
  });

  it('dispatches view_item and add_to_cart using window.gtag, not raw dataLayer objects', () => {
    const gtag = vi.fn();
    browser.gtag = gtag;
    browser.dataLayer = [];
    const item = createGa4ViewItemData({
      id: 'p1', title: 'Artwork', price: '89.00',
    })!;
    const cart = createGa4AddToCartData(line(2))!;

    dispatchGa4EcommerceEvent('view_item', item);
    dispatchGa4EcommerceEvent('add_to_cart', cart);

    expect(gtag).toHaveBeenNthCalledWith(1, 'event', 'view_item', item);
    expect(gtag).toHaveBeenNthCalledWith(2, 'event', 'add_to_cart', cart);
    expect(browser.dataLayer).toEqual([]);
  });

  it('does nothing when gtag is not initialized', () => {
    browser.gtag = undefined;
    browser.dataLayer = [];
    dispatchGa4EcommerceEvent('view_item', createGa4ViewItemData({
      id: 'p1', title: 'Artwork', price: '59',
    })!);
    expect(browser.dataLayer).toEqual([]);
  });
});
