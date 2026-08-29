import {loader} from '~/routes/collections.$handle';

describe('collection directory routes', () => {
  it('keeps Bundles in directory mode when the Shopify parent collection is missing', async () => {
    const query = vi.fn().mockResolvedValue({
      collection: null,
      collections: {nodes: []},
    });

    const result = await loader({
      context: {storefront: {query}},
      params: {handle: 'bundles'},
      request: new Request('https://render-lab.org/collections/bundles'),
    } as never);

    expect(result).toMatchObject({
      mode: 'directory',
      analyticsCollectionId: null,
      directoryEntries: [],
      collectionPage: {
        handle: 'bundles',
        hero: {
          title: 'Bundles',
          editorialHeading: 'Better together.',
        },
      },
    });
  });
});
