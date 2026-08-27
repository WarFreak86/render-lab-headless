import {getSafeRedirect} from './redirect';

const REQUEST_URL = 'https://render-lab.org/cart';

describe('getSafeRedirect', () => {
  it('allows a normal root-relative application path', () => {
    expect(
      getSafeRedirect('/products/example', REQUEST_URL, '/cart'),
    ).toBe('/products/example');
  });

  it('preserves a query string on a root-relative path', () => {
    expect(getSafeRedirect('/search?q=skull', REQUEST_URL, '/cart')).toBe(
      '/search?q=skull',
    );
  });

  it('preserves a fragment on a root-relative path', () => {
    expect(
      getSafeRedirect('/products/example#details', REQUEST_URL, '/cart'),
    ).toBe('/products/example#details');
  });

  it('normalizes an absolute same-origin URL to an application path', () => {
    expect(
      getSafeRedirect(
        'https://render-lab.org/products/example?variant=123#details',
        REQUEST_URL,
        '/cart',
      ),
    ).toBe('/products/example?variant=123#details');
  });

  it.each([
    ['external HTTPS URL', 'https://evil.example'],
    ['external HTTP URL', 'http://evil.example'],
    ['protocol-relative URL', '//evil.example'],
    ['javascript URL', 'javascript:alert(1)'],
    ['data URL', 'data:text/html,<h1>unsafe</h1>'],
  ])('falls back for an %s', (_label, redirectTo) => {
    expect(getSafeRedirect(redirectTo, REQUEST_URL, '/cart')).toBe('/cart');
  });

  it.each([
    '\\\\evil.example',
    '/\\evil.example',
    'https:\\evil.example',
    '/%5Cevil.example',
  ])('falls back for backslash or protocol confusion: %s', (redirectTo) => {
    expect(getSafeRedirect(redirectTo, REQUEST_URL, '/cart')).toBe('/cart');
  });

  it.each(['http://[', '/products/%zz'])(
    'falls back for malformed input: %s',
    (redirectTo) => {
      expect(getSafeRedirect(redirectTo, REQUEST_URL, '/cart')).toBe('/cart');
    },
  );

  it.each([undefined, null])('falls back when redirectTo is missing', (value) => {
    expect(getSafeRedirect(value, REQUEST_URL, '/cart')).toBe('/cart');
  });

  it.each(['', '   '])('falls back when redirectTo is empty', (value) => {
    expect(getSafeRedirect(value, REQUEST_URL, '/cart')).toBe('/cart');
  });
});
