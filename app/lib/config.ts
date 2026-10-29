export const SITE_NAME = 'Render-Lab';
export const PRODUCTION_ORIGIN = 'https://render-lab.org';
// Fallback for preview/local environments when PUBLIC_CHECKOUT_DOMAIN is unavailable.
// Production should use the matching Oxygen variable with this same host.
export const SHOPIFY_CHECKOUT_DOMAIN = 'checkout.render-lab.org';

export type StorefrontEnvironment = 'local' | 'preview' | 'production';

export function getStorefrontEnvironment(url: string): StorefrontEnvironment {
  const hostname = new URL(url).hostname;

  if (hostname === 'render-lab.org' || hostname === 'www.render-lab.org') {
    return 'production';
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }

  return 'preview';
}

export function getProductionUrl(pathname = '/') {
  const url = new URL(pathname, PRODUCTION_ORIGIN);
  return new URL(
    url.pathname + url.search + url.hash,
    PRODUCTION_ORIGIN,
  ).toString();
}

// Navigation only: never apply this to cart.checkoutUrl or customer-account auth.
export function normalizeStorefrontLink(value: string) {
  const url = new URL(value, PRODUCTION_ORIGIN);
  const internalHosts = new Set([
    'render-lab.org',
    'www.render-lab.org',
    SHOPIFY_CHECKOUT_DOMAIN,
    'kn0xfa-4t.myshopify.com',
  ]);
  return internalHosts.has(url.hostname)
    ? url.pathname + url.search + url.hash
    : value;
}
