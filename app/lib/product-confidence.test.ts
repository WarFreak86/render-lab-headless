import {
  artworkImage,
  choiceForOptions,
  choiceQuery,
  clampArtworkPan,
  hasPrintChoices,
  printDimensions,
  type ChoiceVariant,
} from './product-confidence';

const variants: ChoiceVariant[] = [
  {
    id: 'metal',
    availableForSale: true,
    price: {amount: '109', currencyCode: 'USD'},
    selectedOptions: [
      {name: 'Material', value: 'Metal'},
      {name: 'Size', value: '24x18'},
    ],
  },
  {
    id: 'canvas',
    availableForSale: false,
    price: {amount: '89', currencyCode: 'USD'},
    selectedOptions: [
      {name: 'Material', value: 'Canvas'},
      {name: 'Size', value: '24x18'},
    ],
  },
];

describe('product decision data', () => {
  it('never borrows a price from a different size or material', () => {
    expect(
      choiceForOptions(variants, {Material: 'Canvas', Size: '24x18'})?.id,
    ).toBe('canvas');
    expect(
      choiceForOptions(variants, {Material: 'Canvas', Size: '32x24'}),
    ).toBeUndefined();
  });
  it('preserves campaign parameters while replacing legacy variant and mixed-case options', () => {
    const params = new URLSearchParams(
      choiceQuery(
        '?variant=123&material=Metal&Size=16x12&utm_source=pinterest',
        variants[1].selectedOptions,
      ),
    );
    expect(params.get('variant')).toBeNull();
    expect(params.get('material')).toBeNull();
    expect(params.get('Material')).toBe('Canvas');
    expect(params.get('Size')).toBe('24x18');
    expect(params.get('utm_source')).toBe('pinterest');
  });
  it('opts only recognized physical print choices into the experience', () => {
    expect(hasPrintChoices(variants)).toBe(true);
    expect(
      hasPrintChoices([
        {...variants[0], selectedOptions: [{name: 'Size', value: 'Large'}]},
      ]),
    ).toBe(false);
    expect(printDimensions('24x32')).toEqual({width: 24, height: 32});
    expect(printDimensions('24 × 18 in')).toEqual({width: 24, height: 18});
    expect(printDimensions('24x18 cm')).toBeUndefined();
    expect(printDimensions('0x18')).toBeUndefined();
  });
  it('does not use a styled room mockup as the original artwork', () => {
    const room = {
      id: 'room',
      url: '/metal-mockup.png',
      altText: 'Print displayed above a sofa',
    };
    const art = {id: 'art', url: '/artwork.png', altText: 'Botanical artwork'};
    expect(artworkImage([room])).toBeUndefined();
    expect(artworkImage([room, art])).toBe(art);
  });
  it('bounds image pan when zoom changes or the image fits inside the viewport', () => {
    expect(clampArtworkPan(999, -999, 2, 400, 300, 600, 400)).toEqual({
      x: 100,
      y: -100,
    });
    expect(clampArtworkPan(999, -999, 1, 400, 300, 600, 400)).toEqual({
      x: 0,
      y: -0,
    });
  });
});
