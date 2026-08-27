import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import {Aside} from '~/components/Aside';
import {
  CartBadge,
  HeaderCartCount,
  HeaderMenu,
  HeaderMenuMobileToggle,
} from '~/components/Header';

vi.mock('@shopify/hydrogen', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shopify/hydrogen')>();
  return {
    ...actual,
    useAnalytics: () => ({
      cart: undefined,
      prevCart: undefined,
      publish: vi.fn(),
      shop: {},
    }),
  };
});

describe('Header foundation', () => {
  it('renders the current cart count accessibly', () => {
    const {rerender} = render(<HeaderCartCount count={3} />);
    expect(screen.getByLabelText('3 cart items')).toHaveTextContent('3');

    rerender(<HeaderCartCount count={5} />);
    expect(screen.getByLabelText('5 cart items')).toHaveTextContent('5');
  });

  it('opens the cart drawer from the header control', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Aside.Provider>
          <CartBadge count={2} />
          <Aside type="cart" heading="Your cart (2)">
            Cart contents
          </Aside>
        </Aside.Provider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', {name: 'Open cart, 2 items'}));
    expect(
      screen.getByRole('dialog', {name: 'Your cart (2)'}),
    ).toBeInTheDocument();
  });

  it('opens mobile navigation from the menu toggle', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Aside.Provider>
          <HeaderMenuMobileToggle />
          <Aside type="mobile" heading="MENU">
            <HeaderMenu viewport="mobile" />
          </Aside>
        </Aside.Provider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', {name: 'Open menu'}));
    expect(screen.getByRole('dialog', {name: 'MENU'})).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', {name: 'Mobile navigation'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Metal Prints'})).toHaveAttribute(
      'href',
      '/collections/metal',
    );
    expect(screen.queryByRole('link', {name: 'About'})).not.toBeInTheDocument();
  });
});
