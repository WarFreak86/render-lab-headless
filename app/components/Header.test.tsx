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

const collections = [
  {
    id: 'collection-machine',
    handle: 'machine-monument',
    title: 'Machine & Monument',
    products: {nodes: [{id: 'product-machine'}]},
  },
  {
    id: 'collection-neon',
    handle: 'neon-memento',
    title: 'Neon Memento',
    products: {nodes: [{id: 'product-neon'}]},
  },
  {
    id: 'collection-wall-art',
    handle: 'wall-art',
    title: 'Wall Art',
    products: {nodes: [{id: 'product-wall'}]},
  },
  {
    id: 'collection-nightmare',
    handle: 'nightmare-lab',
    title: 'Nightmare Lab',
    products: {nodes: [{id: 'product-nightmare'}]},
  },
  {
    id: 'collection-empty',
    handle: 'empty-series',
    title: 'Empty Series',
    products: {nodes: []},
  },
];

const artists = [
  {id: 'artist-nico', handle: 'nico-vale', name: {value: 'Nico Vale'}},
  {id: 'artist-mara', handle: 'mara-voss', name: {value: 'Mara Voss'}},
  {id: 'artist-dante', handle: 'dante-mercer', name: {value: 'Dante Mercer'}},
  {id: 'artist-four', handle: 'fourth-artist', name: {value: 'Fourth Artist'}},
];

function renderDesktopMenu() {
  return render(
    <MemoryRouter>
      <Aside.Provider>
        <HeaderMenu
          artists={artists}
          collections={collections}
          viewport="desktop"
        />
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

  it('builds collection and artist mega-menu groups from Shopify data', async () => {
    const user = userEvent.setup();
    renderDesktopMenu();
    const shop = screen.getByRole('button', {name: /collections/i});

    expect(screen.getByRole('link', {name: 'Artists'})).toHaveAttribute(
      'href',
      '/artists',
    );
    expect(shop).toHaveAttribute('aria-expanded', 'false');
    await user.click(shop);

    expect(
      screen.getByRole('menuitem', {name: 'All Wall Art'}),
    ).toHaveAttribute('href', '/collections/wall-art');
    expect(
      screen.getByRole('menuitem', {name: 'Machine & Monument'}),
    ).toHaveAttribute('href', '/collections/machine-monument');
    expect(
      screen.getByRole('menuitem', {name: 'Neon Memento'}),
    ).toHaveAttribute('href', '/collections/neon-memento');
    expect(
      screen.queryByRole('menuitem', {name: 'Nightmare Lab'}),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', {name: 'Empty Series'}),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', {name: 'Fourth Artist'}),
    ).toHaveAttribute('href', '/artists/fourth-artist');
    expect(
      screen.getByRole('menuitem', {name: 'Nico Vale'}),
    ).toHaveAttribute('href', '/artists/nico-vale');
    expect(
      screen.getByRole('menuitem', {name: 'View All Collections'}),
    ).toHaveAttribute('href', '/collections');
    expect(
      screen.getByRole('menuitem', {name: 'View All Artists'}),
    ).toHaveAttribute('href', '/artists');
  });

  it('opens Collections with the keyboard, supports arrow navigation, and restores focus on Escape', async () => {
    const user = userEvent.setup();
    renderDesktopMenu();
    const shop = screen.getByRole('button', {name: /collections/i});

    shop.focus();
    await user.keyboard('{Enter}');
    expect(shop).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', {name: 'All Wall Art'})).toHaveFocus(),
    );
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', {name: 'Metal Wall Art'})).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(shop).toHaveAttribute('aria-expanded', 'false');
    expect(shop).toHaveFocus();
  });

  it('keeps the Collections panel open while the pointer moves into it', async () => {
    const user = userEvent.setup();
    renderDesktopMenu();
    const shop = screen.getByRole('button', {name: /collections/i});

    await user.hover(shop);
    expect(shop).toHaveAttribute('aria-expanded', 'true');
    await user.hover(screen.getByRole('menuitem', {name: 'Neon Memento'}));
    expect(shop).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders the equivalent mobile hierarchy from the same Shopify data', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Aside.Provider>
          <HeaderMenuMobileToggle />
          <Aside type="mobile" heading="MENU">
            <HeaderMenu
              artists={artists}
              collections={collections}
              viewport="mobile"
            />
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
    expect(screen.getByRole('link', {name: 'Wall Art'})).toHaveAttribute(
      'href',
      '/collections/wall-art',
    );
    expect(screen.getByRole('link', {name: 'Machine & Monument'})).toHaveAttribute(
      'href',
      '/collections/machine-monument',
    );
    expect(screen.getByRole('link', {name: 'Neon Memento'})).toHaveAttribute(
      'href',
      '/collections/neon-memento',
    );
    expect(screen.queryByRole('link', {name: 'Nightmare Lab'})).not.toBeInTheDocument();
    expect(screen.queryByRole('link', {name: 'Empty Series'})).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Materials'})).toHaveAttribute(
      'href',
      '/materials',
    );
    expect(screen.getByRole('link', {name: 'Artists'})).toHaveAttribute(
      'href',
      '/artists',
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
