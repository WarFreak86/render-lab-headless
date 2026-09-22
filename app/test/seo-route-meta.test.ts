import {meta as collectionMeta} from '~/routes/collections.$handle';
import {meta as homepageMeta} from '~/routes/_index';
import {meta as materialsMeta} from '~/routes/materials';
import {meta as productMeta} from '~/routes/products.$handle';
import {HOMEPAGE_HERO_IMAGE} from '~/lib/homepage';

function getMetaContent(
  entries: ReturnType<typeof materialsMeta>,
  key: 'name' | 'property' | 'rel',
  value: string,
) {
  return entries.find((entry) => key in entry && entry[key] === value);
}

describe('Phase B1 route metadata', () => {
  it('uses explicit collection SEO copy and self-canonicalizes clean pagination', () => {
    const entries = collectionMeta({
      data: {
        mode: 'products',
        collectionSeoDescription:
          'Explicit Shopify collection SEO description.',
        collectionPage: {
          handle: 'wall-art',
          hero: {
            title: 'Wall Art',
            description:
              'Long visible collection copy that remains on the page.',
          },
        },
      },
      location: {
        search: '?direction=next&cursor=opaque-cursor',
      },
    } as never);

    expect(entries).toContainEqual({
      name: 'description',
      content: 'Explicit Shopify collection SEO description.',
    });
    expect(entries).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://render-lab.org/collections/wall-art?direction=next&cursor=opaque-cursor',
    });
  });

  it('collapses a filtered paginated collection URL to the base collection', () => {
    const entries = collectionMeta({
      data: {
        mode: 'products',
        collectionSeoDescription: null,
        collectionPage: {
          handle: 'wall-art',
          hero: {title: 'Wall Art', description: 'Visible collection copy.'},
        },
      },
      location: {
        search: '?direction=next&cursor=opaque-cursor&filter.v.availability=1',
      },
    } as never);

    expect(entries).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://render-lab.org/collections/wall-art',
    });
  });

  it('adds the product brand suffix only when it is absent', () => {
    const entries = productMeta({
      data: {
        product: {
          handle: 'example',
          title: 'Example',
          description: 'Example artwork.',
          seo: {title: 'Example | Render-Lab', description: null},
          media: {nodes: []},
          selectedOrFirstAvailableVariant: null,
        },
      },
    } as never);

    expect(entries).toContainEqual({title: 'Example | Render-Lab'});
  });

  it('gives the materials route canonical and Open Graph metadata', () => {
    const entries = materialsMeta();
    expect(getMetaContent(entries, 'rel', 'canonical')).toMatchObject({
      href: 'https://render-lab.org/materials',
    });
    expect(getMetaContent(entries, 'property', 'og:url')).toMatchObject({
      content: 'https://render-lab.org/materials',
    });
    expect(getMetaContent(entries, 'property', 'og:title')).toBeDefined();
    expect(getMetaContent(entries, 'property', 'og:description')).toBeDefined();
  });

  it('uses the deliberate homepage hero asset for social previews', () => {
    const entries = homepageMeta({data: undefined} as never);
    expect(entries).toContainEqual({
      property: 'og:image',
      content: HOMEPAGE_HERO_IMAGE.url,
    });
    expect(entries).toContainEqual({
      property: 'og:image:width',
      content: String(HOMEPAGE_HERO_IMAGE.width),
    });
    expect(entries).toContainEqual({
      property: 'og:image:height',
      content: String(HOMEPAGE_HERO_IMAGE.height),
    });
  });

  it('uses the approved Phase C homepage metadata', () => {
    const entries = homepageMeta({data: undefined} as never);
    const title = 'Modern Wall Art & Art Prints | Render-Lab';
    const description =
      'Discover modern wall art from Render-Lab in premium metal, canvas and poster formats. Explore automotive, abstract, botanical, surreal and cinematic art collections.';

    expect(entries).toContainEqual({title});
    expect(entries).toContainEqual({name: 'description', content: description});
    expect(entries).toContainEqual({property: 'og:title', content: title});
    expect(entries).toContainEqual({
      property: 'og:description',
      content: description,
    });
    expect(entries).toContainEqual({
      property: 'og:url',
      content: 'https://render-lab.org/',
    });
  });

  it.each([
    [
      'wall-art',
      'Wall Art Prints | Metal, Canvas & Posters | Render-Lab',
      'Explore Render-Lab wall art prints across metal, canvas and poster formats. Discover distinctive automotive, abstract, botanical, surreal and cinematic collections.',
    ],
    [
      'metal-wall-art',
      'Metal Wall Art & Modern Metal Prints | Render-Lab',
      'Shop Render-Lab metal wall art featuring distinctive automotive, abstract, botanical and contemporary artwork printed on premium rigid metal panels.',
    ],
    [
      'canvas-art',
      'Canvas Wall Art & Modern Canvas Prints | Render-Lab',
      'Explore Render-Lab canvas wall art across original automotive, abstract, botanical and contemporary collections, available in multiple display sizes.',
    ],
    [
      'posters',
      'Art Posters & Wall Art Prints | Render-Lab',
      'Shop Render-Lab art posters and wall art prints featuring distinctive artwork from original automotive, abstract, botanical and contemporary collections.',
    ],
  ])(
    'uses the approved Phase C metadata for %s',
    (handle, title, description) => {
      const entries = collectionMeta({
        data: {
          mode: 'directory',
          collectionSeoDescription: 'Shopify SEO description.',
          collectionPage: {
            handle,
            hero: {title: 'Existing title', description: 'Existing copy.'},
          },
        },
        location: {search: ''},
      } as never);

      expect(entries).toContainEqual({title});
      expect(entries).toContainEqual({
        name: 'description',
        content: description,
      });
      expect(entries).toContainEqual({property: 'og:title', content: title});
      expect(entries).toContainEqual({
        property: 'og:description',
        content: description,
      });
      expect(entries).toContainEqual({
        tagName: 'link',
        rel: 'canonical',
        href: `https://render-lab.org/collections/${handle}`,
      });
      expect(entries).toContainEqual({
        property: 'og:url',
        content: `https://render-lab.org/collections/${handle}`,
      });
    },
  );

  it.each([
    ['chrome-thunder', 'Muscle Car & Hot Rod Wall Art | Chrome & Thunder'],
    ['reel-legends', 'Reel Legends | Cinematic Icon Wall Art'],
    ['urban-icon', 'Urban Icon | Neon Hip-Hop Inspired Wall Art | Render-Lab'],
  ])(
    'uses the Shopify SEO title for approved Phase D collection %s',
    (handle, title) => {
      const entries = collectionMeta({
        data: {
          mode: 'products',
          collectionSeoTitle: title,
          collectionSeoDescription: 'Existing Shopify SEO description.',
          collectionPage: {
            handle,
            hero: {title: 'Existing collection title'},
          },
        },
        location: {search: ''},
      } as never);

      expect(entries).toContainEqual({title});
      expect(entries).toContainEqual({property: 'og:title', content: title});
    },
  );

  it('uses the approved Echoes of War title instead of duplicating its older Shopify title', () => {
    const title = 'Military History Wall Art | Echoes of War';
    const description =
      'Explore Echoes of War by Render-Lab: cinematic military and historical wall art reflecting memory, service, conflict, and the human weight carried beyond battle.';
    const entries = collectionMeta({
      data: {
        mode: 'products',
        collectionSeoTitle:
          'Echoes of War | Military & Historical Wall Art | Render-Lab',
        collectionSeoDescription: description,
        collectionPage: {
          handle: 'echoes-of-war',
          hero: {title: 'Echoes of War'},
        },
      },
      location: {search: ''},
    } as never);

    expect(entries).toContainEqual({title});
    expect(entries).toContainEqual({property: 'og:title', content: title});
    expect(entries).toContainEqual({name: 'description', content: description});
    expect(entries).toContainEqual({
      property: 'og:description',
      content: description,
    });
  });

  it('falls back safely when an approved collection has an empty Shopify SEO title', () => {
    const title = 'Chrome & Thunder | Render-Lab';
    const entries = collectionMeta({
      data: {
        mode: 'products',
        collectionSeoTitle: '   ',
        collectionSeoDescription: null,
        collectionPage: {
          handle: 'chrome-thunder',
          hero: {title: 'Chrome & Thunder'},
        },
      },
      location: {search: ''},
    } as never);

    expect(entries).toContainEqual({title});
  });

  it('keeps Shopify SEO titles inactive for collections outside Phase D scope', () => {
    const title = 'Blood & Shadow | Render-Lab';
    const entries = collectionMeta({
      data: {
        mode: 'products',
        collectionSeoTitle: 'Dark Comic-Inspired Wall Art | Blood & Shadow',
        collectionSeoDescription: 'Existing Shopify SEO description.',
        collectionPage: {
          handle: 'blood-shadow',
          hero: {title: 'Blood & Shadow'},
        },
      },
      location: {search: ''},
    } as never);

    expect(entries).toContainEqual({title});
  });
});
