import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const readAppFile = (path: string) =>
  readFileSync(resolve(process.cwd(), 'app', path), 'utf8');

describe('route stylesheet ownership', () => {
  it('keeps the shared shell and cart drawer styled before route links', () => {
    const root = readAppFile('root.tsx');
    for (const stylesheet of [
      'reset.css',
      'tokens.css',
      'app.css',
      'navigation.css',
      'cart.css',
      'enhancements.css',
      'gallery-evolution.css',
      'mobile-commerce.css',
    ]) {
      expect(root).toContain(`~/styles/${stylesheet}?url`);
    }
    for (const routeOnly of [
      'home.css',
      'artists.css',
      'collection.css',
      'product.css',
      'drop.css',
      'enhancements-home.css',
      'gallery-home.css',
    ]) {
      expect(root).not.toContain(`~/styles/${routeOnly}?url`);
    }
    expect(root.indexOf('<Links />')).toBeGreaterThan(
      root.indexOf('href={cartStyles}'),
    );
    expect(root.indexOf('<Links />')).toBeLessThan(
      root.indexOf('href={enhancementStyles}'),
    );
    expect(root.indexOf('href={galleryStyles}')).toBeLessThan(
      root.indexOf('href={mobileCommerceStyles}'),
    );
  });

  it.each([
    ['routes/_index.tsx', ['home.css', 'enhancements-home.css', 'gallery-home.css']],
    ['routes/artists._index.tsx', ['artists.css']],
    ['routes/artists.$handle.tsx', ['artists.css']],
    ['routes/collections.all.tsx', ['collection.css', 'gallery-collection.css']],
    ['routes/collections.$handle.tsx', ['collection.css', 'gallery-collection.css']],
    ['routes/products.$handle.tsx', ['product.css', 'enhancements-product.css', 'gallery-product.css']],
    ['routes/drops.$handle.tsx', ['product.css', 'drop.css', 'enhancements-product.css', 'gallery-product.css']],
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
    expect(readAppFile('styles/enhancements.css')).toContain('.site-footer__rights');
    expect(readAppFile('styles/enhancements.css')).toContain('.button--text');
    expect(readAppFile('styles/gallery-evolution.css')).toContain('.site-header');
    expect(readAppFile('styles/gallery-evolution.css')).not.toContain('.product-detail');
  });
});
