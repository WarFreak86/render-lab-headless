import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import type {ChoiceVariant} from '~/lib/product-confidence';
import {ProductConfidenceSections} from './ProductConfidenceSections';

vi.mock('@shopify/hydrogen', () => ({
  Image: ({data, alt}: {data: {url: string}; alt: string}) => (
    <img src={data.url} alt={alt} />
  ),
  Money: ({data}: {data: {amount: string}}) => <span>${data.amount}</span>,
}));
const variant: ChoiceVariant = {
  id: 'portrait',
  availableForSale: true,
  price: {amount: '119', currencyCode: 'USD'},
  selectedOptions: [
    {name: 'Material', value: 'Canvas'},
    {name: 'Size', value: '24x32'},
  ],
};
const artwork = {id: 'art', url: '/artwork.png', altText: 'Original artwork'};

describe('print scale guidance', () => {
  it('keeps portrait dimensions, converts reference units and rejects zero without corrupting the scale', () => {
    const {container} = render(
      <MemoryRouter>
        <ProductConfidenceSections
          artwork={artwork}
          images={[]}
          selectedVariant={variant}
          variants={[variant]}
          onSelect={vi.fn()}
        />
      </MemoryRouter>,
    );
    const art = container.querySelector('.confidence-scene__art');
    expect(
      Number.parseFloat((art as HTMLElement).style.height),
    ).toBeGreaterThan(Number.parseFloat((art as HTMLElement).style.width));
    expect(
      screen.getByText('This print is 29% of the sofa’s width.'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton', {name: /Sofa width/}), {
      target: {value: '0'},
    });
    expect(screen.getByRole('alert')).toHaveTextContent('36 and 144 inches');
    expect(
      screen.getByText('This print is 29% of the sofa’s width.'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton', {name: /Sofa width/}), {
      target: {value: '96'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'cm'}));
    expect(screen.getByRole('spinbutton', {name: /Sofa width/})).toHaveValue(
      243.8,
    );
    expect(
      screen.getByText('This print is 25% of the sofa’s width.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('does not crop an oversized portrait to pretend it fits above furniture', () => {
    const {container} = render(
      <MemoryRouter>
        <ProductConfidenceSections
          artwork={artwork}
          images={[]}
          selectedVariant={variant}
          variants={[variant]}
          onSelect={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole('spinbutton', {name: /Sofa width/}), {
      target: {value: '36'},
    });
    expect(container.querySelector('.confidence-scene__art')).toBeNull();
    expect(
      screen.getByText(/exceeds the illustrated hanging area/),
    ).toBeInTheDocument();
  });
});
