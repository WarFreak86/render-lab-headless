import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {describe, expect, it} from 'vitest';
import {CollectionArtist} from '../CollectionArtist';
import {CollectionStatement} from '../CollectionStatement';

const hero = {
  title: 'Echoes of War',
  description: 'A cinematic collection about memory and conflict.',
  image: null,
};

describe('collection storytelling', () => {
  it('renders collection copy as a dedicated statement', () => {
    render(<CollectionStatement hero={hero} hasArtist={false} />);

    expect(screen.getByRole('heading', {name: 'About the collection'})).toBeInTheDocument();
    expect(screen.getByText(hero.description)).toBeInTheDocument();
  });

  it('uses the artist route when no custom profile URL exists', () => {
    render(
      <MemoryRouter>
        <CollectionArtist
          artist={{
            id: 'artist-1',
            handle: 'studio-archive',
            name: 'Studio Archive',
            biography: 'A short artist biography.',
            image: null,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', {name: /view artist profile/i})).toHaveAttribute(
      'href',
      '/artists/studio-archive',
    );
  });
});
