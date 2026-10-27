import {createRequestHandler, type ServerBuild} from 'react-router';
import config from '../../react-router.config';

function build(mode: 'initial' | 'lazy'): ServerBuild {
  return {
    entry: {
      module: {
        default: (_request, status) =>
          new Response('Document response', {status}),
        handleError: () => {},
      },
    },
    routes: {
      root: {id: 'root', path: '', module: {default: () => null}},
      product: {
        id: 'product',
        parentId: 'root',
        path: 'products/:handle',
        module: {default: () => null},
      },
    },
    assets: {
      version: 'security-test',
      url: '/assets/manifest.js',
      entry: {module: '/assets/entry.js', imports: []},
      routes: {},
    },
    basename: '/',
    publicPath: '/assets/',
    assetsBuildDirectory: 'dist/client',
    future: {
      v8_middleware: false,
      v8_passThroughRequests: false,
      v8_trailingSlashAwareDataRequests: false,
    },
    ssr: true,
    isSpaMode: false,
    prerender: [],
    routeDiscovery: {mode, manifestPath: '/__manifest'},
  };
}

describe('route discovery security mitigation', () => {
  it('bypasses the manifest handler instead of matching attacker-supplied path lists', async () => {
    const url =
      'https://render-lab.org/__manifest?version=security-test&paths=/products/example';
    // Control: the same benign request reaches the lazy manifest handler.
    const lazy = await createRequestHandler(
      build('lazy'),
      'production',
    )(new Request(url));
    expect(lazy.status).toBe(200);
    expect(lazy.headers.get('Content-Type')).toContain('application/json');

    const initial = await createRequestHandler(
      build(config.routeDiscovery.mode),
      'production',
    )(new Request(url));
    expect(initial.status).toBe(404);
    expect(await initial.text()).toBe('Document response');
  });

  it('retains document routing for product deep links', async () => {
    const response = await createRequestHandler(
      build(config.routeDiscovery.mode),
      'production',
    )(new Request('https://render-lab.org/products/example?Size=12x18'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Document response');
  });
});
