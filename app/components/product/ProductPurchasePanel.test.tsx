import {render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {Aside} from '~/components/Aside';
import {ProductPurchasePanel} from './ProductPurchasePanel';

const mockCart = vi.hoisted(() => ({
  fetcher: {data: undefined as unknown, state: 'idle'},
}));

vi.mock('@shopify/hydrogen', () => {
  function CartForm({
    children,
    inputs,
  }: {
    children: (fetcher: typeof mockCart.fetcher) => React.ReactNode;
    inputs: {lines: unknown[]};
  }) {
    return (
      <form data-lines={JSON.stringify(inputs.lines)}>
        {children(mockCart.fetcher)}
      </form>
    );
  }
  CartForm.ACTIONS = {LinesAdd: 'LinesAdd'};
  return {
    CartForm,
    Money: ({data}: {data: {amount: string; currencyCode: string}}) => (
      <span>
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: data.currencyCode,
        }).format(Number(data.amount))}
      </span>
    ),
  };
});

function variant({
  amount = '80.00',
  available = true,
  id = 'gid://shopify/ProductVariant/1',
} = {}) {
  return {
    availableForSale: available,
    compareAtPrice: null,
    id,
    image: null,
    price: {amount, currencyCode: 'USD'},
    product: {
      id: 'gid://shopify/Product/1',
      handle: 'artwork',
      title: 'Artwork',
    },
    selectedOptions: [{name: 'Size', value: 'Small'}],
    sku: 'ART-S',
    title: 'Small',
    unitPrice: null,
  } as any;
}

function renderPanel({
  options,
  selectedVariant = variant(),
}: {
  options: any[];
  selectedVariant?: any;
}) {
  return render(
    <MemoryRouter>
      <Aside.Provider>
        <ProductPurchasePanel
          product={{
            handle: 'artwork',
            productType: 'Metal print',
            title: 'Artwork',
          }}
          productOptions={options}
          selectedVariant={selectedVariant}
        />
        <Aside type="cart" heading="Your cart">
          Cart contents
        </Aside>
      </Aside.Provider>
    </MemoryRouter>,
  );
}

describe('ProductPurchasePanel', () => {
  beforeEach(() => {
    mockCart.fetcher.data = undefined;
    mockCart.fetcher.state = 'idle';
  });

  it('handles a single default variant without showing a meaningless selector', () => {
    const selectedVariant = variant();
    const {container} = renderPanel({
      options: [
        {
          name: 'Title',
          optionValues: [
            {
              name: 'Default Title',
              available: true,
              exists: true,
              selected: true,
            },
          ],
        },
      ],
      selectedVariant,
    });

    expect(
      screen.queryByRole('group', {name: 'Title'}),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /Add to cart.*\$80\.00/}),
    ).toBeEnabled();
    const lines = JSON.parse(
      container.querySelector('form')?.getAttribute('data-lines') || '[]',
    ) as Array<{merchandiseId: string}>;
    expect(lines[0].merchandiseId).toBe('gid://shopify/ProductVariant/1');
  });

  it('shows selected, sold-out, and impossible option values as distinct states', () => {
    renderPanel({
      options: [
        {
          name: 'Size',
          optionValues: [
            {name: 'Small', available: true, exists: true, selected: true},
            {name: 'Medium', available: false, exists: true, selected: false},
            {name: 'Large', available: false, exists: false, selected: false},
          ],
        },
      ],
    });

    expect(screen.getByRole('button', {name: 'Small'})).toHaveAttribute(
      'data-state',
      'selected',
    );
    expect(
      screen.getByRole('button', {name: /Medium\s*Sold out/}),
    ).toHaveAttribute('data-state', 'sold-out');
    expect(
      screen.getByRole('button', {name: /Large\s*Unavailable combination/}),
    ).toBeDisabled();
  });

  it('updates the displayed price and disables purchase for a sold-out variant', () => {
    const {rerender} = renderPanel({
      options: [],
      selectedVariant: variant({amount: '90.00'}),
    });
    expect(
      screen.getByRole('button', {name: /Add to cart.*\$90\.00/}),
    ).toBeEnabled();

    rerender(
      <MemoryRouter>
        <Aside.Provider>
          <ProductPurchasePanel
            product={{
              handle: 'artwork',
              productType: 'Metal print',
              title: 'Artwork',
            }}
            productOptions={[]}
            selectedVariant={variant({amount: '90.00', available: false})}
          />
        </Aside.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', {name: 'Sold out'})).toBeDisabled();
    expect(screen.getByText('Currently unavailable')).toBeInTheDocument();
  });

  it('announces cart errors without opening commerce UI prematurely', () => {
    mockCart.fetcher.data = {
      errors: [{message: 'Variant is no longer available'}],
    };
    renderPanel({options: []});
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Variant is no longer available',
    );
  });

  it('opens the cart only after a successful Shopify addition settles', async () => {
    const options: any[] = [];
    const selectedVariant = variant();
    const view = renderPanel({options, selectedVariant});

    mockCart.fetcher.state = 'submitting';
    view.rerender(
      <MemoryRouter>
        <Aside.Provider>
          <ProductPurchasePanel
            product={{
              handle: 'artwork',
              productType: 'Metal print',
              title: 'Artwork',
            }}
            productOptions={options}
            selectedVariant={selectedVariant}
          />
          <Aside type="cart" heading="Your cart">
            Cart contents
          </Aside>
        </Aside.Provider>
      </MemoryRouter>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    mockCart.fetcher.data = {cart: {id: 'gid://shopify/Cart/1'}};
    mockCart.fetcher.state = 'idle';
    view.rerender(
      <MemoryRouter>
        <Aside.Provider>
          <ProductPurchasePanel
            product={{
              handle: 'artwork',
              productType: 'Metal print',
              title: 'Artwork',
            }}
            productOptions={options}
            selectedVariant={selectedVariant}
          />
          <Aside type="cart" heading="Your cart">
            Cart contents
          </Aside>
        </Aside.Provider>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('dialog', {name: 'Your cart'}),
      ).toBeInTheDocument(),
    );
  });

  it('disables purchase when the drop lifecycle gate is closed', () => {
    render(
      <MemoryRouter>
        <Aside.Provider>
          <ProductPurchasePanel
            disabledLabel="Not yet available"
            presentation="drop"
            product={{handle: 'artwork', title: 'Artwork'}}
            productOptions={[]}
            purchaseAllowed={false}
            selectedVariant={variant()}
            showIdentity={false}
            statusLabel="Coming soon"
          />
        </Aside.Provider>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('button', {name: 'Not yet available'}),
    ).toBeDisabled();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('heading', {level: 1})).not.toBeInTheDocument();
  });

  it('keeps the submitted merchandise ID aligned to a changed apparel variant', () => {
    const {container, rerender} = renderPanel({
      options: [],
      selectedVariant: variant({id: 'gid://shopify/ProductVariant/size-m'}),
    });
    rerender(
      <MemoryRouter>
        <Aside.Provider>
          <ProductPurchasePanel
            product={{handle: 'artwork', title: 'Artwork'}}
            productOptions={[]}
            selectedVariant={variant({
              amount: '85.00',
              id: 'gid://shopify/ProductVariant/size-l',
            })}
          />
        </Aside.Provider>
      </MemoryRouter>,
    );
    const lines = JSON.parse(
      container.querySelector('form')?.getAttribute('data-lines') || '[]',
    ) as Array<{merchandiseId: string}>;
    expect(lines[0].merchandiseId).toBe(
      'gid://shopify/ProductVariant/size-l',
    );
    expect(screen.getByRole('button', {name: /Add to cart.*\$85\.00/})).toBeEnabled();
  });
});
