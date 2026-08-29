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
  return new URL(pathname, PRODUCTION_ORIGIN).toString();
}
