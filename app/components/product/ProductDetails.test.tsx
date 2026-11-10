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

function makeVariants(
  materials: string[],
  sizes: string[],
) {
  return materials.flatMap((material) =>
    sizes.map((size) => ({
      selectedOptions: [
        {name: 'Material', value: material},
        {name: 'Size', value: size},
      ],
    })),
  );
}

describe('ProductDetails', () => {
  it('describes only the metal/canvas formats and sizes present in Shopify variants', () => {
    const {container} = render(
      <ProductDetails
        descriptionHtml="<p>A unique <em>artistic intro</em>.</p>"
        editorial={emptyEditorial}
        variants={makeVariants(['Metal', 'Canvas'], ['16x12', '24x18', '32x24'])}
      />,
    );
    const specs = container.querySelector('.product-technical-specs');
    expect(specs?.previousElementSibling?.innerHTML).toBe(
      '<p>A unique <em>artistic intro</em>.</p>',
    );
    expect(specs?.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('Metal:')).toBeInTheDocument();
    expect(screen.getByText('Canvas:')).toBeInTheDocument();
    expect(screen.getByText('16 × 12 in · 24 × 18 in · 32 × 24 in'))
      .toBeInTheDocument();
    expect(screen.queryByText(/Archival Matte Poster/i))
      .not.toBeInTheDocument();
    expect(screen.queryByText(/12 × 12/))
      .not.toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Available materials', level: 3}))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Available sizes', level: 3}))
      .toBeInTheDocument();
  });

  it('uses variant sizes rather than making up dimensions from square artwork', () => {
    render(
      <ProductDetails
        descriptionHtml=""
        editorial={emptyEditorial}
        variants={makeVariants(['Canvas'], ['16x12', '32x24'])}
      />,
    );
    expect(screen.getByText('16 × 12 in · 32 × 24 in'))
      .toBeInTheDocument();
    expect(screen.queryByText(/12x12|32x32/))
      .not.toBeInTheDocument();
    expect(screen.queryByText('Metal:')).not.toBeInTheDocument();
  });

  it('does not advertise print formats when a product has no matching options', () => {
    const {container} = render(
      <ProductDetails
        descriptionHtml="<p>Apparel description.</p>"
        editorial={emptyEditorial}
        variants={[{selectedOptions: [{name: 'Size', value: 'Medium'}]}]}
      />,
    );
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.queryByText(/metal|canvas|poster/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll('.product-technical-specs li')).toHaveLength(0);
  });

  it('omits unsourced specifications for products with no variants', () => {
    const {container} = render(
      <ProductDetails descriptionHtml="<p>Original copy.</p>" editorial={emptyEditorial} />,
    );
    expect(screen.getByText('Original copy.')).toBeInTheDocument();
    expect(container.querySelector('.product-technical-specs')).toBeNull();
  });

  it('preserves Shopify description HTML without inventing editorial modules', () => {
    render(
      <ProductDetails
        descriptionHtml="<p>Archival print on aluminum.</p>"
        editorial={emptyEditorial}
      />,
    );

    expect(screen.getByText('Archival print on aluminum.')).toBeInTheDocument();
    expect(screen.queryByText('The artwork story')).not.toBeInTheDocument();
    expect(screen.queryByText('See the work at room scale.')).not.toBeInTheDocument();
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
    expect(screen.getByRole('img', {name: 'Artwork in a room'}))
      .toBeInTheDocument();
  });
});
