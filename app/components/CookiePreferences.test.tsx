import {act, fireEvent, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CookiePreferences} from './CookiePreferences';
import {GoogleAnalytics} from './GoogleAnalytics';

const state = vi.hoisted(() => ({
  loaded: true,
  region: false,
  fail: false,
  unconfirmed: false,
  hold: false,
  explicit: {
    analytics: '',
    marketing: '',
    preferences: '',
    sale_of_data: '',
  } as Record<string, string>,
  subscriptions: new Map<string, (data: unknown) => void>(),
  save: vi.fn(),
  showPreferences: vi.fn(),
}));
const api = {
  currentVisitorConsent: () => ({...state.explicit}),
  analyticsProcessingAllowed: () => state.explicit.analytics !== 'no',
  marketingAllowed: () => state.explicit.marketing !== 'no',
  preferencesProcessingAllowed: () => state.explicit.preferences !== 'no',
  saleOfDataAllowed: () => state.explicit.sale_of_data !== 'no',
  saleOfDataRegion: () => state.region,
  setTrackingConsent: state.save,
};
vi.mock('@shopify/hydrogen', () => ({
  useAnalytics: () => ({
    customerPrivacy: state.loaded ? api : null,
    // Reproduces initialized SDK + disabled banner: showPreferences renders nothing.
    privacyBanner: {showPreferences: state.showPreferences},
    canTrack: api.analyticsProcessingAllowed,
    register: () => ({ready: vi.fn()}),
    subscribe: (name: string, callback: (data: unknown) => void) =>
      state.subscriptions.set(name, callback),
  }),
  useNonce: () => 'test',
}));
vi.mock('react-router', () => ({useLocation: () => ({pathname: '/'})}));
vi.mock('~/lib/config', () => ({getStorefrontEnvironment: () => 'preview'}));

beforeEach(() => {
  state.loaded = true;
  state.region = false;
  state.fail = false;
  state.unconfirmed = false;
  state.hold = false;
  state.explicit = {
    analytics: '',
    marketing: '',
    preferences: '',
    sale_of_data: '',
  };
  state.subscriptions.clear();
  state.showPreferences.mockClear();
  state.save
    .mockReset()
    .mockImplementation(
      (
        update: Record<string, boolean>,
        callback: (result?: {error: string}) => void,
      ) => {
        if (state.hold) return;
        if (state.fail) {
          callback({error: 'Network failure'});
          return;
        }
        if (!state.unconfirmed) {
          for (const [key, value] of Object.entries(update))
            state.explicit[key] = value ? 'yes' : 'no';
          document.dispatchEvent(new Event('visitorConsentCollected'));
        }
        callback();
      },
    );
  Object.defineProperty(window, 'Shopify', {
    configurable: true,
    value: {customerPrivacy: api},
  });
});
afterEach(() => {
  Reflect.deleteProperty(window, 'Shopify');
  for (const key of ['gtag', 'dataLayer', '__renderLabGA4ConfiguredId'])
    Reflect.deleteProperty(window, key);
  Reflect.deleteProperty(navigator, 'globalPrivacyControl');
  document
    .querySelectorAll('script[src*="googletagmanager"]')
    .forEach((s) => s.remove());
  vi.useRealTimers();
});

it.each(['click', 'Enter', 'Space'])(
  'opens with %s when Shopify banner is disabled',
  async (action) => {
    const user = userEvent.setup();
    render(<CookiePreferences />);
    const button = screen.getByRole('button', {name: 'Cookie preferences'});
    if (action === 'click') await user.click(button);
    else {
      await user.tab();
      await user.keyboard(action === 'Enter' ? '{Enter}' : ' ');
    }
    expect(
      screen.getByRole('dialog', {name: 'Cookie preferences'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Close'})).toHaveFocus();
    expect(state.showPreferences).not.toHaveBeenCalled();
    expect(state.save).not.toHaveBeenCalled();
  },
);

it('keeps no decision distinct from effective permission and saves only edited purposes', async () => {
  const user = userEvent.setup();
  render(<CookiePreferences />);
  await user.click(screen.getByRole('button', {name: 'Cookie preferences'}));
  expect(screen.getByRole('combobox', {name: 'Analytics'})).toHaveValue('');
  expect(
    screen.getAllByText(
      /Last confirmed: No decision recorded. Currently allowed/,
    ),
  ).toHaveLength(3);
  await user.click(screen.getByRole('button', {name: 'Save choices'}));
  expect(state.save).not.toHaveBeenCalled();
  await user.selectOptions(
    screen.getByRole('combobox', {name: 'Analytics'}),
    'no',
  );
  await user.click(screen.getByRole('button', {name: 'Save choices'}));
  expect(state.save).toHaveBeenCalledExactlyOnceWith(
    {analytics: false},
    expect.any(Function),
  );
  expect(state.explicit).toMatchObject({
    analytics: 'no',
    marketing: '',
    preferences: '',
  });
  expect(
    screen.getByText(/Your privacy choices have been saved/),
  ).toBeInTheDocument();
});

it('accepts/declines optional cookies without changing sale/sharing, then reopens saved choices', async () => {
  const user = userEvent.setup();
  state.explicit.sale_of_data = 'no';
  render(<CookiePreferences />);
  const opener = screen.getByRole('button', {name: 'Cookie preferences'});
  await user.click(opener);
  await user.click(
    screen.getByRole('button', {name: 'Accept optional cookies'}),
  );
  expect(state.save).toHaveBeenLastCalledWith(
    {analytics: true, marketing: true, preferences: true},
    expect.any(Function),
  );
  await user.keyboard('{Escape}');
  expect(opener).toHaveFocus();
  await user.click(opener);
  expect(screen.getByRole('combobox', {name: 'Marketing'})).toHaveValue('yes');
  await user.click(
    screen.getByRole('button', {name: 'Decline optional cookies'}),
  );
  expect(state.save).toHaveBeenLastCalledWith(
    {analytics: false, marketing: false, preferences: false},
    expect.any(Function),
  );
  expect(state.explicit.sale_of_data).toBe('no');
});

it('shows loading and initializes the already-open dialog when the real API arrives', async () => {
  const user = userEvent.setup();
  state.loaded = false;
  const {rerender} = render(<CookiePreferences />);
  await user.click(screen.getByRole('button', {name: 'Cookie preferences'}));
  expect(screen.getByText(/privacy controls are loading/)).toBeInTheDocument();
  expect(
    screen.queryByRole('button', {name: 'Save choices'}),
  ).not.toBeInTheDocument();
  state.loaded = true;
  rerender(<CookiePreferences />);
  expect(screen.getByRole('combobox', {name: 'Analytics'})).toHaveValue('');
});

it.each(['fail', 'unconfirmed'])(
  'reports %s without changing confirmed choices or claiming success',
  async (mode) => {
    const user = userEvent.setup();
    state[mode as 'fail' | 'unconfirmed'] = true;
    render(<CookiePreferences />);
    await user.click(screen.getByRole('button', {name: 'Cookie preferences'}));
    await user.selectOptions(
      screen.getByRole('combobox', {name: 'Analytics'}),
      'no',
    );
    await user.click(screen.getByRole('button', {name: 'Save choices'}));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'could not be confirmed',
    );
    expect(
      screen.getAllByText(
        /Last confirmed: No decision recorded. Currently allowed/,
      ),
    ).toHaveLength(3);
    expect(
      screen.queryByText('Your privacy choices have been saved.'),
    ).not.toBeInTheDocument();
  },
);

it('preserves GPC and saves sale/sharing opt-out independently in an eligible region', async () => {
  const user = userEvent.setup();
  state.region = true;
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    configurable: true,
    value: true,
  });
  render(<CookiePreferences />);
  await user.click(screen.getByRole('button', {name: 'Cookie preferences'}));
  expect(
    screen.getByText(/We do not override that signal/),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', {name: 'Do not sell or share my data'}),
  );
  expect(state.save).toHaveBeenCalledExactlyOnceWith(
    {sale_of_data: false},
    expect.any(Function),
  );
  expect(state.explicit.analytics).toBe('');
  expect(
    screen.getByRole('button', {name: 'Do not sell or share my data'}),
  ).toBeDisabled();
});

it('does not offer a sale/sharing opt-in or an inapplicable regional opt-out', async () => {
  const user = userEvent.setup();
  render(<CookiePreferences />);
  await user.click(screen.getByRole('button', {name: 'Cookie preferences'}));
  expect(
    screen.queryByRole('region', {name: 'Data sale and sharing'}),
  ).not.toBeInTheDocument();
});

it('traps focus, cancels unsaved edits, and restores the opener on close', async () => {
  const user = userEvent.setup();
  render(<CookiePreferences />);
  const button = screen.getByRole('button', {name: 'Cookie preferences'});
  await user.click(button);
  await user.tab({shift: true});
  expect(
    screen.getByRole('link', {name: 'Read the privacy policy'}),
  ).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', {name: 'Close'})).toHaveFocus();
  await user.selectOptions(
    screen.getByRole('combobox', {name: 'Marketing'}),
    'yes',
  );
  await user.keyboard('{Escape}');
  expect(button).toHaveFocus();
  await user.click(button);
  expect(screen.getByRole('combobox', {name: 'Marketing'})).toHaveValue('');
  expect(state.save).not.toHaveBeenCalled();
});

it('prevents duplicate writes, reports a missing callback, and allows retry', async () => {
  vi.useFakeTimers();
  state.hold = true;
  render(<CookiePreferences />);
  fireEvent.click(screen.getByRole('button', {name: 'Cookie preferences'}));
  fireEvent.click(
    screen.getByRole('button', {name: 'Decline optional cookies'}),
  );
  fireEvent.click(
    screen.getByRole('button', {name: 'Decline optional cookies'}),
  );
  expect(state.save).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(screen.getByRole('alert')).toBeInTheDocument();
  state.hold = false;
  fireEvent.click(
    screen.getByRole('button', {name: 'Decline optional cookies'}),
  );
  expect(state.save).toHaveBeenCalledTimes(2);
  expect(
    screen.getByText('Your privacy choices have been saved.'),
  ).toBeInTheDocument();
});

it('does not invent no-decision defaults for an invalid SDK response', async () => {
  const user = userEvent.setup();
  state.explicit.analytics = 'unexpected';
  render(<CookiePreferences />);
  await user.click(screen.getByRole('button', {name: 'Cookie preferences'}));
  expect(screen.getByRole('alert')).toHaveTextContent('could not be read');
  expect(
    screen.queryByRole('combobox', {name: 'Analytics'}),
  ).not.toBeInTheDocument();
});

it('refreshes early SDK values when Hydrogen completes privacy initialization', async () => {
  const user = userEvent.setup();
  render(<CookiePreferences />);
  await user.click(screen.getByRole('button', {name: 'Cookie preferences'}));
  state.explicit.analytics = 'no';
  act(() =>
    document.dispatchEvent(new Event('shopifyCustomerPrivacyApiLoaded')),
  );
  expect(screen.getByRole('combobox', {name: 'Analytics'})).toHaveValue('no');
  expect(state.save).not.toHaveBeenCalled();
});

it('integrates consent saves with GA4 gating without duplicate page views or revoked ecommerce', async () => {
  const user = userEvent.setup();
  state.explicit.analytics = 'no';
  render(
    <>
      <GoogleAnalytics previewMeasurementId="G-Z6F7CDBJNQ" />
      <CookiePreferences />
    </>,
  );
  const browser = window as Window & {dataLayer?: ArrayLike<unknown>[]};
  expect(browser.dataLayer).toBeUndefined();
  await user.click(screen.getByRole('button', {name: 'Cookie preferences'}));
  await user.selectOptions(
    screen.getByRole('combobox', {name: 'Analytics'}),
    'yes',
  );
  await user.click(screen.getByRole('button', {name: 'Save choices'}));
  expect(browser.dataLayer?.filter((e) => e[1] === 'page_view')).toHaveLength(
    1,
  );
  await user.click(screen.getByRole('button', {name: 'Save choices'}));
  expect(browser.dataLayer?.filter((e) => e[1] === 'page_view')).toHaveLength(
    1,
  );
  await user.click(
    screen.getByRole('button', {name: 'Decline optional cookies'}),
  );
  const count = browser.dataLayer?.length;
  act(() =>
    state.subscriptions.get('product_viewed')?.({
      products: [{id: 'p1', title: 'Art', price: '79'}],
    }),
  );
  expect(browser.dataLayer).toHaveLength(count!);
  const dialog = screen.getByRole('dialog', {name: 'Cookie preferences'});
  expect(within(dialog).getByRole('combobox', {name: 'Analytics'})).toHaveValue(
    'no',
  );
});
