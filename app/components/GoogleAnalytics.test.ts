import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render} from '@testing-library/react';
import {createElement} from 'react';
import {
  GoogleAnalytics,
  createGa4AddToCartData,
  createGa4ViewItemData,
  dispatchGa4EcommerceEvent,
  getGa4PageViewParameters,
} from './GoogleAnalytics';

const analytics = vi.hoisted(() => ({
  callbacks: new Map<string, (event?: unknown) => void>(),
}));

vi.mock('@shopify/hydrogen', () => ({
  useAnalytics: () => ({
    subscribe: (name: string, callback: (event?: unknown) => void) =>
      analytics.callbacks.set(name, callback),
    register: () => ({ready: () => {}}),
    canTrack: () => true,
  }),
  useNonce: () => undefined,
}));
vi.mock('react-router', () => ({
  useLocation: () => ({pathname: window.location.pathname}),
}));
vi.mock('~/lib/config', () => ({
  getStorefrontEnvironment: () => 'preview',
}));

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

describe('GA4 campaign attribution', () => {
  it('preserves campaign tags while removing non-campaign data and fragments', () => {
    expect(
      getGa4PageViewParameters(
        'https://render-lab.org/products/art?utm_source=pinterest&utm_medium=organic_social&utm_campaign=fall&Material=Metal&email=private%40example.com#gallery',
        'Artwork | Render-Lab',
      ),
    ).toEqual({
      page_path: '/products/art',
      page_location:
        'https://render-lab.org/products/art?utm_source=pinterest&utm_medium=organic_social&utm_campaign=fall',
      page_title: 'Artwork | Render-Lab',
    });
  });

  it('retains ad attribution IDs but excludes product option parameters', () => {
    expect(
      getGa4PageViewParameters(
        'https://render-lab.org/products/art?Size=18x24&gclid=abc123',
        'Artwork',
      ).page_location,
    ).toBe('https://render-lab.org/products/art?gclid=abc123');
  });
});

describe('GA4 direct ecommerce events', () => {
  it('deduplicates repeated product views but tracks variant changes and return visits', () => {
    const gtag = vi.fn();
    browser.gtag = gtag;
    const privacyWindow = window as Window & {Shopify?: unknown};
    const originalShopify = privacyWindow.Shopify;
    const originalPath = window.location.pathname;
    privacyWindow.Shopify = {customerPrivacy: {analyticsProcessingAllowed: () => true}};
    window.history.replaceState(null, '', '/products/artwork');
    const view = render(createElement(GoogleAnalytics, {
      previewMeasurementId: 'G-QAONLY0001',
    }));

    const publish = (variantId: string) =>
      analytics.callbacks.get('product_viewed')?.({
        products: [{id: 'p1', title: 'Artwork', variantId, price: '59'}],
      });

    try {
      act(() => {
        publish('v1');
        window.history.replaceState(null, '', '/products/artwork?Size=16x12');
        publish('v1');
        publish('v2');
        publish('v2');
        window.history.replaceState(null, '', '/collections/art');
        analytics.callbacks.get('page_viewed')?.();
        window.history.replaceState(null, '', '/products/artwork');
        publish('v2');
      });
      const views = gtag.mock.calls.filter(([, name]) => name === 'view_item');
      expect(views.map(([, , payload]) => payload.items[0].item_id)).toEqual([
        'v1', 'v2', 'v2',
      ]);
    } finally {
      view.unmount();
      analytics.callbacks.clear();
      privacyWindow.Shopify = originalShopify;
      window.history.replaceState(null, '', originalPath);
    }
  });

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
