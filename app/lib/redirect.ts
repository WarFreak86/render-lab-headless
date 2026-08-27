import {redirect} from 'react-router';

const DEFAULT_REDIRECT_FALLBACK = '/';
const BACKSLASH_CONFUSION = /\\|%5c/iu;

function containsControlCharacter(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
}

function normalizeFallback(fallback: string) {
  if (
    !fallback.startsWith('/') ||
    fallback.startsWith('//') ||
    containsControlCharacter(fallback) ||
    BACKSLASH_CONFUSION.test(fallback)
  ) {
    return DEFAULT_REDIRECT_FALLBACK;
  }

  try {
    decodeURI(fallback);
    const url = new URL(fallback, 'https://render-lab.invalid');
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_REDIRECT_FALLBACK;
  }
}

/**
 * Converts an untrusted redirect value into a same-origin application path.
 * Root-relative paths and absolute URLs matching the current request origin
 * are supported. Unsafe or malformed values resolve to the supplied fallback.
 */
export function getSafeRedirect(
  redirectTo: unknown,
  requestUrl: string | URL,
  fallback = DEFAULT_REDIRECT_FALLBACK,
) {
  const safeFallback = normalizeFallback(fallback);

  if (typeof redirectTo !== 'string') return safeFallback;

  const candidate = redirectTo.trim();
  if (
    !candidate ||
    containsControlCharacter(candidate) ||
    BACKSLASH_CONFUSION.test(candidate)
  ) {
    return safeFallback;
  }

  let requestOrigin: string;
  try {
    const request = new URL(requestUrl);
    if (request.protocol !== 'http:' && request.protocol !== 'https:') {
      return safeFallback;
    }
    requestOrigin = request.origin;
  } catch {
    return safeFallback;
  }

  let destination: URL;
  try {
    decodeURI(candidate);

    if (candidate.startsWith('//')) return safeFallback;
    destination = candidate.startsWith('/')
      ? new URL(candidate, requestOrigin)
      : new URL(candidate);
  } catch {
    return safeFallback;
  }

  if (
    (destination.protocol !== 'http:' && destination.protocol !== 'https:') ||
    destination.origin !== requestOrigin ||
    destination.username ||
    destination.password
  ) {
    return safeFallback;
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function redirectIfHandleIsLocalized(
  request: Request,
  ...localizedResources: Array<{
    handle: string;
    data: {handle: string} & unknown;
  }>
) {
  const url = new URL(request.url);
  let shouldRedirect = false;

  localizedResources.forEach(({handle, data}) => {
    if (handle !== data.handle) {
      url.pathname = url.pathname.replace(handle, data.handle);
      shouldRedirect = true;
    }
  });

  if (shouldRedirect) {
    throw redirect(url.toString());
  }
}
