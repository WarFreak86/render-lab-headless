import {describe, expect, it} from 'vitest';
import {apparelCardPrice, apparelListingState, isGarmentProductType} from './apparel';

describe('apparel launch safety', () => {
  it('keeps published sold-out garments in the assortment', () => {
    expect(apparelListingState([{availableForSale: false}])).toEqual({
      hasPublishedProducts: true,
      hasPurchasableProducts: false,
    });
    expect(apparelListingState([])).toEqual({
      hasPublishedProducts: false,
      hasPurchasableProducts: false,
    });
    expect(apparelListingState([{availableForSale: false}, {availableForSale: true}])).toEqual({
      hasPublishedProducts: true,
      hasPurchasableProducts: true,
    });
  });

  it('uses exact prices when size prices are fixed', () => {
    expect(apparelCardPrice({
      min: {amount: '79.00', currencyCode: 'USD'},
      max: {amount: '79.00', currencyCode: 'USD'},
      firstAvailable: {amount: '79.00', currencyCode: 'USD'},
      availableForSale: true,
    })).toEqual({amount: {amount: '79.00', currencyCode: 'USD'}, label: ''});
  });

  it('does not advertise an unavailable minimum as the starting price', () => {
    expect(apparelCardPrice({
      min: {amount: '59.00', currencyCode: 'USD'},
      max: {amount: '95.00', currencyCode: 'USD'},
      firstAvailable: {amount: '75.00', currencyCode: 'USD'},
      availableForSale: true,
    })).toEqual({amount: {amount: '75.00', currencyCode: 'USD'}, label: 'Available size'});
  });

  it('uses From when a variable-price minimum is available', () => {
    expect(apparelCardPrice({
      min: {amount: '59.00', currencyCode: 'USD'},
      max: {amount: '95.00', currencyCode: 'USD'},
      firstAvailable: {amount: '59.00', currencyCode: 'USD'},
      availableForSale: true,
    }).label).toBe('From');
  });

  it('recognizes garments but not wall-art print types', () => {
    expect(isGarmentProductType('Fashion Hoodie - AOP')).toBe(true);
    expect(isGarmentProductType('Unisex T-Shirt')).toBe(true);
    expect(isGarmentProductType('Metal Print')).toBe(false);
    expect(isGarmentProductType('Canvas')).toBe(false);
  });
});
