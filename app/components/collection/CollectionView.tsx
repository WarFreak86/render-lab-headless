import '~/styles/collection-storytelling.css';
import {CollectionHero} from './CollectionHero';
import {CollectionStatement} from './CollectionStatement';
import {CollectionControls} from './CollectionControls';
import {CollectionFilterPanel} from './CollectionFilterPanel';
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
      <CollectionStatement hero={data.hero} hasArtist={Boolean(data.artist)} />
      {data.artist ? <CollectionArtist artist={data.artist} /> : null}

      <div className="container container--wide collection-browser">
        <header className="collection-catalog-intro">
          <p className="collection-catalog-intro__eyebrow">
            {data.artist ? 'Works in this series' : 'The collection'}
          </p>
          <h2>Explore {data.hero.title}</h2>
        </header>

        <CollectionControls
          filterGroups={data.filterGroups}
          searchParams={searchParams}
        />
        <div
          className={`collection-browser__layout ${
            data.filterGroups.length ? '' : 'collection-browser__layout--full'
          }`.trim()}
        >
          {data.filterGroups.length ? (
            <aside
              aria-label="Product filters"
              className="collection-filter-sidebar"
            >
              <h2>Refine</h2>
              <CollectionFilterPanel
                groups={data.filterGroups}
                idPrefix="desktop-filter"
                searchParams={searchParams}
              />
            </aside>
          ) : null}
          <CollectionProductGrid
            connection={connection}
            hasActiveFilters={activeFilters.length > 0}
            searchParams={searchParams}
          />
        </div>
      </div>
    </div>
  );
}
