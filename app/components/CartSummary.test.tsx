import {render, screen, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {CartSummary} from './CartSummary';

vi.mock('~/components/Aside', () => ({
  useAside: () => ({close: vi.fn()}),
}));

vi.mock('@shopify/hydrogen', () => {
  function CartForm({children}: {children: React.ReactNode | ((fetcher: unknown) => React.ReactNode)}) {
    const content = typeof children === 'function'
      ? children({state: 'idle', data: undefined})
      : children;
    return <form>{content}</form>;
  }
  CartForm.ACTIONS = {
    DiscountCodesUpdate: 'DiscountCodesUpdate',
    GiftCardCodesAdd: 'GiftCardCodesAdd',
    GiftCardCodesRemove: 'GiftCardCodesRemove',
  };
  function Money({data}: {data: {amount: string; currencyCode: string}}) {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currencyCode,
    }).format(Number(data.amount));
    return <span>{formatted}</span>;
  }
  return {CartForm, Money};
});

const dollar = (amount: string) => ({amount, currencyCode: 'USD'});

function mockCart({
  subtotal = '79.00',
  total = '79.00',
  code = false,
  allocated = '0.00',
}: {
  subtotal?: string;
  total?: string;
  code?: boolean;
  allocated?: string;
} = {}) {
  return {
    totalQuantity: 1,
    checkoutUrl: 'https://checkout.render-lab.org/checkouts/test',
    cost: {
      subtotalAmount: dollar(subtotal),
      totalAmount: dollar(total),
    },
    appliedGiftCards: [],
    discountCodes: code ? [{code: 'TESTPROMO', applicable: true}] : [],
    discountAllocations: Number(allocated) > 0
      ? [{targetType: 'LINE_ITEM', discountedAmount: dollar(allocated)}]
      : [],
  } as never;
}

describe('CartSummary discount presentation', () => {
  it.each(['aside', 'page'] as const)(
    'renders the discounted total and savings in the %s cart',
    (layout) => {
      render(
        <MemoryRouter>
          <CartSummary layout={layout} cart={mockCart({
            total: '0.00', allocated: '79.00', code: true,
          })} />
        </MemoryRouter>,
      );

      const subtotal = document.querySelector('.cart-summary__subtotal')!;
      const discount = document.querySelector('.cart-summary__discount')!;
      const total = document.querySelector('.cart-summary__total')!;

      expect(within(subtotal as HTMLElement).getByText('$79.00')).toBeInTheDocument();
      expect(within(discount as HTMLElement).getByText('$79.00')).toBeInTheDocument();
      expect(within(total as HTMLElement).getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('Estimated total')).toBeInTheDocument();
      expect(screen.getByText('TESTPROMO')).toBeInTheDocument();
    },
  );

  it('shows a standard total without manufacturing a discount', () => {
    render(
      <MemoryRouter>
        <CartSummary layout="aside" cart={mockCart()} />
      </MemoryRouter>,
    );

    expect(document.querySelector('.cart-summary__discount')).toBeNull();
    expect(within(document.querySelector('.cart-summary__total') as HTMLElement)
      .getByText('$79.00')).toBeInTheDocument();
  });

  it('keeps code-only offers honest if Shopify prices them at checkout', () => {
    render(
      <MemoryRouter>
        <CartSummary layout="aside" cart={mockCart({code: true})} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Any remaining savings are confirmed at checkout/))
      .toBeInTheDocument();
    expect(document.querySelector('.cart-summary__discount')).toBeNull();
  });
});
