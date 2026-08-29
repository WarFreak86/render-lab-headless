import {
  buildCollectionDirectoryEntries,
  getCollectionDirectoryPresentation,
  isCollectionDirectoryHandle,
  type RawCollectionDirectoryEntry,
} from './collection-directory';

function collection(
  input: Partial<RawCollectionDirectoryEntry> &
    Pick<RawCollectionDirectoryEntry, 'handle' | 'title'>,
): RawCollectionDirectoryEntry {
  return {
    id: `collection-${input.handle}`,
    description: '',
    image: null,
    products: {nodes: [{id: `product-${input.handle}`}]},
    ...input,
  };
}

describe('collection directories', () => {
  it('recognizes the five collection-family routes', () => {
    expect(isCollectionDirectoryHandle('wall-art')).toBe(true);
    expect(isCollectionDirectoryHandle('metal-wall-art')).toBe(true);
    expect(isCollectionDirectoryHandle('botanical-anomalies')).toBe(false);
  });

  it('provides a stable landing-page presentation without a Shopify parent collection', () => {
    expect(getCollectionDirectoryPresentation('bundles')).toEqual({
      title: 'Bundles',
      eyebrow: 'Curated sets',
      editorialHeading: 'Better together.',
      description: 'Explore coordinated sets grouped by collection.',
    });
  });

  it('turns active editorial collections into alphabetical directory entries', () => {
    const entries = buildCollectionDirectoryEntries(
      [
        collection({
          handle: 'nightmare-lab-halloween-2026',
          title: 'Nightmare Lab — Halloween 2026',
        }),
        collection({
          handle: 'botanical-anomalies',
          title: 'Botanical Anomalies',
          description: 'Surreal botanical artwork.',
        }),
        collection({handle: 'wall-art', title: 'Wall Art'}),
        collection({
          handle: 'empty-series',
          title: 'Empty Series',
          products: {nodes: []},
        }),
      ],
      'wall-art',
    );

    expect(entries.map((entry) => entry.title)).toEqual([
      'Botanical Anomalies',
      'Nightmare Lab — Halloween 2026',
    ]);
    expect(entries[0]).toMatchObject({
      description: 'Surreal botanical artwork.',
      to: '/collections/botanical-anomalies',
    });
  });

  it('uses directory_groups when a collection has explicit placement', () => {
    const item = collection({
      handle: 'nightmare-lab',
      title: 'Nightmare Lab',
      directoryGroups: {value: '["wall-art","posters"]'},
    });

    expect(buildCollectionDirectoryEntries([item], 'posters')).toHaveLength(1);
    expect(
      buildCollectionDirectoryEntries([item], 'metal-wall-art'),
    ).toHaveLength(0);
  });

  it('keeps bundles product-led until bundle subcollections exist', () => {
    expect(
      buildCollectionDirectoryEntries(
        [
          collection({
            handle: 'botanical-anomalies',
            title: 'Botanical Anomalies',
          }),
        ],
        'bundles',
      ),
    ).toEqual([]);
  });
});
