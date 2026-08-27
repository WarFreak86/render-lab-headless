import {render, screen} from '@testing-library/react';
import {ProductDetails} from './ProductDetails';

vi.mock('@shopify/hydrogen', () => ({
  Image: ({alt, data}: {alt: string; data: {url: string}}) => (
    <img alt={alt} src={data.url} />
  ),
}));

const emptyEditorial = {
  highlights: [],
  roomImages: [],
};

describe('ProductDetails', () => {
  it('preserves Shopify description HTML without inventing editorial modules', () => {
    render(
      <ProductDetails
        descriptionHtml="<p>Archival print on aluminum.</p>"
        editorial={emptyEditorial}
      />,
    );

    expect(screen.getByText('Archival print on aluminum.')).toBeInTheDocument();
    expect(screen.queryByText('The artwork story')).not.toBeInTheDocument();
    expect(
      screen.queryByText('See the work at room scale.'),
    ).not.toBeInTheDocument();
  });

  it('renders edition, story, highlights, and room preview only from merchant data', () => {
    render(
      <ProductDetails
        descriptionHtml=""
        editorial={{
          artworkStory: 'A study in speculative history.',
          collectorInformation: 'Numbered by the studio.',
          editionSize: 'Edition of 25',
          highlights: ['Archival pigments'],
          roomImages: [
            {id: 'room', url: '/room.jpg', altText: 'Artwork in a room'},
          ],
        }}
      />,
    );

    expect(screen.getByText('Edition of 25')).toBeInTheDocument();
    expect(screen.getByText('The artwork story')).toBeInTheDocument();
    expect(screen.getByText('Archival pigments')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {name: 'Artwork in a room'}),
    ).toBeInTheDocument();
  });
});
