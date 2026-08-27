import {CollectionHero} from './CollectionHero';
import {CollectionControls} from './CollectionControls';
import {CollectionFilterPanel} from './CollectionFilterPanel';
import {CollectionProductGrid} from './CollectionProductGrid';
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
    <div className="collection-experience">
      <CollectionHero hero={data.hero} />
      <div className="container container--wide collection-browser">
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
            <aside aria-label="Product filters" className="collection-filter-sidebar">
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
