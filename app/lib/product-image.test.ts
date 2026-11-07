import {findProductImageIndex} from './product-image';

const root = 'https://cdn.shopify.com/s/files/1/0748/7701/0081/files/';
const images = [
  {id: 'gid://shopify/ImageSource/38078083137697', url: root + 'main.png?v=1'},
  {id: 'gid://shopify/ImageSource/38078084251809', url: root + 'metal.png?v=2'},
  {id: 'gid://shopify/ImageSource/38078085398689', url: root + 'canvas.png?v=3'},
];

describe('Shopify product image identity', () => {
  it.each([
    ['Metal', 1, 'gid://shopify/ProductImage/45234927272097', 'metal.png?width=800&height=1000&crop=center&v=2'],
    ['Canvas', 2, 'gid://shopify/ProductImage/45234928418977', 'canvas_800x1000_crop_center@2x.png?format=webp&v=3'],
  ])('matches the %s asset across resource IDs and transformations', (_, index, id, url) => {
    expect(findProductImageIndex(images, {id, url: root + url})).toBe(index);
  });

  it('prefers an exact ID and supports protocol-relative URLs', () => {
    expect(findProductImageIndex(images, {id: images[1].id})).toBe(1);
    expect(findProductImageIndex(images, {
      url: images[2].url.replace('https:', '') + '&width=400',
    })).toBe(2);
  });

  it('keeps distinct stores, assets and meaningful query parameters separate', () => {
    expect(findProductImageIndex(images, {
      url: root.replace('/0081/', '/9999/') + 'metal.png?v=2',
    })).toBe(-1);
    expect(findProductImageIndex(images, {url: root + 'missing.png'})).toBe(-1);
    expect(findProductImageIndex([{id: 'a', url: 'https://example.org/photo?asset=1'}], {
      url: 'https://example.org/photo?asset=2',
    })).toBe(-1);
    expect(findProductImageIndex(images, null)).toBe(-1);
  });
});
