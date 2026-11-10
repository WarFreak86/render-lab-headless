import {render, screen, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {CollectionBuyingGuide} from './CollectionBuyingGuide';
import {CollectionDirectoryView} from './CollectionDirectoryView';

it('helps Carnivora buyers choose real compositions and their different orientations', () => {
  render(
    <MemoryRouter>
      <CollectionBuyingGuide handle="carnivora" />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', {name: 'Choosing carnivorous plant wall art'}),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', {name: 'Open Trap — Carnivora No. 01'}),
  ).toHaveAttribute('href', '/products/carnivora-no-01-open-trap');
  expect(
    screen.getByRole('link', {name: 'Crown of Dew — Carnivora No. 02'}),
  ).toHaveAttribute('href', '/products/carnivora-no-02-crown-of-dew');
  expect(
    screen.getByRole('link', {name: 'Devour — Carnivora No. 09'}),
  ).toHaveAttribute('href', '/products/carnivora-no-09-devour');
  expect(
    screen.getByText(/Devour offers 12 × 16, 18 × 24, and 24 × 32/),
  ).toBeInTheDocument();
});

it.each(['metal-wall-art', 'wall-art'] as const)(
  'limits the metal guide to its existing hub (%s)',
  (handle) => {
    render(
      <MemoryRouter>
        <CollectionDirectoryView
          directoryHandle={handle}
          entries={[]}
          hero={{
            title: 'Existing collection',
            description: 'Original introduction',
            image: null,
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Original introduction')).toBeInTheDocument();
    const guide = screen.queryByRole('region', {
      name: 'Choosing decorative metal wall prints',
    });
    if (handle === 'wall-art') {
      expect(guide).not.toBeInTheDocument();
    } else {
      expect(guide).toBeInTheDocument();
      expect(
        within(guide!).getByRole('link', {name: 'Carnivora in Metal'}),
      ).toHaveAttribute('href', '/collections/carnivora?material=Metal');
    }
  },
);
