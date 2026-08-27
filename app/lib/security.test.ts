import {applySecurityHeaders, SECURITY_HEADERS} from '~/lib/security';

describe('security headers', () => {
  it('adds launch-safe defaults without overwriting upstream values', () => {
    const headers = new Headers({'Referrer-Policy': 'no-referrer'});
    applySecurityHeaders(headers);
    expect(headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(headers.get('X-Content-Type-Options')).toBe(
      SECURITY_HEADERS['X-Content-Type-Options'],
    );
    expect(headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('adds an indexing guard outside production only', () => {
    const preview = applySecurityHeaders(
      new Headers({'X-Robots-Tag': 'none'}),
      'https://preview.myshopify.dev/',
    );
    const production = applySecurityHeaders(
      new Headers(),
      'https://render-lab.org/',
    );
    expect(preview.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive');
    expect(production.has('X-Robots-Tag')).toBe(false);
  });
});
