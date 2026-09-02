import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {CollectionProductCard} from './CollectionProductCard';
import type {CollectionProductCardData} from '~/lib/collection';

const product: CollectionProductCardData = {
  id: 'product-echoes-1',
  handle: 'jungle-ghosts-echoes-of-war',
  title: 'Jungle Ghosts — Echoes of War',
  to: '/products/jungle-ghosts-echoes-of-war',
  productType: 'Wall Art',
  availableForSale: true,
  image: {
    url: 'https://cdn.shopify.com/jungle-ghosts.jpg',
    altText: 'Jungle Ghosts artwork',
    width: 1800,
    height: 2400,
  },
  minPrice: {amount: '29.00', currencyCode: 'USD'},
  maxPrice: {amount: '169.00', currencyCode: 'USD'},
};

describe('collection catalog cards', () => {
  it('presents artwork title, artist and series instead of product-type clutter', () => {
    render(
      <MemoryRouter>
        <CollectionProductCard
          context={{
            artistName: 'Render-Lab Studio',
            collectionTitle: 'Echoes of War',
          }}
          product={product}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {name: 'Jungle Ghosts', level: 2}),
    ).toBeInTheDocument();
    expect(screen.getByText('Render-Lab Studio · Echoes of War')).toBeInTheDocument();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.queryByText('Wall Art')).not.toBeInTheDocument();
  });

  it('does not substitute generic format collections for real series attribution', () => {
    render(
      <MemoryRouter>
        <CollectionProductCard
          context={{collectionTitle: 'Metal Wall Art'}}
          product={{...product, title: 'Untitled Signal'}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', {name: 'Untitled Signal'})).toBeInTheDocument();
    expect(screen.queryByText('Metal Wall Art')).not.toBeInTheDocument();
  });

  it('keeps unavailable state visible without moving merchandising copy below the artwork', () => {
    render(
      <MemoryRouter>
        <CollectionProductCard product={{...product, availableForSale: false}} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /Jungle Ghosts/i})).toHaveAttribute(
      'href',
      '/products/jungle-ghosts-echoes-of-war',
    );
  });
});
