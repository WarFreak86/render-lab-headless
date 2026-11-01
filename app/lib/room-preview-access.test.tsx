import {render, screen} from '@testing-library/react';
import {CacheNone} from '@shopify/hydrogen';
import fixture from '../../prototypes/room-preview/fixtures/live-product.json';
import {
  guardRoomPreview,
  isRoomPreviewEnabled,
  type RoomPreviewStagingConfig,
} from './room-preview-access.server';
import {isRoomPreviewPath, ROOM_PREVIEW_HEADERS} from './room-preview-access';
import {loadRoomCatalog} from './room-preview.server';
import {loader as roomLoader} from '~/routes/lab.room-preview';
import {loader as productLoader} from '~/routes/products.$handle';
import {CatalogPreview} from '~/components/room-preview/RoomPreview';
import server from '../../server';

const stagingHost = 'reviewer-test.oxygen.shop';
const enabled = {
  ROOM_PREVIEW_STAGING_ENABLED: 'true',
  ROOM_PREVIEW_STAGING_HOST: stagingHost,
};
const stagingUrl = `https://${stagingHost}`;
const suffixes = ['', '/', '.data', '/.data'];

afterEach(() => vi.unstubAllEnvs());

it('authorizes only explicitly enabled HTTPS requests to the exact approved host', () => {
  for (const suffix of suffixes) {
    const request = new Request(`${stagingUrl}/lab/room-preview${suffix}`);
    expect(isRoomPreviewEnabled(request.url, false, enabled)).toBe(true);
    expect(() => guardRoomPreview(request, false, enabled)).not.toThrow();
  }
  for (const url of [
    `http://${stagingHost}`,
    `https://${stagingHost}:444`,
    `https://other.oxygen.shop`,
    `https://sub.${stagingHost}`,
    `https://${stagingHost}.evil.example`,
  ]) {
    expect(
      isRoomPreviewEnabled(`${url}/lab/room-preview`, false, enabled),
    ).toBe(false);
  }
});

it.each([undefined, '', 'false', 'TRUE', '1', 'true ', true, 1])(
  'fails closed for missing or invalid enablement %s',
  (value) => {
    const config = {
      ...enabled,
      ROOM_PREVIEW_STAGING_ENABLED: value,
    } as RoomPreviewStagingConfig;
    expect(isRoomPreviewEnabled(stagingUrl, false, config)).toBe(false);
  },
);

it.each([
  undefined,
  null,
  '',
  'https://reviewer-test.oxygen.shop',
  '*.oxygen.shop',
  '.oxygen.shop',
  'reviewer-test.oxygen.shop.',
  'REVIEWER-TEST.oxygen.shop',
  'reviewer-test.oxygen.shop/path',
  'reviewer-test.oxygen.shop:443',
  'reviewer-test.oxygen.shop?enabled=true',
  'reviewer-test.oxygen.shop#fragment',
  'user@reviewer-test.oxygen.shop',
  ' reviewer-test.oxygen.shop',
  'localhost',
  'test.localhost',
  '127.0.0.1',
  '[::1]',
  'bad_label.oxygen.shop',
  `${'a'.repeat(64)}.oxygen.shop`,
  123,
])('fails closed for missing or malformed approved host %s', (value) => {
  const config = {
    ...enabled,
    ROOM_PREVIEW_STAGING_HOST: value,
  } as RoomPreviewStagingConfig;
  expect(isRoomPreviewEnabled(stagingUrl, false, config)).toBe(false);
});

it.each([
  'render-lab.org',
  'www.render-lab.org',
  'checkout.render-lab.org',
  'stage.render-lab.org',
  'RENDER-LAB.ORG',
  'render-lab.org.',
  'www.render-lab.org.',
  'kn0xfa-4t.myshopify.com',
])(
  'always denies production/commerce host %s even when configured as staging',
  async (host) => {
    vi.stubEnv('DEV', true);
    for (const suffix of suffixes) {
      for (const method of ['GET', 'HEAD', 'POST']) {
        const request = new Request(
          `https://${host}/lab/room-preview${suffix}`,
          {method},
        );
        const response = await server.fetch(
          request,
          {...enabled, ROOM_PREVIEW_STAGING_HOST: host} as Env,
          {} as never,
        );
        expect(response.status).toBe(404);
        for (const [name, value] of Object.entries(ROOM_PREVIEW_HEADERS))
          expect(response.headers.get(name)).toBe(value);
      }
    }
  },
);

it('guards encoded/case-variant page and data paths before context or credentials are read', async () => {
  const credentialRead = vi.fn(() => {
    throw new Error('Credential read before access denial');
  });
  const env = Object.defineProperty({...enabled}, 'SESSION_SECRET', {
    get: credentialRead,
  }) as Env;
  for (const path of [
    '/LAB/ROOM-PREVIEW',
    '/lab/room%2Dpreview',
    '/lab/room-preview.data',
    '/lab/room-preview/.data',
    '/lab/room-preview?variant=123',
  ]) {
    expect(
      isRoomPreviewPath(new URL(`https://render-lab.org${path}`).pathname),
    ).toBe(true);
    const response = await server.fetch(
      new Request(`https://render-lab.org${path}`),
      env,
      {} as never,
    );
    expect(response.status).toBe(404);
  }
  expect(credentialRead).not.toHaveBeenCalled();
  expect(isRoomPreviewPath('/lab/room-preview-other')).toBe(false);
  expect(isRoomPreviewPath('/lab/room%xxpreview')).toBe(false);
});

it('does not trust browser parameters or forwarding headers to enable staging', async () => {
  const request = new Request(
    'https://render-lab.org/lab/room-preview?ROOM_PREVIEW_STAGING_ENABLED=true',
    {
      headers: {
        'X-Forwarded-Host': stagingHost,
        'X-Forwarded-Proto': 'https',
        Origin: stagingUrl,
      },
    },
  );
  expect(
    (await server.fetch(request, enabled as Env, {} as never)).status,
  ).toBe(404);
  expect(
    isRoomPreviewEnabled(
      `${stagingUrl}?ROOM_PREVIEW_STAGING_ENABLED=true`,
      false,
    ),
  ).toBe(false);
});

it('preserves localhost development without permitting built localhost staging', () => {
  for (const host of ['localhost:4321', '127.0.0.1:4321', '[::1]:4321']) {
    expect(isRoomPreviewEnabled(`http://${host}/lab/room-preview`, true)).toBe(
      true,
    );
    expect(
      isRoomPreviewEnabled(`http://${host}/lab/room-preview`, false, enabled),
    ).toBe(false);
  }
  expect(isRoomPreviewEnabled('invalid request URL', true, enabled)).toBe(
    false,
  );
});

it('denies methods that could mutate commerce on staging before context creation', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const response = await server.fetch(
      new Request(`${stagingUrl}/lab/room-preview.data`, {method}),
      enabled as Env,
      {} as never,
    );
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET, HEAD');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  }
  expect(() =>
    guardRoomPreview(
      new Request(`${stagingUrl}/lab/room-preview`, {method: 'HEAD'}),
      false,
      enabled,
    ),
  ).not.toThrow();
});

it('does not query Shopify when staging is disabled, absent, or assigned to another host', async () => {
  const query = vi.fn();
  for (const config of [
    {},
    {...enabled, ROOM_PREVIEW_STAGING_ENABLED: 'false'},
    {...enabled, ROOM_PREVIEW_STAGING_HOST: 'other.oxygen.shop'},
  ]) {
    await expect(
      loadRoomCatalog(
        new Request(`${stagingUrl}/lab/room-preview`),
        {query, CacheNone} as never,
        false,
        config,
      ),
    ).rejects.toMatchObject({status: 404});
  }
  expect(query).not.toHaveBeenCalled();
});

it('enables the production-built staging loaders without serializing config or secrets or enabling preview purchases', async () => {
  vi.stubEnv('DEV', false);
  const query = vi.fn().mockResolvedValue({product: fixture.product});
  const secret = 'PRIVATE_TEST_SENTINEL_DO_NOT_SERIALIZE';
  const env = {
    ...enabled,
    PRIVATE_STOREFRONT_API_TOKEN: secret,
    SESSION_SECRET: secret,
  };
  const context = {env, storefront: {query, CacheNone, CacheShort: vi.fn()}};
  for (const suffix of ['', '.data']) {
    const result = await roomLoader({
      request: new Request(
        `${stagingUrl}/lab/room-preview${suffix}?product=the-sky-unbound&variant=48060467052705`,
      ),
      context,
    } as never);
    expect(result.data.initialVariantId).toBe(
      'gid://shopify/ProductVariant/48060467052705',
    );
    const headers = new Headers(result.init?.headers);
    for (const [name, value] of Object.entries(ROOM_PREVIEW_HEADERS))
      expect(headers.get(name)).toBe(value);
    const serialized = JSON.stringify(result.data);
    for (const privateValue of [
      secret,
      stagingHost,
      'ROOM_PREVIEW_STAGING_ENABLED',
      'ROOM_PREVIEW_STAGING_HOST',
    ])
      expect(serialized).not.toContain(privateValue);
  }
  const product = await productLoader({
    request: new Request(`${stagingUrl}/products/the-sky-unbound`),
    params: {handle: 'the-sky-unbound'},
    context,
  } as never);
  expect(product.roomPreviewEnabled).toBe(true);
  expect(JSON.stringify(product)).not.toContain(secret);
  expect(JSON.stringify(product)).not.toContain('ROOM_PREVIEW_STAGING_ENABLED');
  const preview = await roomLoader({
    request: new Request(`${stagingUrl}/lab/room-preview`),
    context,
  } as never);
  render(
    <CatalogPreview
      catalog={preview.data.catalog}
      initialVariantId={preview.data.initialVariantId}
    />,
  );
  expect(screen.getByRole('button', {name: /Add to cart/})).toBeDisabled();
  expect(screen.queryByText('Private preview')).not.toBeInTheDocument();
  for (const host of [
    'render-lab.org',
    'www.render-lab.org',
    'other.oxygen.shop',
  ]) {
    const result = await productLoader({
      request: new Request(`https://${host}/products/the-sky-unbound`),
      params: {handle: 'the-sky-unbound'},
      context,
    } as never);
    expect(result.roomPreviewEnabled).toBe(false);
  }
});
