import {Suspense, useCallback, useEffect, useId, useRef, useState} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {Accordion} from '~/components/Accordion';
import {Icon} from '~/components/Icon';
import {IconButton} from '~/components/IconButton';
import {useAside} from '~/components/Aside';
import {SITE_NAME} from '~/lib/config';
import {EXPLORE_NAV_GROUPS, PRIMARY_NAV_ITEMS} from '~/lib/navigation';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({isLoggedIn, cart}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, {passive: true});
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header className="site-header" data-scrolled={scrolled || undefined}>
      <div className="site-header__inner">
        <HeaderMenuMobileToggle />
        <NavLink
          aria-label={`${SITE_NAME} home`}
          className="brand-mark"
          end
          prefetch="intent"
          to="/"
        >
          RENDER<span aria-hidden="true">-</span>LAB
        </NavLink>
        <HeaderMenu viewport="desktop" />
        <HeaderSearch />
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>
    </header>
  );
}

export function HeaderMenu({viewport}: {viewport: Viewport}) {
  const {close, open} = useAside();

  if (viewport === 'mobile') {
    return (
      <nav
        aria-label="Mobile navigation"
        className="header-menu header-menu--mobile"
      >
        <Accordion title="Explore">
          <div className="header-menu__mobile-mega">
            {EXPLORE_NAV_GROUPS.map((group) => (
              <section className="header-menu__mobile-group" key={group.title}>
                <p>{group.title}</p>
                <div className="header-menu__mobile-links">
                  {group.items.map((item) => (
                    <NavLink
                      className={({isActive}) =>
                        isActive ? 'is-active' : undefined
                      }
                      key={item.title}
                      onClick={close}
                      prefetch="intent"
                      to={item.url}
                    >
                      {item.title}
                    </NavLink>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Accordion>
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink
            className={({isActive}) => (isActive ? 'is-active' : undefined)}
            key={item.title}
            onClick={close}
            prefetch="intent"
            to={item.url}
          >
            {item.title}
          </NavLink>
        ))}
        <div className="header-menu__mobile-utilities">
          <button onClick={() => open('search')} type="button">
            <Icon name="search" />
            Search
          </button>
          <NavLink onClick={close} prefetch="intent" to="/account">
            <Icon name="account" />
            Account
          </NavLink>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Primary" className="header-menu header-menu--desktop">
      <ExploreMegaMenu onNavigate={close} />
      {PRIMARY_NAV_ITEMS.map((item) => (
        <NavLink
          className={({isActive}) => (isActive ? 'is-active' : undefined)}
          key={item.title}
          onClick={close}
          prefetch="intent"
          to={item.url}
        >
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}

function ExploreMegaMenu({onNavigate}: {onNavigate: () => void}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const closeMenu = useCallback(() => setOpen(false), []);

  const getMenuItems = useCallback(
    () =>
      Array.from(
        containerRef.current?.querySelectorAll<HTMLAnchorElement>(
          '[data-mega-item="true"]',
        ) ?? [],
      ),
    [],
  );

  const openAndFocus = (position: 'first' | 'last') => {
    setOpen(true);
    requestAnimationFrame(() => {
      const items = getMenuItems();
      items[position === 'first' ? 0 : items.length - 1]?.focus();
    });
  };

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
      }
    };
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) closeMenu();
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnPointerDown);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnPointerDown);
    };
  }, [closeMenu, open]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = getMenuItems();
    if (items.length === 0) return;
    const currentIndex = items.indexOf(
      document.activeElement as HTMLAnchorElement,
    );
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : event.key === 'ArrowDown'
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  return (
    <div
      className="header-menu__group header-menu__group--mega"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={closeMenu}
      ref={containerRef}
    >
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="menu"
        className="header-menu__trigger"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openAndFocus(event.key === 'ArrowDown' ? 'first' : 'last');
          }
        }}
        ref={triggerRef}
        type="button"
      >
        Explore
        <Icon name="chevron-down" size={12} />
      </button>
      <div
        aria-label="Explore menu"
        className="header-menu__mega-panel"
        data-open={open || undefined}
        hidden={!open}
        id={panelId}
        onKeyDown={handleMenuKeyDown}
        role="menu"
      >
        <div className="header-menu__mega-inner">
          {EXPLORE_NAV_GROUPS.map((group, groupIndex) => {
            const headingId = `${panelId}-group-${groupIndex}`;
            return (
              <section
                aria-labelledby={headingId}
                className="header-menu__mega-group"
                key={group.title}
                role="none"
              >
                <h2 id={headingId}>{group.title}</h2>
                <ul role="group">
                  {group.items.map((item) => (
                    <li key={item.title} role="none">
                      <NavLink
                        className={({isActive}) =>
                          isActive ? 'is-active' : undefined
                        }
                        data-mega-item="true"
                        onClick={() => {
                          closeMenu();
                          onNavigate();
                        }}
                        prefetch="intent"
                        role="menuitem"
                        to={item.url}
                      >
                        {item.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeaderSearch() {
  const {open} = useAside();

  return (
    <button
      aria-label="Search Render-Lab"
      className="header-search"
      onClick={() => open('search')}
      type="button"
    >
      <Icon name="search" />
      <span>Search art, collections, and formats</span>
    </button>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  const {open} = useAside();
  return (
    <nav aria-label="Store utilities" className="header-ctas">
      <IconButton
        className="header-cta header-cta--search"
        icon="search"
        label="Search"
        onClick={() => open('search')}
      />
      <NavLink
        aria-label="Account"
        className="header-cta header-cta--account"
        prefetch="intent"
        to="/account"
      >
        <Icon name="account" />
        <span className="sr-only">
          <Suspense fallback="Account">
            <Await resolve={isLoggedIn} errorElement="Account">
              {(loggedIn) => (loggedIn ? 'Account' : 'Sign in')}
            </Await>
          </Suspense>
        </span>
      </NavLink>
      <CartToggle cart={cart} />
    </nav>
  );
}

export function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <IconButton
      className="header-menu-toggle"
      icon="menu"
      label="Open menu"
      onClick={() => open('mobile')}
    />
  );
}

export function HeaderCartCount({count}: {count: number}) {
  return (
    <span className="icon-button__badge" aria-label={`${count} cart items`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  return (
    <button
      aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      className="icon-button header-cta"
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      type="button"
    >
      <Icon name="cart" />
      {count > 0 ? <HeaderCartCount count={count} /> : null}
    </button>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}
