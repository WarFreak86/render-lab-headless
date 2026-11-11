import {StrictMode} from 'react';
import {act, render} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  PinterestAnalytics,
  createPinterestAddToCartData,
  createPinterestPageVisitData,
  getPinterestCatalogId,
} from './PinterestAnalytics';

const analytics = vi.hoisted(() => ({
  callbacks: new Map<string, Array<(event: unknown) => void>>(),
  environment: 'production',
  canTrack: true,
}));
vi.mock('@shopify/hydrogen', () => ({
  useAnalytics: () => ({
    subscribe: (name: string, callback: (event: unknown) => void) => {
      const callbacks = analytics.callbacks.get(name) ?? [];
      callbacks.push(callback);
      analytics.callbacks.set(name, callbacks);
    },
    register: () => ({ready: () => {}}),
    canTrack: () => analytics.canTrack,
  }),
}));
vi.mock('~/lib/config', () => ({
  getStorefrontEnvironment: () => analytics.environment,
}));

const browser = window as Window & {
  pintrk?: ReturnType<typeof vi.fn>;
  Shopify?: {customerPrivacy?: {
    marketingAllowed?: () => boolean;
    saleOfDataAllowed?: () => boolean;
  }};
};
const originalShopify = browser.Shopify;
const originalTracker = browser.pintrk;
const originalUrl = window.location.href;
const gid = (id: string) => 'gid://shopify/ProductVariant/' + id;
const product = (id = '47396821991585') => ({
  id: 'gid://shopify/Product/123',
  title: 'Deadpool',
  variantId: gid(id),
  variantTitle: 'Metal / 12×16',
  vendor: 'Render-Lab',
  price: '79.00',
});
const line = (id: string, quantity = 1) => ({
  quantity,
  merchandise: {id: gid(id), title: 'Metal / 12×16', product: {id: 'gid://shopify/Product/123', title: 'Artwork'}},
  cost: {amountPerQuantity: {amount: '79.00', currencyCode: 'USD'}},
});
const publish = (name: string, event: unknown = {}) => act(() => {
  analytics.callbacks.get(name)?.forEach((callback) => callback(event));
});
const viewProduct = (id = '47396821991585', url = window.location.href) =>
  publish('product_viewed', {url, products: [product(id)], shop: {currency: 'USD'}});
const pageVisits = () => browser.pintrk!.mock.calls.filter(([, event]) => event === 'pagevisit');

beforeEach(() => {
  analytics.callbacks.clear();
  analytics.environment = 'production';
  analytics.canTrack = true;
  browser.pintrk = vi.fn();
  browser.Shopify = {customerPrivacy: {
    marketingAllowed: () => true,
    saleOfDataAllowed: () => true,
  }};
  window.history.replaceState(null, '', '/products/deadpool');
});
afterEach(() => {
  browser.Shopify = originalShopify;
  browser.pintrk = originalTracker;
  window.history.replaceState(null, '', originalUrl);
});

describe('Pinterest catalog variant strings', () => {
  it.each(['47396821991585', '47396819730593', '900719925474099312345'])(
    'preserves exact catalog ID %s for cart and product visits',
    (id) => {
      expect(getPinterestCatalogId(gid(id))).toBe(id);
      expect(createPinterestAddToCartData(line(id, 3), line(id, 1))).toMatchObject({
        value: 158, currency: 'USD', order_quantity: 2,
        line_items: [{product_id: id, product_variant_id: gid(id), product_price: 79, product_quantity: 2}],
      });
      expect(createPinterestPageVisitData(product(id), 'USD')).toMatchObject({
        currency: 'USD', line_items: [{product_id: id, product_price: 79}],
      });
    },
  );

  it.each([undefined, null, '', '47396821991585', 'gid://shopify/Product/47396821991585',
    gid('0'), gid('-1'), gid('1.2'), gid('123?x=1'), gid('123\n')])(
    'does not substitute the parent product for an invalid variant %s',
    (id) => {
      expect(getPinterestCatalogId(id)).toBeNull();
      expect(createPinterestPageVisitData({...product(), variantId: id}, 'USD')).toBeNull();
      const current = line('47396821991585');
      expect(createPinterestAddToCartData({...current, merchandise: {...current.merchandise, id: id ?? ''}})).toBeNull();
    },
  );
});

describe('Pinterest browser event lifecycle', () => {
  it('waits for selected variant, tracks changes once, and preserves return visits', () => {
    render(<PinterestAnalytics />);
    publish('page_viewed');
    expect(pageVisits()).toHaveLength(0);
    viewProduct();
    publish('page_viewed');
    viewProduct();
    act(() => document.dispatchEvent(new Event('visitorConsentCollected')));
    expect(pageVisits()).toHaveLength(1);
    window.history.replaceState(null, '', '/products/deadpool?Material=Canvas');
    publish('page_viewed');
    viewProduct('47396819730593');
    viewProduct('47396819730593');
    expect(pageVisits().map(([, , data]) => data.line_items[0].product_id)).toEqual([
      '47396821991585', '47396819730593',
    ]);
    window.history.replaceState(null, '', '/collections/all');
    publish('page_viewed');
    publish('page_viewed');
    expect(pageVisits()[2]).toEqual(['track', 'pagevisit']);
    window.history.replaceState(null, '', '/products/deadpool?Material=Canvas');
    publish('page_viewed');
    viewProduct('47396819730593');
    expect(pageVisits()).toHaveLength(4);
  });

  it('deduplicates when product_viewed precedes page_viewed and during StrictMode effects', () => {
    render(<StrictMode><PinterestAnalytics /></StrictMode>);
    viewProduct();
    publish('page_viewed');
    viewProduct();
    publish('product_added_to_cart', {currentLine: line('47396821991585')});
    expect(pageVisits()).toHaveLength(1);
    expect(browser.pintrk!.mock.calls.filter(([, event]) => event === 'addtocart')).toHaveLength(1);
  });

  it('preserves generic visits for missing/invalid product variants without inventing IDs', () => {
    render(<PinterestAnalytics />);
    publish('product_viewed', {url: window.location.href, products: [{...product(), variantId: ''}]});
    publish('page_viewed');
    expect(pageVisits()).toEqual([['track', 'pagevisit']]);
    window.history.replaceState(null, '', '/about');
    publish('page_viewed');
    expect(pageVisits()[1]).toEqual(['track', 'pagevisit']);
  });

  it('ignores late events for a different page or variant URL', () => {
    render(<PinterestAnalytics />);
    viewProduct('47396819730593', 'https://render-lab.org/products/blade');
    expect(pageVisits()).toHaveLength(0);
    viewProduct();
    window.history.replaceState(null, '', '/products/deadpool?Material=Canvas');
    viewProduct('47396821991585', 'https://render-lab.org/products/deadpool');
    expect(pageVisits()).toHaveLength(1);
  });

  it('retains current product context across consent grant and rechecks consent on cart events', () => {
    browser.Shopify!.customerPrivacy!.marketingAllowed = () => false;
    render(<PinterestAnalytics />);
    viewProduct();
    publish('product_added_to_cart', {currentLine: line('47396821991585')});
    expect(browser.pintrk).not.toHaveBeenCalled();
    browser.Shopify!.customerPrivacy!.marketingAllowed = () => true;
    act(() => document.dispatchEvent(new Event('visitorConsentCollected')));
    expect(pageVisits()).toHaveLength(1);
    browser.Shopify!.customerPrivacy!.saleOfDataAllowed = () => false;
    publish('product_added_to_cart', {currentLine: line('47396821991585')});
    expect(browser.pintrk!.mock.calls).toHaveLength(1);
  });

  it.each(['preview', 'local'])('does not load or send Pinterest in %s', (environment) => {
    analytics.environment = environment;
    delete browser.pintrk;
    render(<PinterestAnalytics />);
    viewProduct();
    publish('product_added_to_cart', {currentLine: line('47396821991585')});
    expect(browser.pintrk).toBeUndefined();
    expect(document.querySelector('script[src="https://s.pinimg.com/ct/core.js"]')).toBeNull();
  });

  it('does not track without Hydrogen permission or Shopify privacy state', () => {
    analytics.canTrack = false;
    render(<PinterestAnalytics />);
    viewProduct();
    expect(browser.pintrk).not.toHaveBeenCalled();
    analytics.canTrack = true;
    Reflect.deleteProperty(browser, 'Shopify');
    viewProduct();
    expect(browser.pintrk).not.toHaveBeenCalled();
  });
});
