import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  useLoaderData,
  useNavigation,
} from 'react-router';
import {getProductOptions} from '@shopify/hydrogen';
import type {LoaderFunctionArgs} from 'react-router';
import type {ProductFragment} from 'storefrontapi.generated';
import fixture from '../../../prototypes/room-preview/fixtures/live-product.json';
import {ProductPurchasePanel} from './ProductPurchasePanel';
import {RoomPreviewAction} from './RoomPreviewAction';
import {Aside} from '~/components/Aside';
import {roomPreviewSelection} from '~/lib/room-preview-navigation';
import {mapRoomProduct} from '~/lib/room-preview.server';
import {CatalogPreview} from '~/components/room-preview/RoomPreview';

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

const product = {
  handle: fixture.product.handle,
  id: fixture.product.id,
  title: fixture.product.title,
};
const variants = fixture.product.variants.nodes.map(
  (v): NonNullable<ProductFragment['selectedOrFirstAvailableVariant']> => ({
    ...v,
    price: {...v.price, currencyCode: 'USD'},
    compareAtPrice: null,
    image: null,
    product,
    sku: '',
    title: v.selectedOptions.map((o) => o.value).join(' / '),
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

function setup(withPreview = false) {
  let paused = false;
  const pending: Array<() => void> = [];
  function Page() {
    const loaded =
      useLoaderData<
        NonNullable<ProductFragment['selectedOrFirstAvailableVariant']>
      >();
    const selected = loaded;
    const navigation = useNavigation();
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
          auxiliaryAction={
            withPreview ? (
              <RoomPreviewAction
                product={product}
                selectedVariant={selected}
                pending={navigation.state !== 'idle'}
              />
            ) : undefined
          }
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
      {
        path: '/lab/room-preview',
        Component: () => {
          const art = mapRoomProduct(fixture.product);
          const initial = roomPreviewSelection(
            `http://localhost${router.state.location.pathname}${router.state.location.search}`,
            art,
          )!;
          return (
            <CatalogPreview
              catalog={{
                products: [art],
                source: 'Shopify Storefront API',
                fetchedAt: fixture.fetchedAt,
              }}
              initialVariantId={initial.id}
            />
          );
        },
      },
    ],
    {
      initialEntries: [
        `/products/${product.handle}?Material=Canvas&Size=24x32&variant=48060467052705`,
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

it('prevents stale room navigation while selecting and then round-trips the intended variant', async () => {
  const flow = setup(true);
  await screen.findByRole('heading', {name: 'The Sky Unbound'});
  flow.pause();
  rapid(['Metal', '12x16']);
  const link = screen.getByRole('link', {name: 'View in a Room'});
  try {
    expect(link).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(link);
    expect(flow.router.state.location.pathname).toBe(
      `/products/${product.handle}`,
    );
  } finally {
    await flow.release();
  }
  await waitFor(() =>
    expect(link).not.toHaveAttribute('aria-disabled', 'true'),
  );
  expect(link).toHaveAttribute(
    'href',
    expect.stringContaining('variant=48060466921633'),
  );
  fireEvent.click(link);
  await screen.findByRole('link', {name: 'Back to Product'});
  expect(screen.getByRole('button', {name: 'Metal'})).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('button', {name: '12 × 16'})).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const back = screen
    .getByRole('link', {name: 'Back to Product'})
    .getAttribute('href')!;
  await act(() => flow.router.navigate(back));
  await screen.findByRole('link', {name: 'View in a Room'});
  expect(screen.getByRole('button', {name: 'Metal'})).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('button', {name: '12x16'})).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByText('Available', {exact: true})).toBeInTheDocument();
  flow.router.dispose();
});

it.each(variants)(
  'settles rapid changes on $title with matching URL, price, cart payload and preview',
  async (expected) => {
    const flow = setup(true);
    await screen.findByRole('heading', {name: 'The Sky Unbound'});
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
    expect(
      screen.getByRole('link', {name: 'View in a Room'}).getAttribute('href'),
    ).toContain(`variant=${expected.id.split('/').at(-1)}`);
    flow.router.dispose();
  },
);
