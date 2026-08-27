import {getStorefrontEnvironment} from '~/lib/config';
import {PREVIEW_ROBOTS_DIRECTIVE} from '~/lib/seo';

export const SECURITY_HEADERS = {
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(self)',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

export function applySecurityHeaders(headers: Headers, requestUrl?: string) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  if (
    requestUrl &&
    getStorefrontEnvironment(requestUrl) !== 'production'
  ) {
    headers.set('X-Robots-Tag', PREVIEW_ROBOTS_DIRECTIVE);
  }
  return headers;
}
