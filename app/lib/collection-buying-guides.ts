interface CollectionBuyingGuideData {
  title: string;
  introduction: string;
  tips: {heading: string; text: string}[];
  recommendations: {label: string; to: string}[];
  recommendationsHeading?: string;
}

export const COLLECTION_BUYING_GUIDES: Record<
  string,
  CollectionBuyingGuideData
> = {
  carnivora: {
    title: 'Choosing carnivorous plant wall art',
    introduction:
      'Choose a botanical composition by the detail you want to live with: an open trap, a field of droplets, or a dramatic red silhouette. Compare the full artwork before choosing a material and size.',
    tips: [
      {
        heading: 'Choose by plant form and mood',
        text: 'Open Trap brings a Venus flytrap close-up into deep green and crimson. Crown of Dew focuses on droplets and a serrated rim. Devour uses a red carnivorous plant and long filament-like teeth against black for a more dramatic focal point.',
      },
      {
        heading: 'Compare metal and canvas',
        text: 'These artworks offer Metal and Canvas variants. Use the matching product mockups to compare their presentation in a room, then select the actual material to see its current price and availability.',
      },
      {
        heading: 'Match the orientation to your wall',
        text: 'Open Trap and Crown of Dew offer 16 × 12, 24 × 18, and 32 × 24 inch landscape sizes. Devour offers 12 × 16, 18 × 24, and 24 × 32 inch portrait sizes. Measure your wall and check the selected size on the artwork page before adding it to your cart.',
      },
    ],
    recommendations: [
      {
        label: 'Open Trap — Carnivora No. 01',
        to: '/products/carnivora-no-01-open-trap',
      },
      {
        label: 'Crown of Dew — Carnivora No. 02',
        to: '/products/carnivora-no-02-crown-of-dew',
      },
      {
        label: 'Devour — Carnivora No. 09',
        to: '/products/carnivora-no-09-devour',
      },
    ],
  },
  'metal-wall-art': {
    title: 'Choosing decorative metal wall prints',
    recommendationsHeading: 'Explore a series in Metal',
    introduction:
      'Explore finished artwork offered as metal wall prints. This collection brings together printed images for your wall, rather than metal sculptures or a service for printing your own photographs.',
    tips: [
      {
        heading: 'Start with a subject',
        text: 'Compare the close-up plant forms in Carnivora, the classic cars in Chrome & Thunder, and the cosmic architecture in The Veil Between Worlds. Open a series to find an artwork that fits the mood of your room.',
      },
      {
        heading: 'Select the Metal variant',
        text: 'On the artwork page, choose Metal and a size to see the matching mockup, current price, and availability. A series may offer more than one material; confirm your selection before adding it to your cart.',
      },
      {
        heading: 'Check the product details',
        text: 'Measure your available wall space and compare the landscape or portrait sizes offered for that artwork. Check its specific material and mounting information before ordering; finishes and fittings should be confirmed for the selected product.',
      },
    ],
    recommendations: [
      {
        label: 'Carnivora in Metal',
        to: '/collections/carnivora?material=Metal',
      },
      {
        label: 'Chrome & Thunder in Metal',
        to: '/collections/chrome-thunder?material=Metal',
      },
      {
        label: 'The Veil Between Worlds in Metal',
        to: '/collections/the-veil-between-worlds?material=Metal',
      },
    ],
  },
  'chrome-thunder': {
    title: 'Choosing classic car wall art',
    introduction:
      'Bring hot rod and muscle car artwork into a garage, office, study, or living space. Start with the car you love, then choose a print surface and landscape size that fit the wall.',
    tips: [
      {
        heading: 'Metal or canvas?',
        text: 'Metal offers a crisp, contemporary presentation that suits chrome, paintwork, and bold contrasts. Matte stretched canvas has a softer, textured finish that works well in warmer rooms.',
      },
      {
        heading: 'Which landscape size?',
        text: 'These artworks are offered in 16 × 12, 24 × 18, and 32 × 24 inch landscape formats. The smaller size suits a tighter display; the larger formats give a favorite car more wall presence. Measure the available space before selecting a variant.',
      },
      {
        heading: 'Find your kind of horsepower',
        text: 'For prewar hot rod shapes, start with Fireglass or Willys Wild. For 1970s muscle-car silhouettes, compare Boss Green with Purple Menace. Open each artwork to see the available material, size, and price.',
      },
    ],
    recommendations: [
      {
        label: 'Fireglass — 1934 Ford Three-Window',
        to: '/products/fireglass-1934-ford-three-window',
      },
      {
        label: 'Willys Wild — 1941 Willys Coupe',
        to: '/products/willys-wild-1941-willys-coupe',
      },
      {
        label: 'Boss Green — 1970 Ford Mustang Boss',
        to: '/products/boss-green-1970-ford-mustang-boss',
      },
      {
        label: 'Purple Menace — 1970 Dodge Challenger',
        to: '/products/purple-menace-1970-dodge-challenger',
      },
    ],
  },
  'the-veil-between-worlds': {
    title: 'Choosing cosmic gothic wall art',
    introduction:
      'The Veil Between Worlds pairs monumental architecture with celestial imagery and lone figures. Consider the mood of the room, the detail you want to emphasize, and the space available for a portrait-format print.',
    tips: [
      {
        heading: 'Metal or canvas?',
        text: 'Metal gives the luminous highlights and dark architectural lines a crisp presentation. Matte canvas softens the contrast with a textured, dimensional finish. Both formats are made to order; check each artwork for its available variants.',
      },
      {
        heading: 'Which portrait size?',
        text: 'Choose from 12 × 16, 18 × 24, or 24 × 32 inch portrait formats. A smaller piece can anchor a narrow wall, while a larger print creates a stronger focal point above furniture. Allow enough clear wall space around the composition.',
      },
      {
        heading: 'Choose by atmosphere',
        text: 'Cathedral of the Void emphasizes gothic architecture and a spiraling sky. Ascension Beyond Time centers on a solitary figure and celestial scale. The Last Radiance leans into luminous, dramatic light. Compare their details before selecting a finish.',
      },
    ],
    recommendations: [
      {
        label: 'Cathedral of the Void',
        to: '/products/cathedral-of-the-void',
      },
      {
        label: 'Ascension Beyond Time',
        to: '/products/ascension-beyond-time',
      },
      {
        label: 'The Last Radiance',
        to: '/products/the-last-radiance',
      },
    ],
  },
};
