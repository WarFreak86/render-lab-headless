import {useState} from 'react';
import {Form, Link} from 'react-router';
import {Button} from '~/components/Button';
import {Drawer} from '~/components/Drawer';
import {CollectionFilterPanel} from './CollectionFilterPanel';
import {
  COLLECTION_SORT_OPTIONS,
  clearCollectionFilters,
  getActiveCollectionFilters,
  parseSortValue,
  removeActiveFilter,
  type CollectionFilterGroup,
} from '~/lib/collection';

function PreservedFilterInputs({searchParams}: {searchParams: URLSearchParams}) {
  return Array.from(searchParams.entries()).flatMap(([name, value]) =>
    name.startsWith('filter.') ? (
      <input key={`${name}-${value}`} name={name} type="hidden" value={value} />
    ) : (
      []
    ),
  );
}

export function CollectionControls({
  filterGroups,
  searchParams,
}: {
  filterGroups: CollectionFilterGroup[];
  searchParams: URLSearchParams;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeFilters = getActiveCollectionFilters(searchParams, filterGroups);
  const sort = parseSortValue(searchParams);
  const hasFilters = filterGroups.length > 0;

  return (
    <>
      <div className="collection-controls">
        <div className="collection-controls__filter-trigger">
          {hasFilters ? (
            <>
              <Button onClick={() => setDrawerOpen(true)} variant="secondary">
                Filters{activeFilters.length ? ` (${activeFilters.length})` : ''}
              </Button>
              <span className="collection-controls__desktop-label">Filters</span>
            </>
          ) : (
            <span className="collection-controls__catalog-label">Full catalog</span>
          )}
        </div>
        <Form className="collection-sort" method="get">
          <PreservedFilterInputs searchParams={searchParams} />
          <label htmlFor="collection-sort-select">Sort by</label>
          <select
            id="collection-sort-select"
            name="sort_by"
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            value={sort}
          >
            {COLLECTION_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Form>
      </div>

      {activeFilters.length ? (
        <div aria-label="Active filters" className="collection-active-filters">
          <span>Selected</span>
          {activeFilters.map((filter) => (
            <Link
              aria-label={`Remove ${filter.label} filter`}
              key={filter.id}
              preventScrollReset
              to={removeActiveFilter(searchParams, filter)}
            >
              {filter.label} <span aria-hidden="true">×</span>
            </Link>
          ))}
          <Link className="collection-active-filters__clear" to={clearCollectionFilters(searchParams)}>
            Clear all
          </Link>
        </div>
      ) : null}

      {hasFilters ? (
        <Drawer
          className="collection-filter-drawer"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          placement="left"
          title="Filters"
        >
          <CollectionFilterPanel
            groups={filterGroups}
            idPrefix="mobile-filter"
            onApply={() => setDrawerOpen(false)}
            searchParams={searchParams}
          />
        </Drawer>
      ) : null}
    </>
  );
}
