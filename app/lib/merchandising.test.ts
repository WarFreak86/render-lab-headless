import {
  filterSuppressedSitemapXml,
  isSuppressedCollection,
  isSuppressedMerchandisingAssetUrl,
  isSuppressedProduct,
  isSuppressedSitemapLocation,
} from './merchandising';

describe('merchandising suppression', () => {
  it('suppresses the current Nightmare Lab collection handles', () => {
    expect(
      isSuppressedCollection({handle: 'nightmare-lab', title: 'Nightmare Lab'}),
    ).toBe(true);
    expect(
      isSuppressedCollection({
        handle: 'nightmare-lab-halloween-2026',
        title: 'Nightmare Lab — Halloween 2026',
      }),
    ).toBe(true);
  });

  it('suppresses placeholder/test collections even when they contain products', () => {
    expect(
      isSuppressedCollection({
        handle: 'comic-placeholder',
        title: 'Comic placeholder',
      }),
    ).toBe(true);
    expect(
      isSuppressedCollection({handle: 'ww2-placeholder', title: 'WW2'}),
    ).toBe(true);
  });

  it('suppresses Nightmare Lab and placeholder products from generic discovery', () => {
    expect(
      isSuppressedProduct({
        handle: 'dead-arcade-nightmare-lab',
        title: 'Dead Arcade — Nightmare Lab',
      }),
    ).toBe(true);
    expect(
      isSuppressedProduct({
        handle: 'nightmare-icons-collector-metal-set',
        title: 'Nightmare Icons — Collector Metal Set',
        imageUrl:
          'https://cdn.shopify.com/files/nightmare-lab-nl-001-the-experiment.png',
      }),
    ).toBe(true);
    expect(
      isSuppressedProduct({
        handle: 'harly-placeholder',
        title: 'Harly placeholder',
      }),
    ).toBe(true);
  });

  it('suppresses Nightmare Lab image URLs from active merchandising surfaces', () => {
    expect(
      isSuppressedMerchandisingAssetUrl(
        'https://cdn.shopify.com/s/files/1/0000/collections/nightmare-lab-nl-001-the-experiment.png',
      ),
    ).toBe(true);
    expect(
      isSuppressedMerchandisingAssetUrl(
        'https://cdn.shopify.com/s/files/1/0000/collections/echoes-of-war.jpg',
      ),
    ).toBe(false);
  });

  it('filters suppressed catalog locations out of sitemap XML', () => {
    const xml = [
      '<urlset>',
      '<url><loc>https://render-lab.org/products/dead-arcade-nightmare-lab</loc></url>',
      '<url><loc>https://render-lab.org/products/nightmare-icons-collector-metal-set</loc></url>',
      '<url><loc>https://render-lab.org/collections/comic-placeholder</loc></url>',
      '<url><loc>https://render-lab.org/products/fields-of-memory-echoes-of-war</loc></url>',
      '</urlset>',
    ].join('');

    const filtered = filterSuppressedSitemapXml(xml);
    expect(filtered).not.toContain('dead-arcade-nightmare-lab');
    expect(filtered).not.toContain('nightmare-icons-collector-metal-set');
    expect(filtered).not.toContain('comic-placeholder');
    expect(filtered).toContain('fields-of-memory-echoes-of-war');
    expect(
      isSuppressedSitemapLocation(
        'https://render-lab.org/collections/nightmare-lab-halloween-2026',
      ),
    ).toBe(true);
  });

  it('does not suppress unrelated active collections or products', () => {
    expect(
      isSuppressedCollection({
        handle: 'botanical-anomalies',
        title: 'Botanical Anomalies',
      }),
    ).toBe(false);
    expect(
      isSuppressedProduct({
        handle: 'fields-of-memory-echoes-of-war',
        title: 'Fields of Memory — Echoes of War',
        imageUrl: 'https://cdn.shopify.com/files/echoes-of-war.jpg',
      }),
    ).toBe(false);
  });
});
