import {describe, expect, it} from 'vitest';
import {isGarmentProductType, purchasableApparel} from './apparel';

describe('apparel launch safety', () => {
  it('excludes unavailable items without changing order', () => {
    const result = purchasableApparel([
      {id: 'draft', availableForSale: false},
      {id: 'a', availableForSale: true},
      {id: 'b', availableForSale: true},
    ]);
    expect(result.map((product) => product.id)).toEqual(['a', 'b']);
  });

  it('shows an empty assortment when nothing can be purchased', () => {
    expect(purchasableApparel([])).toEqual([]);
    expect(purchasableApparel([{availableForSale: false}])).toEqual([]);
  });

  it('recognizes garments but not wall-art print types', () => {
    expect(isGarmentProductType('Fashion Hoodie - AOP')).toBe(true);
    expect(isGarmentProductType('Unisex T-Shirt')).toBe(true);
    expect(isGarmentProductType('Metal Print')).toBe(false);
    expect(isGarmentProductType('Canvas')).toBe(false);
  });
});
