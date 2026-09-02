import {
  getProductContext,
  isGenericCatalogLabel,
  parseProductSizeDimensions,
  splitProductIdentity,
} from './product-presentation';

describe('product presentation helpers', () => {
  it('separates artwork and series names without changing the underlying product title', () => {
    expect(splitProductIdentity('Jungle Ghosts — Echoes of War')).toEqual({
      artworkTitle: 'Jungle Ghosts',
      seriesTitle: 'Echoes of War',
    });
  });

  it('uses a real series or collection as context but suppresses generic catalog labels', () => {
    expect(
      getProductContext('Jungle Ghosts — Echoes of War', 'Metal Wall Art'),
    ).toBe('Echoes of War');
    expect(getProductContext('Signal Fire', 'Botanical Anomalies')).toBe(
      'Botanical Anomalies',
    );
    expect(getProductContext('Signal Fire', 'Wall Art')).toBeUndefined();
    expect(isGenericCatalogLabel('Canvas Prints')).toBe(true);
  });

  it('derives physical proportions only from recognizable size labels', () => {
    expect(parseProductSizeDimensions('16 × 24 in')).toEqual({
      width: 16,
      height: 24,
    });
    expect(parseProductSizeDimensions('24" x 36"')).toEqual({
      width: 24,
      height: 36,
    });
    expect(parseProductSizeDimensions('Large')).toBeUndefined();
  });
});
