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

  it('opens Explore as a mega menu and exposes legitimate store routes', async () => {
    const user = userEvent.setup();
    renderDesktopMenu();
    const explore = screen.getByRole('button', {name: /explore/i});

    expect(explore).toHaveAttribute('aria-expanded', 'false');
    expect(explore).toHaveAttribute('aria-controls');
    await user.click(explore);
    expect(explore).toHaveAttribute('aria-expanded', 'true');

    expect(screen.getByRole('menuitem', {name: 'Wall Art'})).toHaveAttribute(
      'href',
      '/collections/wall-art',
    );
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
      screen.getByRole('menuitem', {name: 'Nightmare Lab'}),
    ).toHaveAttribute('href', '/collections/nightmare-lab');
    expect(
      screen.getByRole('menuitem', {name: 'All Collections'}),
    ).toHaveAttribute('href', '/collections');
  });

  it('opens Explore with the keyboard, supports arrow navigation, and restores focus on Escape', async () => {
    const user = userEvent.setup();
    renderDesktopMenu();
    const explore = screen.getByRole('button', {name: /explore/i});

    explore.focus();
    await user.keyboard('{Enter}');
    expect(explore).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', {name: 'Wall Art'})).toHaveFocus(),
    );
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', {name: 'All Collections'})).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(explore).toHaveAttribute('aria-expanded', 'false');
    expect(explore).toHaveFocus();
  });

  it('keeps the Explore panel open while the pointer moves into it', async () => {
    const user = userEvent.setup();
    renderDesktopMenu();
    const explore = screen.getByRole('button', {name: /explore/i});

    await user.hover(explore);
    expect(explore).toHaveAttribute('aria-expanded', 'true');
    await user.hover(screen.getByRole('menuitem', {name: 'Quiet Horizons'}));
    expect(explore).toHaveAttribute('aria-expanded', 'true');
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
    const explore = screen.getByRole('button', {name: 'Explore'});
    expect(explore).toHaveAttribute('aria-expanded', 'false');
    await user.click(explore);
    expect(explore).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', {name: 'Quiet Horizons'})).toHaveAttribute(
      'href',
      '/collections/quiet-horizons',
    );
    expect(screen.getByRole('link', {name: 'Metal Prints'})).toHaveAttribute(
      'href',
      '/collections/metal-wall-art',
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
