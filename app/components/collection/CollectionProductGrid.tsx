import {Pagination} from '@shopify/hydrogen';
import {ButtonLink} from '~/components/Button';
import {CollectionProductCard} from './CollectionProductCard';
import {
  clearCollectionFilters,
  type CollectionProductCardData,
} from '~/lib/collection';

interface ProductConnection {
  nodes: CollectionProductCardData[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
}

export function CollectionProductGrid({
  connection,
  hasActiveFilters,
  searchParams,
}: {
  connection: ProductConnection;
  hasActiveFilters: boolean;
  searchParams: URLSearchParams;
}) {
  if (!connection.nodes.length) {
    return (
      <section className="collection-empty" aria-labelledby="collection-empty-title">
        <p>Nothing in this view</p>
        <h2 id="collection-empty-title">
          {hasActiveFilters
            ? 'No pieces match the current filters.'
            : 'No pieces are available in this collection yet.'}
        </h2>
        {hasActiveFilters ? (
          <ButtonLink to={clearCollectionFilters(searchParams)}>
            Clear filters
          </ButtonLink>
        ) : (
          <ButtonLink to="/collections">Explore collections</ButtonLink>
        )}
      </section>
    );
  }

  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, PreviousLink, NextLink, hasPreviousPage, hasNextPage}) => (
        <div className="collection-pagination">
          {hasPreviousPage ? (
            <PreviousLink className="collection-pagination__previous">
              {isLoading ? 'Loading…' : 'Load previous pieces'}
            </PreviousLink>
          ) : null}
          <section aria-label="Collection products" className="collection-product-grid">
            {nodes.map((product, index) => (
              <CollectionProductCard
                key={product.id}
                loading={index < 4 ? 'eager' : 'lazy'}
                product={product}
              />
            ))}
          </section>
          {hasNextPage ? (
            <NextLink className="button button--secondary collection-pagination__next">
              <span>{isLoading ? 'Loading…' : 'Load more pieces'}</span>
            </NextLink>
          ) : (
            <p className="collection-pagination__end">End of collection</p>
          )}
        </div>
      )}
    </Pagination>
  );
}
