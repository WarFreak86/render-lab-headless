import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryRouter, MemoryRouter, RouterProvider} from 'react-router';
import {CollectionControls} from './CollectionControls';
import {CollectionProductCard} from './CollectionProductCard';
import {CollectionProductGrid} from './CollectionProductGrid';
import {CollectionDirectoryView} from './CollectionDirectoryView';
import {CollectionArtist} from './CollectionArtist';
import type {
  CollectionFilterGroup,
  CollectionProductCardData,
} from '~/lib/collection';

const product: CollectionProductCardData = {
  id: 'product-1',
  handle: 'real-artwork',
  title: 'Real Artwork',
  to: '/products/real-artwork',
  productType: 'Aluminum',
  availableForSale: true,
  image: {
    url: 'https://cdn.shopify.com/real.jpg',
    altText: 'Real artwork on aluminum',
    width: 1600,
    height: 1200,
  },
  minPrice: {amount: '80.00', currencyCode: 'USD'},
  maxPrice: {amount: '80.00', currencyCode: 'USD'},
};

const filters: CollectionFilterGroup[] = [
  {
    id: 'filter.v.availability',
    label: 'Availability',
    type: 'list',
    options: [
      {
        id: 'filter.v.availability.1',
        label: 'In stock',
        count: 1,
        value: '1',
      },
    ],
  },
];

function renderDataRouter(
  element: React.ReactNode,
  entry = '/collections/metal',
) {
  return render(
    <RouterProvider
      router={createMemoryRouter([{path: '*', element}], {
        initialEntries: [entry],
      })}
    />,
  );
}

describe('collection presentation', () => {
  it('links a Shopify-backed product card to its real PDP', () => {
    render(
      <MemoryRouter>
        <CollectionProductCard product={product} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: /Real Artwork/i})).toHaveAttribute(
      'href',
      '/products/real-artwork',
    );
  });

  it('opens the mobile filter drawer and restores focus after Escape', async () => {
    const user = userEvent.setup();
    renderDataRouter(
      <CollectionControls
        filterGroups={filters}
        searchParams={new URLSearchParams()}
      />,
    );
    const trigger = screen.getByRole('button', {name: 'Filters'});
    await user.click(trigger);
    expect(screen.getByRole('dialog', {name: 'Filters'})).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', {name: 'Filters'}),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('renders an intentional no-results state with clear behavior', () => {
    renderDataRouter(
      <CollectionProductGrid
        connection={{
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        }}
        hasActiveFilters
        searchParams={new URLSearchParams('filter.v.availability=0')}
      />,
      '/collections/metal?filter.v.availability=0',
    );
    expect(
      screen.getByRole('heading', {
        name: 'No pieces match the current filters.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Clear filters'})).toHaveAttribute(
      'href',
      '/collections/metal',
    );
  });

  it('handles missing product imagery without dropping product details', () => {
    render(
      <MemoryRouter>
        <CollectionProductCard product={{...product, image: null}} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Artwork unavailable')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {name: 'Real Artwork'}),
    ).toBeInTheDocument();
  });

  it('presents Wall Art as collection links instead of one product grid', () => {
    render(
      <MemoryRouter>
        <CollectionDirectoryView
          entries={[
            {
              id: 'collection-botanical',
              handle: 'botanical-anomalies',
              title: 'Botanical Anomalies',
              description: 'Surreal botanical artwork.',
              image: null,
              to: '/collections/botanical-anomalies',
            },
          ]}
          hero={{
            title: 'Wall Art',
            eyebrow: 'Wall art',
            editorialHeading: 'Art built to change the room.',
            image: null,
          }}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {name: 'Browse by collection'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: /Botanical Anomalies/i}),
    ).toHaveAttribute('href', '/collections/botanical-anomalies');
    expect(screen.queryByText('$29.00')).not.toBeInTheDocument();
  });

  it('renders artist attribution only from supplied collection data', () => {
    render(
      <CollectionArtist
        artist={{
          id: 'artist-1',
          handle: 'render-lab-studio',
          name: 'Render-Lab Studio',
          biography: 'Independent artists and art directors.',
          image: null,
          profileUrl: '/pages/artists/render-lab-studio',
        }}
      />,
    );

    expect(
      screen.getByRole('heading', {name: 'Render-Lab Studio'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: /View artist profile/i}),
    ).toHaveAttribute('href', '/pages/artists/render-lab-studio');
  });
});
