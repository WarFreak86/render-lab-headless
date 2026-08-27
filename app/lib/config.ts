export const SITE_NAME = 'Render-Lab';
export const PRODUCTION_ORIGIN = 'https://render-lab.org';
// Verified against the checkout URL returned by Shopify's Cart API.
export const SHOPIFY_CHECKOUT_DOMAIN = 'render-lab-3.myshopify.com';

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
