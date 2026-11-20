import {describe, expect, it} from 'vitest';
import {
  APPAREL_CATEGORIES,
  getApparelCategory,
  getApparelCategoryByCollectionHandle,
  getApparelCategoryByProductType,
} from './apparel-categories';

describe('apparel department category contracts', () => {
  it('gives each garment category a unique URL and Shopify collection handle', () => {
    expect(new Set(APPAREL_CATEGORIES.map((c) => c.slug)).size).toBe(APPAREL_CATEGORIES.length);
    expect(new Set(APPAREL_CATEGORIES.map((c) => c.collectionHandle)).size).toBe(APPAREL_CATEGORIES.length);
  });

  it('resolves the current hoodie collection to its own apparel category', () => {
    const hoodies = getApparelCategory('hoodies');
    expect(hoodies?.collectionHandle).toBe('hoodies');
    expect(hoodies?.title).toBe('Hoodies');
    expect(getApparelCategoryByCollectionHandle('hoodies')).toEqual(hoodies);
    expect(getApparelCategoryByProductType('Fashion Hoodie - AOP')).toEqual(hoodies);
  });

  it('keeps future categories separate without assuming they are published', () => {
    expect(getApparelCategoryByProductType('Graphic T-Shirt')).toEqual(getApparelCategory('t-shirts'));
    expect(getApparelCategoryByProductType('Crewneck Sweatshirt')).toEqual(getApparelCategory('sweatshirts'));
    expect(getApparelCategoryByProductType('Jacket')).toEqual(getApparelCategory('jackets'));
    expect(getApparelCategory('scarves')).toBeUndefined();
    expect(getApparelCategoryByProductType('Metal Wall Art')).toBeUndefined();
  });
});
