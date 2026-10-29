import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const readAppFile = (path: string) =>
  readFileSync(resolve(process.cwd(), 'app', path), 'utf8');

describe('route stylesheet ownership', () => {
  it('bundles global and homepage styles while keeping the base below route CSS', () => {
    const root = readAppFile('root.tsx');
    const global = readAppFile('styles/root-bundle.css');
    const home = readAppFile('styles/home-bundle.css');
    expect(root).toContain('~/styles/root-bundle.css?url');
    expect(root.indexOf('<Links />')).toBeLessThan(
      root.indexOf('href={rootStyles}'),
    );
    expect(global).toContain("'./cart.css' layer(storefront-base)");
    expect(global.indexOf('gallery-evolution.css')).toBeLessThan(
      global.indexOf('mobile-commerce.css'),
    );
    expect(home).toContain("@import './home-v2.css'");
    expect(global).not.toContain('home-v2.css');
  });

  it.each([
    ['routes/_index.tsx', ['home-bundle.css']],
    ['routes/artists._index.tsx', ['artists.css']],
    ['routes/artists.$handle.tsx', ['artists.css']],
    [
      'routes/collections.$handle.tsx',
      ['collection.css', 'gallery-collection.css'],
    ],
    [
      'routes/products.$handle.tsx',
      ['product.css', 'enhancements-product.css', 'gallery-product.css'],
    ],
    ['routes/materials.tsx', ['gallery-materials.css']],
    ['routes/legal.rights-notice.tsx', ['enhancements-legal.css']],
  ])('%s links its required page styles', (route, stylesheets) => {
    const source = readAppFile(route);
    expect(source).toContain('export const links');
    for (const stylesheet of stylesheets) {
      expect(source).toContain(`~/styles/${stylesheet}?url`);
    }
  });

  it('keeps footer, global controls, and header overrides in shared CSS', () => {
    expect(readAppFile('styles/enhancements.css')).toContain(
      '.site-footer__rights',
    );
    expect(readAppFile('styles/enhancements.css')).toContain('.button--text');
    expect(readAppFile('styles/gallery-evolution.css')).toContain(
      '.site-header',
    );
    expect(readAppFile('styles/gallery-evolution.css')).not.toContain(
      '.product-detail',
    );
  });
});
