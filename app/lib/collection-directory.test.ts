import {
  buildCollectionDirectoryEntries,
  getCollectionDirectoryPresentation,
  isCollectionDirectoryHandle,
  type RawCollectionDirectoryEntry,
} from './collection-directory';

function materialVariants(
  optionName: 'Material' | 'Finish',
  values: string[],
) {
  return {
    nodes: values.map((value) => ({
      selectedOptions: [{name: optionName, value}],
    })),
  };
}

function collection(
  input: Partial<RawCollectionDirectoryEntry> &
    Pick<RawCollectionDirectoryEntry, 'handle' | 'title'>,
): RawCollectionDirectoryEntry {
  return {
    id: `collection-${input.handle}`,
    description: '',
    image: null,
    products: {
      nodes: [
        {
          id: `product-${input.handle}`,
          variants: materialVariants('Material', ['Metal', 'Canvas', 'Poster']),
        },
      ],
    },
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

  it('turns active editorial collections into alphabetical directory entries while suppressed collections stay hidden', () => {
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
    ]);
    expect(entries[0]).toMatchObject({
      description: 'Surreal botanical artwork.',
      to: '/collections/botanical-anomalies',
    });
  });

  it('only lists collections under Posters when a real Poster variant exists', () => {
    const entries = buildCollectionDirectoryEntries(
      [
        collection({
          handle: 'metal-canvas-only',
          title: 'Metal & Canvas Only',
          products: {
            nodes: [
              {
                id: 'product-metal-canvas',
                variants: materialVariants('Material', ['Metal', 'Canvas']),
              },
            ],
          },
        }),
        collection({
          handle: 'legacy-finish-series',
          title: 'Legacy Finish Series',
          products: {
            nodes: [
              {
                id: 'product-legacy',
                variants: materialVariants('Finish', ['Metal', 'Canvas', 'Poster']),
              },
            ],
          },
        }),
      ],
      'posters',
    );

    expect(entries.map((entry) => entry.title)).toEqual(['Legacy Finish Series']);
    expect(entries[0]?.to).toBe('/collections/legacy-finish-series?material=Poster');
  });

  it('keeps suppressed collections out even when directory_groups explicitly places them', () => {
    const item = collection({
      handle: 'nightmare-lab',
      title: 'Nightmare Lab',
      directoryGroups: {value: '["wall-art","posters"]'},
    });

    expect(buildCollectionDirectoryEntries([item], 'posters')).toHaveLength(0);
    expect(
      buildCollectionDirectoryEntries([item], 'metal-wall-art'),
    ).toHaveLength(0);
  });

  it('keeps an active collection visible but drops a suppressed merchandising image', () => {
    const entries = buildCollectionDirectoryEntries(
      [
        collection({
          handle: 'botanical-anomalies',
          title: 'Botanical Anomalies',
          image: {
            url: 'https://cdn.shopify.com/collections/nightmare-lab-nl-001.png',
            altText: 'Old collection image',
          },
        }),
      ],
      'wall-art',
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]?.image).toBeNull();
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
