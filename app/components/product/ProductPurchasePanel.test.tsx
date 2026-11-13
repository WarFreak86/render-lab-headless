import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {MemoryRouter, useLocation} from 'react-router';
import {Aside} from '~/components/Aside';
import type {ChoiceVariant} from '~/lib/product-confidence';
import type {MappedProductOptions} from '@shopify/hydrogen';
import {getNextOptionQuery, ProductPurchasePanel} from './ProductPurchasePanel';

function RouteSearchProbe() {
  const location = useLocation();
  return (
    <output data-testid="product-selection-query">{location.search}</output>
  );
}

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
  handle = 'artwork',
  buyerConfidence = false,
  variants = [],
  options,
  selectedVariant = variant(),
  title = 'Artwork',
}: {
  handle?: string;
  buyerConfidence?: boolean;
  variants?: ChoiceVariant[];
  options: any[];
  selectedVariant?: any;
  title?: string;
}) {
  return render(
    <MemoryRouter>
      <Aside.Provider>
        <ProductPurchasePanel
          buyerConfidence={buyerConfidence}
          variants={variants}
          product={{
            handle,
            productType: 'Metal print',
            title,
          }}
          productOptions={options}
          selectedVariant={selectedVariant}
        />
        <Aside type="cart" heading="Your cart">
          Cart contents
        </Aside>
        <RouteSearchProbe />
      </Aside.Provider>
    </MemoryRouter>,
  );
}

describe('ProductPurchasePanel', () => {
  it('composes rapid option clicks without restoring a stale material', () => {
    const options = [
      {
        name: 'Material',
        optionValues: [
          {
            name: 'Metal',
            available: true,
            exists: true,
            selected: true,
            variantUriQuery: 'Material=Metal&Size=16x12',
          },
          {
            name: 'Canvas',
            available: true,
            exists: true,
            selected: false,
            variantUriQuery: 'Material=Canvas&Size=16x12',
          },
        ],
      },
      {
        name: 'Size',
        optionValues: [
          {
            name: '16x12',
            available: true,
            exists: true,
            selected: true,
            variantUriQuery: 'Material=Metal&Size=16x12',
          },
          {
            name: '24x18',
            available: true,
            exists: true,
            selected: false,
            variantUriQuery: 'Material=Metal&Size=24x18',
          },
        ],
      },
    ];
    renderPanel({options});
    fireEvent.click(screen.getByRole('button', {name: 'Canvas'}));
    expect(
      screen.getByRole('button', {name: 'Updating selection…'}),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', {name: '24x18'}));
    const params = new URLSearchParams(
      screen.getByTestId('product-selection-query').textContent || '',
    );
    expect(params.get('Material')).toBe('Canvas');
    expect(params.get('Size')).toBe('24x18');
    expect(
      screen.getByRole('button', {name: 'Updating selection…'}),
    ).toBeDisabled();
  });

  it('lets a rapid click reverse an unresolved material choice', () => {
    const options = [
      {
        name: 'Material',
        optionValues: [
          {
            name: 'Metal',
            available: true,
            exists: true,
            selected: true,
            variantUriQuery: 'Material=Metal&Size=16x12',
          },
          {
            name: 'Canvas',
            available: true,
            exists: true,
            selected: false,
            variantUriQuery: 'Material=Canvas&Size=16x12',
          },
        ],
      },
    ];
    renderPanel({options});
    fireEvent.click(screen.getByRole('button', {name: 'Canvas'}));
    fireEvent.click(screen.getByRole('button', {name: 'Metal'}));
    const params = new URLSearchParams(
      screen.getByTestId('product-selection-query').textContent || '',
    );
    expect(params.get('Material')).toBe('Metal');
  });

  it('replaces only the clicked option while preserving a pending selection', () => {
    expect(
      getNextOptionQuery('Material=Metal&Size=24x18', 'Size', '24x18', {
        Material: 'Canvas',
        Size: '16x12',
      }),
    ).toBe('Material=Canvas&Size=24x18');
  });

  it('uses the official support inbox for product questions', () => {
    renderPanel({options: []});
    expect(
      screen.getByRole('link', {name: /Questions\? Contact Render-Lab/i}),
    ).toHaveAttribute('href', 'mailto:support@render-lab.org');
  });

  beforeEach(() => {
    mockCart.fetcher.data = undefined;
    mockCart.fetcher.state = 'idle';
  });

  it.each([
    ['Fireglass — 1934 Ford Three-Window', 'Fireglass'],
    ['Fields of Memory — Echoes of War', 'Fields of Memory'],
    ['Hard Exit — Heat', 'Hard Exit'],
    ['The Producer — Urban Icon', 'The Producer'],
    ['Eyes of Doom', 'Eyes of Doom'],
  ])(
    'preserves the pilot artwork name as the single H1 for %s',
    (title, h1) => {
      renderPanel({options: [], title});

      expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);
      expect(
        screen.getByRole('heading', {level: 1, name: h1}),
      ).toBeInTheDocument();
    },
  );

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
    expect(screen.getByRole('link', {name: '14-day returns'})).toHaveAttribute(
      'href',
      '/policies/refund-policy',
    );
    expect(
      screen.getByText(/Customer pays return shipping for non-defective items/),
    ).toBeInTheDocument();
    expect(screen.getByText('Rates confirmed at checkout')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: /Production and shipping details/i}),
    ).toHaveAttribute('href', '/policies/shipping-policy');
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
    expect(lines[0].merchandiseId).toBe('gid://shopify/ProductVariant/size-l');
    expect(
      screen.getByRole('button', {name: /Add to cart.*\$85\.00/}),
    ).toBeEnabled();
  });

  it('submits the Google-linked Canvas variant and advertised price', () => {
    const selectedVariant = {
      ...variant({
        amount: '119.00',
        id: 'gid://shopify/ProductVariant/47375048933537',
      }),
      selectedOptions: [
        {name: 'Size', value: '24x32'},
        {name: 'Material', value: 'Canvas'},
      ],
    };
    const {container} = renderPanel({
      options: [
        {
          name: 'Material',
          optionValues: [
            {name: 'Metal', available: true, exists: true, selected: false},
            {name: 'Canvas', available: true, exists: true, selected: true},
          ],
        },
        {
          name: 'Size',
          optionValues: [
            {name: '24x32', available: true, exists: true, selected: true},
          ],
        },
      ],
      selectedVariant,
    });

    expect(screen.getByRole('button', {name: 'Canvas'})).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByText(
        /Render-Lab metal and canvas prints typically take 2–4 business days/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', {name: '24x32'})).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', {name: /Add to cart.*\$119\.00/}),
    ).toBeEnabled();
    const lines = JSON.parse(
      container.querySelector('form')?.getAttribute('data-lines') || '[]',
    ) as Array<{merchandiseId: string}>;
    expect(lines[0].merchandiseId).toBe(
      'gid://shopify/ProductVariant/47375048933537',
    );
  });
});

describe('buyer confidence commerce integration', () => {
  it('selects a complete comparison variant, blocks the stale cart, and reviews the updated merchandise', () => {
    mockCart.fetcher.state = 'idle';
    mockCart.fetcher.data = undefined;
    const metal = {
      ...variant({amount: '109.00', id: 'metal-24'}),
      selectedOptions: [
        {name: 'Material', value: 'Metal'},
        {name: 'Size', value: '24x18'},
      ],
    };
    const canvas = {
      ...variant({amount: '89.00', id: 'canvas-24'}),
      selectedOptions: [
        {name: 'Material', value: 'Canvas'},
        {name: 'Size', value: '24x18'},
      ],
    };
    const variants = [metal, canvas];
    const options = [
      {
        name: 'Material',
        optionValues: ['Metal', 'Canvas'].map((name) => ({
          name,
          exists: true,
          available: true,
          selected: name === 'Metal',
          variantUriQuery: `Material=${name}&Size=24x18`,
        })),
      },
    ];
    const view = renderPanel({
      buyerConfidence: true,
      variants,
      options,
      selectedVariant: metal,
    });
    fireEvent.click(screen.getByRole('button', {name: /Compare all 2 prices/}));
    const comparison = screen.getByRole('dialog');
    expect(within(comparison).getByText('$109.00')).toBeInTheDocument();
    expect(within(comparison).getByText('$89.00')).toBeInTheDocument();
    fireEvent.click(
      within(comparison).getByRole('button', {name: 'Choose Canvas, 24x18'}),
    );
    const params = new URLSearchParams(
      screen.getByTestId('product-selection-query').textContent || '',
    );
    expect(params.get('Material')).toBe('Canvas');
    expect(params.get('Size')).toBe('24x18');
    expect(
      screen.getByRole('button', {name: 'Updating selection…'}),
    ).toBeDisabled();
    fireEvent.click(
      within(comparison).getByRole('button', {
        name: 'Continue with this selection',
      }),
    );
    view.rerender(
      <MemoryRouter>
        <Aside.Provider>
          <ProductPurchasePanel
            buyerConfidence
            product={{handle: 'artwork', title: 'Artwork'}}
            productOptions={
              options.map((option) => ({
                ...option,
                optionValues: option.optionValues.map((value) => ({
                  ...value,
                  selected: value.name === 'Canvas',
                })),
              })) as MappedProductOptions[]
            }
            selectedVariant={canvas}
            variants={variants}
          />
        </Aside.Provider>
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole('button', {name: /Review your selection before adding/}),
    );
    const review = screen.getByRole('dialog');
    expect(
      within(review).getByText('Pending shipping & tax'),
    ).toBeInTheDocument();
    expect(
      within(review).getByRole('button', {name: /Add to cart.*\$89.00/}),
    ).toBeEnabled();
    const form = review.querySelector('form');
    const lines = JSON.parse(
      form?.getAttribute('data-lines') || '[]',
    ) as Array<{merchandiseId: string}>;
    expect(lines[0].merchandiseId).toBe('canvas-24');
  });
});
