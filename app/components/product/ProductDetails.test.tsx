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
  it.each([
    [1200, 1600, '12x16', '24x32'],
    [1600, 1200, '16x12', '32x24'],
    [1200, 1200, '12x12', '32x32'],
  ])(
    'uses artwork dimensions %s × %s for sizing copy',
    (width, height, small, large) => {
      const {container} = render(
        <ProductDetails
          artworkImage={{width, height}}
          descriptionHtml="<p>A unique <em>artistic intro</em>.</p>"
          editorial={emptyEditorial}
        />,
      );
      expect(
        screen.getByText(
          `Available in multiple sizes, from versatile ${small}" prints to large-scale ${large}" statement pieces.`,
        ),
      ).toBeInTheDocument();
      const specs = container.querySelector('.product-technical-specs');
      expect(specs?.previousElementSibling?.innerHTML).toBe(
        '<p>A unique <em>artistic intro</em>.</p>',
      );
      expect(specs?.querySelectorAll('li')).toHaveLength(3);
      expect(
        screen.getByRole('heading', {
          name: 'Premium Material Formats',
          level: 3,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: 'Sizing & Display Context',
          level: 3,
        }),
      ).toBeInTheDocument();
    },
  );

  it.each([undefined, {width: null, height: null}, {width: 0, height: 1200}])(
    'uses square sizing as the fallback when dimensions are missing',
    (artworkImage) => {
      render(
        <ProductDetails
          artworkImage={artworkImage}
          descriptionHtml=""
          editorial={emptyEditorial}
        />,
      );
      expect(
        screen.getByText(
          'Available in multiple sizes, from versatile 12x12" prints to large-scale 32x32" statement pieces.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Aluminum Metal Wall Art:')).toBeInTheDocument();
    },
  );

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
