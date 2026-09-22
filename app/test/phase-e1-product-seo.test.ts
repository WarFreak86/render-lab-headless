import {getProductGroupStructuredData} from '~/lib/seo';
import {meta as productMeta} from '~/routes/products.$handle';

const PILOT_PRODUCTS = [
  {
    handle: 'fireglass-1934-ford-three-window',
    title: 'Fireglass — 1934 Ford Three-Window',
    seoTitle: '1934 Ford Three-Window Wall Art | Fireglass | Render-Lab',
    renderedTitle: '1934 Ford Three-Window Wall Art | Fireglass | Render-Lab',
    description:
      '1934 Ford Three-Window wall art with chopped hot-rod stance, orange-and-black painterly marks, and raw American street-machine attitude. Render-Lab.',
    optionName: 'Material',
    optionValues: ['Canvas', 'Metal'],
    sizes: ['16x12', '24x18', '32x24'],
  },
  {
    handle: 'fields-of-memory-echoes-of-war',
    title: 'Fields of Memory — Echoes of War',
    seoTitle: 'Fields of Memory | WWII Military Wall Art | Render-Lab',
    renderedTitle: 'Fields of Memory | WWII Military Wall Art | Render-Lab',
    description:
      'Fields of Memory from Echoes of War layers a kneeling infantryman with troops, smoke and sepia battlefield memory in metal, canvas and premium matte poster art.',
    optionName: 'Finish',
    optionValues: ['Metal', 'Canvas', 'Poster'],
    sizes: ['12×16', '18×24', '24×32'],
  },
  {
    handle: 'hard-exit-heat',
    title: 'Hard Exit — Heat',
    seoTitle: 'Hard Exit — Heat | Cinematic Wall Art',
    renderedTitle: 'Hard Exit — Heat | Cinematic Wall Art | Render-Lab',
    description:
      'Hard Exit channels the cool tension and disciplined intensity of Heat into cinematic wall art, available in Metal and Canvas across three sizes.',
    optionName: 'Material',
    optionValues: ['Canvas', 'Metal'],
    sizes: ['18x24', '24x32', '12x16'],
  },
  {
    handle: 'the-producer-urban-icon',
    title: 'The Producer — Urban Icon',
    seoTitle: 'The Producer | Neon Hip-Hop Wall Art | Render-Lab',
    renderedTitle: 'The Producer | Neon Hip-Hop Wall Art | Render-Lab',
    description:
      'The Producer from Urban Icon pairs neon portraiture, palm-lined city energy and bold color. Available as metal, canvas and premium matte poster wall art.',
    optionName: 'Finish',
    optionValues: ['Metal', 'Canvas', 'Poster'],
    sizes: ['12×16', '18×24', '24×32'],
  },
  {
    handle: 'eyes-of-doom',
    title: 'Eyes of Doom',
    seoTitle: 'Eyes of Doom | Dark Armored Villain Wall Art',
    renderedTitle: 'Eyes of Doom | Dark Armored Villain Wall Art | Render-Lab',
    description:
      'A hooded iron-masked ruler emerges from shadow in weathered green armor. Cinematic dark wall art available in premium metal and canvas.',
    optionName: 'Material',
    optionValues: ['Canvas', 'Metal'],
    sizes: ['18x24', '24x32', '12x16'],
  },
] as const;

function findMeta(
  entries: ReturnType<typeof productMeta>,
  key: 'name' | 'property' | 'rel',
  value: string,
) {
  return entries.find(
    (entry) => (entry as unknown as Record<string, unknown>)[key] === value,
  );
}

describe('Phase E1 pilot product metadata', () => {
  it.each(PILOT_PRODUCTS)(
    'uses the authoritative Shopify SEO fields for $handle',
    ({handle, title, seoTitle, renderedTitle, description}) => {
      const canonical = `https://render-lab.org/products/${handle}`;
      const imageUrl = `https://cdn.shopify.com/${handle}.jpg`;
      const entries = productMeta({
        data: {
          product: {
            handle,
            title,
            description: 'Fallback product description.',
            seo: {title: seoTitle, description},
            media: {
              nodes: [{image: {url: imageUrl, altText: `${title} artwork`}}],
            },
            selectedOrFirstAvailableVariant: {
              availableForSale: true,
              price: {amount: '59.0', currencyCode: 'USD'},
            },
          },
        },
      } as never);

      expect(entries).toContainEqual({title: renderedTitle});
      expect(findMeta(entries, 'name', 'description')).toMatchObject({
        content: description,
      });
      expect(findMeta(entries, 'rel', 'canonical')).toMatchObject({
        href: canonical,
      });
      expect(findMeta(entries, 'property', 'og:title')).toMatchObject({
        content: renderedTitle,
      });
      expect(findMeta(entries, 'property', 'og:description')).toMatchObject({
        content: description,
      });
      expect(findMeta(entries, 'property', 'og:url')).toMatchObject({
        content: canonical,
      });
      expect(findMeta(entries, 'property', 'og:image')).toMatchObject({
        content: imageUrl,
      });
    },
  );

  it('keeps a non-pilot product on the existing title and description fallback', () => {
    const entries = productMeta({
      data: {
        product: {
          handle: 'non-pilot-artwork',
          title: 'Non-Pilot Artwork',
          description: 'Existing non-pilot description.',
          seo: {title: null, description: null},
          media: {nodes: []},
          selectedOrFirstAvailableVariant: null,
        },
      },
    } as never);

    expect(entries).toContainEqual({title: 'Non-Pilot Artwork | Render-Lab'});
    expect(findMeta(entries, 'name', 'description')).toMatchObject({
      content: 'Existing non-pilot description.',
    });
    expect(findMeta(entries, 'rel', 'canonical')).toMatchObject({
      href: 'https://render-lab.org/products/non-pilot-artwork',
    });
  });

  it('does not leak pilot copy over a non-pilot product Shopify SEO field', () => {
    const entries = productMeta({
      data: {
        product: {
          handle: 'blackout-1987-buick-gnx',
          title: 'Blackout — 1987 Buick GNX',
          description: 'Existing product description.',
          seo: {
            title: '1987 Buick GNX Wall Art | Blackout | Render-Lab',
            description:
              '1987 Buick GNX wall art with sinister black paint, restrained gold tones, and a near-monochrome finish. Chrome & Thunder by Render-Lab.',
          },
          media: {nodes: []},
          selectedOrFirstAvailableVariant: null,
        },
      },
    } as never);

    expect(entries).toContainEqual({
      title: '1987 Buick GNX Wall Art | Blackout | Render-Lab',
    });
    expect(findMeta(entries, 'name', 'description')).toMatchObject({
      content:
        '1987 Buick GNX wall art with sinister black paint, restrained gold tones, and a near-monochrome finish. Chrome & Thunder by Render-Lab.',
    });
  });
});

describe('Phase E1 ProductGroup isolation', () => {
  it.each(PILOT_PRODUCTS)(
    'preserves the complete $handle option matrix independently of metadata',
    ({handle, title, optionName, optionValues, sizes}) => {
      const canonical = `https://render-lab.org/products/${handle}`;
      const variants = optionValues.flatMap((optionValue, optionIndex) =>
        sizes.map((size, sizeIndex) => {
          const position = optionIndex * sizes.length + sizeIndex + 1;
          return {
            availableForSale: true,
            id: `gid://shopify/ProductVariant/${handle}-${position}`,
            image: {url: `https://cdn.shopify.com/${handle}.jpg`},
            price: {amount: '59.0', currencyCode: 'USD'},
            selectedOptions: [
              {name: optionName, value: optionValue},
              {name: 'Size', value: size},
            ],
            sku: `${handle.toUpperCase()}-${position}`,
          };
        }),
      );
      const jsonLd = getProductGroupStructuredData({
        canonical,
        productId: `gid://shopify/Product/${handle}`,
        title,
        description: 'Existing product description.',
        images: [`https://cdn.shopify.com/${handle}.jpg`],
        vendor: 'Render-Lab',
        variants,
      });
      const group = jsonLd['@graph'][0];

      if (!('hasVariant' in group)) {
        throw new Error('Expected ProductGroup to be the first graph node');
      }

      expect(group).toMatchObject({
        '@type': 'ProductGroup',
        '@id': `${canonical}#product-group`,
        url: canonical,
      });
      expect(group.hasVariant).toHaveLength(optionValues.length * sizes.length);
      expect(
        new Set(group.hasVariant.map((variant) => variant['@id'])).size,
      ).toBe(group.hasVariant.length);
      expect(new Set(group.hasVariant.map((variant) => variant.sku)).size).toBe(
        group.hasVariant.length,
      );
      expect(
        group.hasVariant.every((variant) => variant.offers.url === variant.url),
      ).toBe(true);
    },
  );
});
