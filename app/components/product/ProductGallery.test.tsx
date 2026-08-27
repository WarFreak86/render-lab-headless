import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ProductGallery} from './ProductGallery';

vi.mock('@shopify/hydrogen', () => ({
  Image: ({alt, data}: {alt: string; data: {url: string}}) => (
    <img alt={alt} src={data.url} />
  ),
}));

const images = [
  {id: 'one', url: '/one.jpg', altText: 'Front view', width: 800, height: 800},
  {id: 'two', url: '/two.jpg', altText: 'Detail view', width: 800, height: 800},
];

describe('ProductGallery', () => {
  it('changes the active media from an accessible thumbnail control', async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={images} title="Artwork" />);

    const second = screen.getByRole('button', {name: 'View image 2 of 2'});
    expect(second).toHaveAttribute('aria-pressed', 'false');
    await user.click(second);
    expect(second).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('opens an accessible zoom dialog and supports next/previous controls', async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={images} title="Artwork" />);
    await user.click(screen.getByRole('button', {name: 'Zoom image 1'}));

    expect(
      screen.getByRole('dialog', {name: /Artwork — image 1 of 2/}),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Next image'}));
    expect(
      screen.getByRole('dialog', {name: /Artwork — image 2 of 2/}),
    ).toBeInTheDocument();
  });

  it('renders a reserved fallback when product media is missing', () => {
    const {container} = render(
      <ProductGallery images={[]} presentation="apparel" title="Artwork" />,
    );
    expect(screen.getByText('Artwork preview unavailable')).toBeInTheDocument();
    expect(container.querySelector('.product-gallery--apparel')).toBeInTheDocument();
  });

  it('applies the drop apparel presentation without changing media controls', () => {
    const {container} = render(
      <ProductGallery images={images} presentation="drop" title="Hoodie" />,
    );
    expect(container.querySelector('.product-gallery--drop')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'View image 2 of 2'})).toBeEnabled();
  });
});
