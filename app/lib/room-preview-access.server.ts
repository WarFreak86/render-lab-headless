import {ROOM_PREVIEW_HEADERS} from './room-preview-access';

export interface RoomPreviewStagingConfig {
  ROOM_PREVIEW_STAGING_ENABLED?: string;
  ROOM_PREVIEW_STAGING_HOST?: string;
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function isProductionHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.+$/, '');
  return (
    host === 'render-lab.org' ||
    host.endsWith('.render-lab.org') ||
    host === 'kn0xfa-4t.myshopify.com'
  );
}

function isApprovedHostConfiguration(host: unknown): host is string {
  if (typeof host !== 'string' || host.length > 253 || isProductionHost(host))
    return false;
  const labels = host.split('.');
  return (
    labels.length >= 2 &&
    /[a-z]/.test(labels.at(-1)!) &&
    !host.endsWith('.localhost') &&
    labels.every((label) =>
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
    )
  );
}

export function isLocalRoomPreview(value: string, development: boolean) {
  const url = parseUrl(value);
  return Boolean(
    development &&
    url &&
    ['http:', 'https:'].includes(url.protocol) &&
    !url.username &&
    !url.password &&
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
  );
}

// This controls feature availability, not reviewer authentication. Oxygen privacy
// must be configured and verified independently. Never serialize these bindings.
export function isRoomPreviewEnabled(
  value: string,
  development: boolean,
  config: RoomPreviewStagingConfig = {},
) {
  const url = parseUrl(value);
  if (!url || isProductionHost(url.hostname)) return false;
  if (isLocalRoomPreview(value, development)) return true;
  return (
    config.ROOM_PREVIEW_STAGING_ENABLED === 'true' &&
    isApprovedHostConfiguration(config.ROOM_PREVIEW_STAGING_HOST) &&
    url.protocol === 'https:' &&
    !url.port &&
    !url.username &&
    !url.password &&
    url.hostname === config.ROOM_PREVIEW_STAGING_HOST
  );
}

export function guardRoomPreview(
  request: Request,
  development: boolean,
  config: RoomPreviewStagingConfig = {},
) {
  if (!isRoomPreviewEnabled(request.url, development, config)) {
    throw new Response('Not found', {
      status: 404,
      headers: ROOM_PREVIEW_HEADERS,
    });
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    throw new Response('Method not allowed', {
      status: 405,
      headers: {...ROOM_PREVIEW_HEADERS, Allow: 'GET, HEAD'},
    });
  }
}
