import React, {createElement} from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {Aside} from '~/components/Aside';
import {CartMain} from '~/components/CartMain';

const cartMock = vi.hoisted(() => ({
  fetcher: {data: undefined as unknown, state: 'idle'},
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useFetcher: () => cartMock.fetcher,
  };
});

vi.mock('~/lib/variants', () => ({
  useVariantUrl: (handle: string) => `/products/${handle}`,
}));

vi.mock('@shopify/hydrogen', () => {
  function CartForm({
    action,
    children,
    fetcherKey,
    inputs,
  }: {
    action: string;
    children:
      React.ReactNode | ((fetcher: typeof cartMock.fetcher) => React.ReactNode);
    fetcherKey?: string;
    inputs?: unknown;
  }) {
    return (
      <form
        data-action={action}
        data-fetcher-key={fetcherKey}
        data-inputs={JSON.stringify(inputs ?? {})}
      >
        {typeof children === 'function'
          ? children({
              data: undefined,
              state: 'idle',
            } as typeof cartMock.fetcher)
          : children}
      </form>
    );
  }
  CartForm.ACTIONS = {
    DiscountCodesUpdate: 'DiscountCodesUpdate',
    GiftCardCodesAdd: 'GiftCardCodesAdd',
    GiftCardCodesRemove: 'GiftCardCodesRemove',
    LinesRemove: 'LinesRemove',
    LinesUpdate: 'LinesUpdate',
    NoteUpdate: 'NoteUpdate',
  };

  function Money({
    as = 'span',
    className,
    data,
  }: {
    as?: string;
    className?: string;
    data: {amount?: string; currencyCode?: string};
  }) {
    return createElement(
      as,
      {className, 'data-money': data.amount},
      `$${Number(data.amount).toFixed(2)}`,
    );
  }

  return {
    CartForm,
    Image: ({alt}: {alt: string}) => <img alt={alt} />,
    Money,
    useOptimisticCart: (cart: unknown) => cart,
  };
});

function line({
  id = 'gid://shopify/CartLine/line-1',
  quantity = 1,
  selectedOptions = [
    {name: 'Size', value: 'Large'},
    {name: 'Title', value: 'Default Title'},
  ],
  total = '80.00',
} = {}) {
  return {
    id,
    quantity,
    attributes: [],
    cost: {
      amountPerQuantity: {amount: '80.00', currencyCode: 'USD'},
      compareAtAmountPerQuantity: null,
      totalAmount: {amount: total, currencyCode: 'USD'},
    },
    merchandise: {
      id: 'gid://shopify/ProductVariant/variant-1',
      availableForSale: true,
      compareAtPrice: null,
      image: {
        altText: 'Marine hoodie',
        height: 1200,
        id: 'image-1',
        url: 'https://cdn.shopify.com/image.jpg',
        width: 1200,
      },
      price: {amount: '80.00', currencyCode: 'USD'},
      product: {
        handle: 'marine-hoodie',
        id: 'gid://shopify/Product/product-1',
        title: 'Marine Hoodie',
        vendor: 'Render-Lab',
      },
      requiresShipping: true,
      selectedOptions,
      title: selectedOptions[0]?.value ?? 'Default Title',
    },
    parentRelationship: null,
  };
}

function cart({
  checkoutUrl = 'https://render-lab-3.myshopify.com/cart/c/test',
  lines = [line()],
  subtotal = '80.00',
  totalQuantity = 1,
} = {}) {
  return {
    appliedGiftCards: [],
    attributes: [],
    buyerIdentity: {},
    checkoutUrl,
    cost: {
      subtotalAmount: {amount: subtotal, currencyCode: 'USD'},
      totalAmount: {amount: subtotal, currencyCode: 'USD'},
      totalDutyAmount: null,
      totalTaxAmount: null,
    },
    discountCodes: [],
    id: 'gid://shopify/Cart/cart-1',
    lines: {nodes: lines},
    note: '',
    totalQuantity,
    updatedAt: '2026-08-25T00:00:00Z',
  };
}

function renderCart(value: ReturnType<typeof cart>) {
  return render(
    <MemoryRouter>
      <Aside.Provider>
        <CartMain cart={value as any} layout="aside" />
      </Aside.Provider>
    </MemoryRouter>,
  );
}

describe('premium cart', () => {
  beforeEach(() => {
    cartMock.fetcher.data = undefined;
    cartMock.fetcher.state = 'idle';
  });

  it('renders exact selected options and hides Default Title', () => {
    renderCart(cart());
    expect(screen.getByText('Large')).toBeInTheDocument();
    expect(screen.queryByText('Default Title')).not.toBeInTheDocument();
    expect(screen.getByText('Marine Hoodie')).toHaveAttribute(
      'href',
      '/products/marine-hoodie',
    );
  });

  it('submits the correct Shopify line update when quantity increases', () => {
    renderCart(cart());
    const button = screen.getByRole('button', {
      name: 'Increase quantity of Marine Hoodie',
    });
    const form = button.closest('form');
    expect(form).toHaveAttribute('data-action', 'LinesUpdate');
    expect(JSON.parse(form?.getAttribute('data-inputs') || '{}')).toEqual({
      lines: [{id: 'gid://shopify/CartLine/line-1', quantity: 2}],
    });
  });

  it('submits the correct Shopify line update when quantity decreases', () => {
    renderCart(
      cart({
        lines: [line({quantity: 2, total: '160.00'})],
        subtotal: '160.00',
        totalQuantity: 2,
      }),
    );
    const form = screen
      .getByRole('button', {name: 'Decrease quantity of Marine Hoodie'})
      .closest('form');
    expect(JSON.parse(form?.getAttribute('data-inputs') || '{}')).toEqual({
      lines: [{id: 'gid://shopify/CartLine/line-1', quantity: 1}],
    });
  });

  it('removes the exact Shopify cart line ID', () => {
    renderCart(cart());
    const form = screen
      .getByRole('button', {name: 'Remove Marine Hoodie from cart'})
      .closest('form');
    expect(form).toHaveAttribute('data-action', 'LinesRemove');
    expect(JSON.parse(form?.getAttribute('data-inputs') || '{}')).toEqual({
      lineIds: ['gid://shopify/CartLine/line-1'],
    });
  });

  it('uses Shopify subtotal and checkout URL without client arithmetic', () => {
    renderCart(cart({subtotal: '127.50'}));
    expect(screen.getByText('$127.50')).toHaveAttribute('data-money', '127.50');
    expect(screen.getByRole('link', {name: 'Checkout'})).toHaveAttribute(
      'href',
      'https://render-lab-3.myshopify.com/cart/c/test',
    );
  });

  it('renders an intentional empty state without checkout', () => {
    renderCart(
      cart({checkoutUrl: '', lines: [], subtotal: '0', totalQuantity: 0}),
    );
    expect(
      screen.getByRole('heading', {name: 'Your collection starts here.'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: 'Explore wall art'}),
    ).toHaveAttribute('href', '/collections/wall-art');
    expect(
      screen.queryByRole('link', {name: 'Checkout'}),
    ).not.toBeInTheDocument();
  });

  it('keeps shipping progress and recommendations hidden without real data', () => {
    renderCart(cart());
    expect(
      screen.queryByRole('region', {name: 'Shipping progress'}),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/you may also like/i)).not.toBeInTheDocument();
  });

  it('reports a pending mutation without disabling rapid stable-line updates', () => {
    cartMock.fetcher.state = 'submitting';
    renderCart(cart());
    expect(screen.getByText('Updating cart…')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: 'Increase quantity of Marine Hoodie'}),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', {name: 'Increase quantity of Marine Hoodie'}),
    ).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a safe accessible error instead of raw GraphQL output', () => {
    cartMock.fetcher.data = {
      errors: [{message: 'GraphQL variable $lines received invalid ID'}],
    };
    renderCart(cart());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We couldn’t update your cart. Please try again.',
    );
    expect(screen.queryByText(/GraphQL variable/)).not.toBeInTheDocument();
  });

  it('submits order notes through Shopify CartForm', () => {
    renderCart(cart());
    const noteForm = screen
      .getByText('Add an order note')
      .closest('details')
      ?.querySelector('form');
    expect(noteForm).toHaveAttribute('data-action', 'NoteUpdate');
  });
});
