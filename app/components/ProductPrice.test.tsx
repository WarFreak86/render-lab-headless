import {render, screen} from '@testing-library/react';
import {ProductPrice} from './ProductPrice';

vi.mock('@shopify/hydrogen', () => ({
  Money: ({data}: {data: {amount: string}}) => <span>{data.amount}</span>,
}));

const price = {amount: '79.00', currencyCode: 'USD' as const};

describe('ProductPrice', () => {
  it.each([null, '0', '0.00', '79.00', '50.00'])('hides compare-at value %s when it is not a discount', (amount) => {
    const compareAtPrice = amount === null ? null : {amount, currencyCode: 'USD' as const};
    const {container} = render(<ProductPrice price={price} compareAtPrice={compareAtPrice} />);
    expect(screen.getByText('79.00')).toBeInTheDocument();
    expect(container.querySelector('s')).toBeNull();
  });
  it('shows a valid higher compare-at price', () => {
    const {container} = render(<ProductPrice price={price} compareAtPrice={{amount: '99.00', currencyCode: 'USD'}} />);
    expect(container.querySelector('s')).toHaveTextContent('99.00');
  });
});
