const mocks = vi.hoisted(() => ({
  handleRequest: vi.fn(),
  createContext: vi.fn(),
}));

vi.mock('@shopify/hydrogen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shopify/hydrogen')>()),
  createRequestHandler: () => mocks.handleRequest,
}));
vi.mock('~/lib/context', () => ({
  createHydrogenRouterContext: mocks.createContext,
}));

import server from '../../server';
import {loader as productLoader} from '~/routes/products.$handle';

const OLD_PATH = '/products/firebird-rising-1977-pontiac-firebird-trans-am';
const NEW_PATH = '/products/firebird-rising-1972-pontiac-firebird-trans-am';
const ORIGIN = 'https://render-lab.org';

function setup() {
  const query = vi.fn().mockResolvedValue({
    urlRedirects: {edges: [{node: {target: NEW_PATH}}]},
  });
  const session = {isPending: false, commit: vi.fn()};
  mocks.createContext.mockResolvedValue({storefront: {query}, session});
  mocks.handleRequest.mockResolvedValue(
    new Response('Not found', {status: 404}),
  );
  return {query, session};
}

function fetchServer(path: string, init?: RequestInit, origin = ORIGIN) {
  return server.fetch(
    new Request(origin + path, init),
    {} as Env,
    {} as ExecutionContext,
  );
}

describe('direct requests through the server Shopify redirect handler', () => {
  beforeEach(() => vi.resetAllMocks());

  it('passes a missing product loader 404 to the real Hydrogen redirect helper', async () => {
    const {query} = setup();
    const productQuery = vi.fn().mockResolvedValue({product: null});
    const args = {
      context: {storefront: {query: productQuery, CacheShort: () => ({})}},
      params: {handle: OLD_PATH.split('/').at(-1)},
      request: new Request(ORIGIN + OLD_PATH),
    };
    const missing = await productLoader(args as never).catch(
      (error: unknown) => error,
    );
    expect(missing).toBeInstanceOf(Response);
    expect((missing as Response).status).toBe(404);
    // React Router turns the loader's thrown Response into the server response.
    mocks.handleRequest.mockResolvedValue(missing);

    const response = await fetchServer(OLD_PATH);

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(NEW_PATH);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('urlRedirects'),
      expect.objectContaining({variables: {query: `path:${OLD_PATH}`}}),
    );
  });

  it.each(['GET', 'HEAD'])(
    'returns a permanent redirect for a direct %s',
    async (method) => {
      setup();
      const response = await fetchServer(OLD_PATH, {method});
      expect(response.status).toBe(301);
      expect(response.headers.get('Location')).toBe(NEW_PATH);
    },
  );

  it('matches the path without options and preserves options on the destination', async () => {
    const {query} = setup();
    const response = await fetchServer(`${OLD_PATH}?Finish=Glossy&Size=12x18`);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `${NEW_PATH}?Finish=Glossy&Size=12x18`,
    );
    expect(query.mock.calls[0]?.[1].variables.query).toBe(`path:${OLD_PATH}`);
  });

  it('normalizes a trailing slash for Shopify path matching', async () => {
    const {query} = setup();
    const response = await fetchServer(`${OLD_PATH}/`);
    expect(response.status).toBe(301);
    expect(query.mock.calls[0]?.[1].variables.query).toBe(`path:${OLD_PATH}`);
  });

  it('uses Shopify-managed targets for other renamed products too', async () => {
    const {query} = setup();
    query.mockResolvedValue({
      urlRedirects: {edges: [{node: {target: '/products/new-art'}}]},
    });
    const response = await fetchServer('/products/old-art');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('/products/new-art');
  });

  it('keeps a genuine 404 when Shopify has no matching redirect', async () => {
    const {query} = setup();
    query.mockResolvedValue({urlRedirects: {edges: []}});
    const response = await fetchServer('/&');
    expect(response.status).toBe(404);
    expect(response.headers.has('Location')).toBe(false);
  });

  it('reports a redirect API failure and retains the original 404', async () => {
    const {query} = setup();
    query.mockRejectedValue(new Error('Access denied for urlRedirects field'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await fetchServer(OLD_PATH);
      expect(response.status).toBe(404);
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to fetch redirects from Storefront API',
        ),
        expect.any(Error),
      );
    } finally {
      log.mockRestore();
    }
  });

  it.each([
    {path: NEW_PATH, method: 'GET', status: 200, location: undefined},
    {path: '/cart', method: 'GET', status: 200, location: undefined},
    {path: '/cart', method: 'POST', status: 303, location: '/cart'},
  ])(
    'preserves $method $path ($status) without a redirect lookup',
    async ({path, method, status, location}) => {
      const {query, session} = setup();
      session.isPending = true;
      session.commit.mockResolvedValue('session=example; HttpOnly; Secure');
      const routed = new Response('Existing response', {
        status,
        headers: location ? {Location: location} : {},
      });
      mocks.handleRequest.mockResolvedValue(routed);
      const response = await fetchServer(path, {method});
      expect(response).toBe(routed);
      expect(response.status).toBe(status);
      expect(response.headers.get('Location')).toBe(location ?? null);
      expect(response.headers.get('Set-Cookie')).toBe(
        'session=example; HttpOnly; Secure',
      );
      expect(query).not.toHaveBeenCalled();
    },
  );

  it('keeps preview redirects noindexed', async () => {
    setup();
    const response = await fetchServer(
      OLD_PATH,
      {},
      'https://preview.example.com',
    );
    expect(response.status).toBe(301);
    expect(response.headers.get('X-Robots-Tag')).toBe(
      'noindex, nofollow, noarchive',
    );
  });
});
