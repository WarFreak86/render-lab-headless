import {render, screen, waitFor} from '@testing-library/react';
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

function renderDesktopMenu() {
  return render(
    <MemoryRouter>
      <Aside.Provider>
        <HeaderMenu viewport="desktop" />
      </Aside.Provider>
    </MemoryRouter>,
  );
}

describe('Header foundation', () => {
  it('renders the real cart quantity accessibly', () => {
    const {rerender} = render(<HeaderCartCount count={3} />);
    expect(screen.getByLabelText('3 cart items')).toHaveTextContent('3');

    rerender(<HeaderCartCount count={5} />);
    expect(screen.getByLabelText('5 cart items')).toHaveTextContent('5');
  });

  it('opens the existing cart drawer from the header control', async () => {
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

  it('opens Shop as a mega menu without redundant primary destinations', async () => {
    const user = userEvent.setup();
    renderDesktopMenu();
    const shop = screen.getByRole('button', {name: /shop/i});

    expect(screen.getByRole('link', {name: 'Artists'})).toHaveAttribute(
      'href',
      '/artists',
    );
    expect(screen.getByRole('link', {name: 'Bundles'})).toHaveAttribute(
      'href',
      '/collections/bundles',
    );
    expect(shop).toHaveAttribute('aria-expanded', 'false');
    expect(shop).toHaveAttribute('aria-controls');
    await user.click(shop);
    expect(shop).toHaveAttribute('aria-expanded', 'true');

    expect(
      screen.getByRole('menuitem', {name: 'All Wall Art'}),
    ).toHaveAttribute('href', '/collections/wall-art');
    expect(
      screen.getByRole('menuitem', {name: 'Metal Prints'}),
    ).toHaveAttribute('href', '/collections/metal-wall-art');
    expect(
      screen.getByRole('menuitem', {name: 'Canvas Prints'}),
    ).toHaveAttribute('href', '/collections/canvas-art');
    expect(screen.getByRole('menuitem', {name: 'Posters'})).toHaveAttribute(
      'href',
      '/collections/posters',
    );
    expect(
      screen.getByRole('menuitem', {name: 'Quiet Horizons'}),
    ).toHaveAttribute('href', '/collections/quiet-horizons');
    expect(
      screen.getByRole('menuitem', {name: 'Botanical Anomalies'}),
    ).toHaveAttribute('href', '/collections/botanical-anomalies');
    expect(
      screen.queryByRole('menuitem', {name: 'Nightmare Lab'}),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', {name: 'Nico Vale'})).toHaveAttribute(
      'href',
      '/artists/nico-vale',
    );
    expect(
      screen.getByRole('menuitem', {name: 'View All Artists'}),
    ).toHaveAttribute('href', '/artists');
    expect(
      screen.getByRole('menuitem', {name: 'View All Collections'}),
    ).toHaveAttribute('href', '/collections');
  });

  it('opens Shop with the keyboard, supports arrow navigation, and restores focus on Escape', async () => {
    const user = userEvent.setup();
    renderDesktopMenu();
    const shop = screen.getByRole('button', {name: /shop/i});

    shop.focus();
    await user.keyboard('{Enter}');
    expect(shop).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', {name: 'All Wall Art'})).toHaveFocus(),
    );
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', {name: 'Metal Prints'})).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(shop).toHaveAttribute('aria-expanded', 'false');
    expect(shop).toHaveFocus();
  });

  it('keeps the Shop panel open while the pointer moves into it', async () => {
    const user = userEvent.setup();
    renderDesktopMenu();
    const shop = screen.getByRole('button', {name: /shop/i});

    await user.hover(shop);
    expect(shop).toHaveAttribute('aria-expanded', 'true');
    await user.hover(screen.getByRole('menuitem', {name: 'Quiet Horizons'}));
    expect(shop).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders the equivalent mobile hierarchy and preserves drawer focus restoration', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Aside.Provider>
          <HeaderMenuMobileToggle />
          <Aside type="mobile" heading="MENU">
            <HeaderMenu viewport="mobile" />
          </Aside>
          <Aside type="search" heading="SEARCH">
            Search contents
          </Aside>
        </Aside.Provider>
      </MemoryRouter>,
    );

    const menuToggle = screen.getByRole('button', {name: 'Open menu'});
    await user.click(menuToggle);
    expect(screen.getByRole('dialog', {name: 'MENU'})).toBeInTheDocument();
    const shop = screen.getByRole('button', {name: 'Shop'});
    expect(shop).toHaveAttribute('aria-expanded', 'false');
    await user.click(shop);
    expect(shop).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', {name: 'All Wall Art'})).toHaveAttribute(
      'href',
      '/collections/wall-art',
    );
    expect(screen.getByRole('link', {name: 'Quiet Horizons'})).toHaveAttribute(
      'href',
      '/collections/quiet-horizons',
    );
    expect(screen.getByRole('link', {name: 'Metal Prints'})).toHaveAttribute(
      'href',
      '/collections/metal-wall-art',
    );
    expect(screen.queryByRole('link', {name: 'Nightmare Lab'})).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Nico Vale'})).toHaveAttribute(
      'href',
      '/artists/nico-vale',
    );
    expect(screen.getByRole('link', {name: 'View All Artists'})).toHaveAttribute(
      'href',
      '/artists',
    );
    expect(screen.getByRole('link', {name: 'Artists'})).toHaveAttribute(
      'href',
      '/artists',
    );
    expect(screen.getByRole('link', {name: 'Bundles'})).toHaveAttribute(
      'href',
      '/collections/bundles',
    );
    expect(screen.getByRole('link', {name: 'Account'})).toHaveAttribute(
      'href',
      '/account',
    );

    await user.click(screen.getByRole('button', {name: 'Search'}));
    expect(screen.getByRole('dialog', {name: 'SEARCH'})).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(menuToggle).toHaveFocus();
  });
});