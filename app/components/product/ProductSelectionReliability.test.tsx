import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createMemoryRouter, RouterProvider, useLoaderData} from 'react-router';
import {getProductOptions} from '@shopify/hydrogen';
import type {LoaderFunctionArgs} from 'react-router';
import type {ProductFragment} from 'storefrontapi.generated';
import {ProductPurchasePanel} from './ProductPurchasePanel';
import {Aside} from '~/components/Aside';

vi.mock('@shopify/hydrogen', async (importOriginal) => {
  const original = await importOriginal<typeof import('@shopify/hydrogen')>();
  function CartForm({
    children,
    inputs,
  }: {
    children: (fetcher: {state: 'idle'; data: undefined}) => React.ReactNode;
    inputs: {lines: unknown[]};
  }) {
    return (
      <form data-testid="cart-input" data-lines={JSON.stringify(inputs.lines)}>
        {children({state: 'idle', data: undefined})}
      </form>
    );
  }
  CartForm.ACTIONS = original.CartForm.ACTIONS;
  return {...original, CartForm};
});

// Synthetic Cartesian product: no catalog, network, or visualizer fixture dependency.
const product = {
  handle: 'selection-test-artwork',
  id: 'gid://shopify/Product/1',
  title: 'Selection test artwork',
};
const cases = [
  ['Metal', '12x16', '79.00'],
  ['Metal', '18x24', '109.00'],
  ['Metal', '24x32', '149.00'],
  ['Canvas', '12x16', '59.00'],
  ['Canvas', '18x24', '89.00'],
  ['Canvas', '24x32', '119.00'],
] as const;
const variants = cases.map(
  (
    [material, size, amount],
    index,
  ): NonNullable<ProductFragment['selectedOrFirstAvailableVariant']> => ({
    id: `gid://shopify/ProductVariant/${index + 1}`,
    availableForSale: true,
    selectedOptions: [
      {name: 'Material', value: material},
      {name: 'Size', value: size},
    ],
    price: {amount, currencyCode: 'USD'},
    compareAtPrice: null,
    image: null,
    product,
    sku: '',
    title: `${material} / ${size}`,
    unitPrice: null,
  }),
);
const options = [
  {name: 'Material', values: ['Canvas', 'Metal']},
  {name: 'Size', values: ['12x16', '24x32', '18x24']},
].map((o) => ({
  name: o.name,
  optionValues: o.values.map((name) => ({
    name,
    firstSelectableVariant: variants.find((v) =>
      v.selectedOptions.some((s) => s.name === o.name && s.value === name),
    )!,
  })),
}));
function findVariant(search: string) {
  const params = new URLSearchParams(search);
  return variants.find((v) =>
    v.selectedOptions.every((o) => params.get(o.name) === o.value),
  )!;
}

function setup() {
  let paused = false;
  const pending: Array<() => void> = [];
  function Page() {
    const loaded =
      useLoaderData<
        NonNullable<ProductFragment['selectedOrFirstAvailableVariant']>
      >();
    const selected = loaded;
    const mapped = getProductOptions({
      ...product,
      options,
      selectedOrFirstAvailableVariant: selected,
      adjacentVariants: variants,
      encodedVariantExistence: 'v1_0:0-2,1:0-2,',
      encodedVariantAvailability: 'v1_0:0-2,1:0-2,',
    });
    return (
      <Aside.Provider>
        <ProductPurchasePanel
          product={product}
          productOptions={mapped}
          selectedVariant={selected}
        />
      </Aside.Provider>
    );
  }
  const router = createMemoryRouter(
    [
      {
        path: '/products/:handle',
        HydrateFallback: () => null,
        loader: async ({request}: LoaderFunctionArgs) => {
          if (paused)
            await new Promise<void>((resolve) => pending.push(resolve));
          return findVariant(new URL(request.url).search);
        },
        Component: Page,
      },
    ],
    {
      initialEntries: [
        `/products/${product.handle}?Material=Canvas&Size=24x32&variant=6`,
      ],
    },
  );
  render(<RouterProvider router={router} />);
  return {
    router,
    pause: () => {
      paused = true;
    },
    release: async () => {
      paused = false;
      await act(async () => {
        pending
          .splice(0)
          .reverse()
          .forEach((resolve) => resolve());
      });
    },
  };
}

function rapid(names: string[]) {
  act(() => {
    for (const name of names)
      fireEvent.click(screen.getByRole('button', {name}));
  });
}

it('preserves rapid cross-option intent without the room integration', async () => {
  const flow = setup();
  await screen.findByRole('heading', {name: 'Selection test artwork'});
  flow.pause();
  rapid(['Metal', '12x16']);
  try {
    const intended = new URLSearchParams(
      flow.router.state.navigation.location?.search,
    );
    expect(intended.get('Material')).toBe('Metal');
    expect(intended.get('Size')).toBe('12x16');
    expect(intended.has('variant')).toBe(false);
  } finally {
    await flow.release();
  }
  await waitFor(() => expect(flow.router.state.navigation.state).toBe('idle'));
  expect(screen.getByRole('button', {name: 'Metal'})).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    screen.getByRole('button', {name: /Add to cart.*\$79.00/}),
  ).toBeEnabled();
  const lines = JSON.parse(
    screen.getByTestId('cart-input').getAttribute('data-lines')!,
  ) as Array<{merchandiseId: string}>;
  expect(lines[0].merchandiseId).toBe(
    findVariant('?Material=Metal&Size=12x16').id,
  );
  flow.router.dispose();
});

it('honors a rapid reversal to an option still marked selected by the previous render', async () => {
  const flow = setup();
  await screen.findByRole('heading', {name: 'Selection test artwork'});
  flow.pause();
  rapid(['Metal', '12x16', 'Canvas', '18x24']);
  try {
    const intended = new URLSearchParams(
      flow.router.state.navigation.location?.search,
    );
    expect(intended.get('Material')).toBe('Canvas');
    expect(intended.get('Size')).toBe('18x24');
  } finally {
    await flow.release();
  }
  flow.router.dispose();
});

it.each(variants)(
  'settles rapid changes on $title with matching URL, price, availability and cart payload',
  async (expected) => {
    const flow = setup();
    await screen.findByRole('heading', {name: 'Selection test artwork'});
    const selection = Object.fromEntries(
      expected.selectedOptions.map((o) => [o.name, o.value]),
    );
    flow.pause();
    rapid(['Metal', '12x16', selection.Material, selection.Size]);
    await flow.release();
    await waitFor(() =>
      expect(flow.router.state.navigation.state).toBe('idle'),
    );
    const params = new URLSearchParams(flow.router.state.location.search);
    for (const option of expected.selectedOptions) {
      expect(params.get(option.name)).toBe(option.value);
      expect(screen.getByRole('button', {name: option.value})).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    }
    expect(params.has('variant')).toBe(false);
    const lines = JSON.parse(
      screen.getByTestId('cart-input').getAttribute('data-lines')!,
    ) as Array<{merchandiseId: string}>;
    expect(lines[0].merchandiseId).toBe(expected.id);
    const price = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: expected.price.currencyCode,
    }).format(Number(expected.price.amount));
    expect(screen.getByRole('button', {name: /Add to cart/})).toBeEnabled();
    expect(screen.getByRole('group', {name: 'Price'})).toHaveTextContent(price);
    expect(screen.getByRole('button', {name: /Add to cart/})).toHaveTextContent(
      price,
    );
    expect(screen.getByText('Available', {exact: true})).toBeInTheDocument();
    flow.router.dispose();
  },
);

it('resets pending intent after an external product URL navigation', async () => {
  const flow = setup();
  await screen.findByRole('heading', {name: 'Selection test artwork'});
  rapid(['Metal', '12x16']);
  await waitFor(() => expect(flow.router.state.navigation.state).toBe('idle'));
  await act(() =>
    flow.router.navigate(
      `/products/${product.handle}?Material=Canvas&Size=18x24`,
    ),
  );
  rapid(['Metal']);
  await waitFor(() => expect(flow.router.state.navigation.state).toBe('idle'));
  const params = new URLSearchParams(flow.router.state.location.search);
  expect(params.get('Size')).toBe('18x24');
  expect(params.get('Material')).toBe('Metal');
  flow.router.dispose();
});
