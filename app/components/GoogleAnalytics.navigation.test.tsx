import {act, render} from '@testing-library/react';
import {GoogleAnalytics} from './GoogleAnalytics';

const state = vi.hoisted(() => ({
  pathname: '/',
  environment: 'production',
  consent: true,
  canTrack: true,
  subscriptions: new Map<string, (data: unknown) => void>(),
}));

vi.mock('react-router', () => ({
  useLocation: () => ({pathname: state.pathname}),
}));
vi.mock('~/lib/config', () => ({
  getStorefrontEnvironment: () => state.environment,
}));
vi.mock('@shopify/hydrogen', () => ({
  useNonce: () => 'test-nonce',
  useAnalytics: () => ({
    canTrack: () => state.canTrack,
    register: () => ({ready: vi.fn()}),
    subscribe: (name: string, callback: (data: unknown) => void) =>
      state.subscriptions.set(name, callback),
  }),
}));

type Browser = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: ArrayLike<unknown>[];
  __renderLabGA4ConfiguredId?: string;
  Shopify?: {customerPrivacy: {analyticsProcessingAllowed: () => boolean}};
};
const browser = window as Browser;

beforeEach(() => {
  state.pathname = '/';
  state.environment = 'production';
  state.consent = true;
  state.canTrack = true;
  state.subscriptions.clear();
  window.history.replaceState({}, '', '/');
  browser.Shopify = {
    customerPrivacy: {analyticsProcessingAllowed: () => state.consent},
  };
});

afterEach(() => {
  delete browser.gtag;
  delete browser.dataLayer;
  delete browser.__renderLabGA4ConfiguredId;
  Reflect.deleteProperty(browser, 'Shopify');
  document
    .querySelectorAll('script[src*="googletagmanager.com"]')
    .forEach((script) => script.remove());
});

it('queues standard gtag Arguments objects so the Google tag can process commands', () => {
  render(<GoogleAnalytics />);
  expect(browser.dataLayer).toHaveLength(3);
  for (const command of browser.dataLayer!) {
    expect(Object.prototype.toString.call(command)).toBe('[object Arguments]');
  }
});

it('initializes once and sends clean paths, ignoring variant queries and repeated notifications', () => {
  const {rerender} = render(<GoogleAnalytics />);
  const events = () =>
    browser.dataLayer
      ?.filter((entry) => entry[0] === 'event')
      .map((entry) => Array.from(entry));
  expect(
    browser.dataLayer
      ?.filter((entry) => entry[0] === 'config')
      .map((entry) => Array.from(entry)),
  ).toEqual([['config', 'G-ELCN4Z6M92', {send_page_view: false}]]);
  expect(events()).toHaveLength(1);
  const script = document.querySelector<HTMLScriptElement>(
    'script[src*="googletagmanager.com"]',
  );
  expect(script?.nonce).toBe('test-nonce');

  window.history.pushState({}, '', '/products/art?variant=large');
  state.pathname = '/products/art';
  rerender(<GoogleAnalytics />);
  act(() => state.subscriptions.get('page_viewed')?.({}));
  window.history.pushState({}, '', '/products/art?variant=small#details');
  rerender(<GoogleAnalytics />);
  act(() => state.subscriptions.get('page_viewed')?.({}));
  expect(events()).toHaveLength(2);
  expect(events()?.[1]).toEqual([
    'event',
    'page_view',
    {
      page_path: '/products/art',
      page_location: window.location.origin + '/products/art',
      page_title: document.title,
    },
  ]);
  window.history.pushState({}, '', '/');
  state.pathname = '/';
  rerender(<GoogleAnalytics />);
  expect(events()).toHaveLength(3);
  expect(
    document.querySelectorAll('script[src*="googletagmanager.com"]'),
  ).toHaveLength(1);
});

it('waits for consent and suppresses ecommerce after consent is revoked', () => {
  state.consent = false;
  render(<GoogleAnalytics />);
  expect(browser.gtag).toBeUndefined();
  act(() =>
    state.subscriptions.get('product_viewed')?.({
      products: [{id: 'p1', title: 'Art', price: '89'}],
    }),
  );
  expect(browser.gtag).toBeUndefined();
  state.consent = true;
  act(() => document.dispatchEvent(new Event('visitorConsentCollected')));
  expect(
    browser.dataLayer?.filter((entry) => entry[1] === 'page_view'),
  ).toHaveLength(1);
  const count = browser.dataLayer?.length;
  state.consent = false;
  act(() =>
    state.subscriptions.get('product_viewed')?.({
      products: [{id: 'p1', title: 'Art', price: '89'}],
    }),
  );
  expect(browser.dataLayer).toHaveLength(count!);
});

it('retains inbound campaign attribution after consent without tracking arbitrary query values', () => {
  state.consent = false;
  state.pathname = '/products/art';
  window.history.replaceState(
    {},
    '',
    '/products/art?utm_source=pinterest&utm_medium=organic_social&utm_campaign=november&utm_content=art_pin&utm_id=6&utm_term=dark+art&Material=Metal&Size=16x12&email=private%40example.com#details',
  );
  const {rerender} = render(<GoogleAnalytics />);
  expect(browser.gtag).toBeUndefined();
  state.consent = true;
  act(() => document.dispatchEvent(new Event('visitorConsentCollected')));
  const views = () =>
    browser.dataLayer?.filter((entry) => entry[1] === 'page_view');
  expect(views()).toHaveLength(1);
  const payload = views()![0][2] as {page_path: string; page_location: string};
  expect(payload.page_path).toBe('/products/art');
  const location = new URL(payload.page_location);
  expect(Object.fromEntries(location.searchParams)).toEqual({
    utm_id: '6',
    utm_source: 'pinterest',
    utm_medium: 'organic_social',
    utm_campaign: 'november',
    utm_term: 'dark art',
    utm_content: 'art_pin',
  });
  expect(location.hash).toBe('');
  window.history.pushState({}, '', '/products/art?Material=Canvas&Size=24x18');
  rerender(<GoogleAnalytics />);
  act(() => state.subscriptions.get('page_viewed')?.({}));
  expect(views()).toHaveLength(1);
});

it('also requires Hydrogen tracking permission and a loaded privacy API', () => {
  state.canTrack = false;
  render(<GoogleAnalytics />);
  expect(browser.gtag).toBeUndefined();
  state.canTrack = true;
  Reflect.deleteProperty(browser, 'Shopify');
  act(() => document.dispatchEvent(new Event('visitorConsentCollected')));
  expect(browser.gtag).toBeUndefined();
});

it.each([undefined, 'invalid', 'G-ELCN4Z6M92'])(
  'keeps preview traffic out of production for ID %s',
  (id) => {
    state.environment = 'preview';
    render(<GoogleAnalytics previewMeasurementId={id} />);
    expect(browser.gtag).toBeUndefined();
  },
);

it('uses the separate preview ID only after consent', () => {
  state.environment = 'preview';
  render(<GoogleAnalytics previewMeasurementId="G-PREVIEW123" />);
  expect(browser.dataLayer?.map((entry) => Array.from(entry))).toContainEqual([
    'config',
    'G-PREVIEW123',
    {send_page_view: false},
  ]);
});

it('sends selected product values and only successful positive cart increases', () => {
  render(<GoogleAnalytics />);
  browser.gtag = vi.fn();
  act(() =>
    state.subscriptions.get('product_viewed')?.({
      shop: {currency: 'CAD'},
      products: [
        {
          id: 'p1',
          title: 'Art',
          variantId: 'v2',
          variantTitle: 'Large',
          price: '125.50',
        },
      ],
    }),
  );
  expect(browser.gtag).toHaveBeenCalledWith(
    'event',
    'view_item',
    expect.objectContaining({
      currency: 'CAD',
      value: 125.5,
      items: [
        expect.objectContaining({
          item_id: 'v2',
          item_variant: 'Large',
          price: 125.5,
        }),
      ],
    }),
  );
  const line = {
    quantity: 3,
    cost: {amountPerQuantity: {amount: '125.50', currencyCode: 'CAD'}},
    merchandise: {id: 'v2', title: 'Large', product: {title: 'Art'}},
  };
  act(() =>
    state.subscriptions.get('product_added_to_cart')?.({
      currentLine: line,
      prevLine: {...line, quantity: 1},
    }),
  );
  expect(browser.gtag).toHaveBeenLastCalledWith(
    'event',
    'add_to_cart',
    expect.objectContaining({
      currency: 'CAD',
      value: 251,
      items: [expect.objectContaining({quantity: 2})],
    }),
  );
  act(() =>
    state.subscriptions.get('product_added_to_cart')?.({
      errors: [{message: 'Failed'}],
    }),
  );
  act(() =>
    state.subscriptions.get('product_added_to_cart')?.({
      currentLine: line,
      prevLine: line,
    }),
  );
  expect(browser.gtag).toHaveBeenCalledTimes(2);
});
