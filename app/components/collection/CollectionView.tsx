import '~/styles/collection-storytelling.css';
import '~/styles/catalog-cards.css';
import {CollectionHero} from './CollectionHero';
import {CollectionStatement} from './CollectionStatement';
import {CollectionControls} from './CollectionControls';
import {CollectionProductGrid} from './CollectionProductGrid';
import {CollectionArtist} from './CollectionArtist';
import {
  getActiveCollectionFilters,
  type CollectionPageData,
} from '~/lib/collection';

export function CollectionView({
  connection,
  data,
  searchParams,
}: {
  connection: {
    nodes: CollectionPageData['products'];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
  };
  data: CollectionPageData;
  searchParams: URLSearchParams;
}) {
  const activeFilters = getActiveCollectionFilters(
    searchParams,
    data.filterGroups,
  );

  return (
    <div className="collection-experience collection-experience--storytelling">
      <CollectionHero hero={data.hero} />

      <div className="container container--wide collection-browser">
        <CollectionControls
          filterGroups={data.filterGroups}
          searchParams={searchParams}
        />
        <div
          className="collection-browser__layout collection-browser__layout--full"
        >
          <CollectionProductGrid
            connection={connection}
            context={{
              artistName: data.artist?.name,
              collectionTitle: data.hero.title,
            }}
            hasActiveFilters={activeFilters.length > 0}
            searchParams={searchParams}
          />
        </div>
      </div>
      <CollectionStatement hero={data.hero} hasArtist={Boolean(data.artist)} />
      {data.artist ? <CollectionArtist artist={data.artist} /> : null}
    </div>
  );
}
