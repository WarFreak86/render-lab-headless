import {loader} from '~/routes/collections.$handle';

describe('collection directory routes', () => {
  it('keeps Wall Art in directory mode when the Shopify parent collection is missing', async () => {
    const query = vi.fn().mockResolvedValue({
      collection: null,
      collections: {nodes: []},
    });

    const result = await loader({
      context: {storefront: {query}},
      params: {handle: 'wall-art'},
      request: new Request('https://render-lab.org/collections/wall-art'),
    } as never);

    expect(result).toMatchObject({
      mode: 'directory',
      analyticsCollectionId: null,
      directoryEntries: [],
      collectionPage: {
        handle: 'wall-art',
        hero: {
          title: 'Wall Art Prints',
          editorialHeading: 'Wall Art Prints',
        },
      },
    });
  });
});
