import {Suspense, useEffect, useState} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {Icon} from '~/components/Icon';
import {IconButton} from '~/components/IconButton';
import {useAside} from '~/components/Aside';
import {SITE_NAME} from '~/lib/config';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

const PRIMARY_NAV_ITEMS = [
  {title: 'Art Prints', url: '/collections/wall-art', visible: true},
  {title: 'Metal Prints', url: '/collections/metal', visible: true},
  {title: 'Canvas Prints', url: '/collections/cavas', visible: true},
  {title: 'Digital Downloads', url: '/collections/printables', visible: true},
  {title: 'Apparel', url: '/collections/hoodies', visible: true},
  {title: 'Collections', url: '/collections', visible: true},
  // Keep the intended destination configured, but do not expose a known 404.
  {title: 'About', url: '/pages/about', visible: false},
] as const;

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
          RENDER-LAB
        </NavLink>
        <HeaderMenu viewport="desktop" />
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>
    </header>
  );
}

export function HeaderMenu({viewport}: {viewport: Viewport}) {
  const {close} = useAside();
  return (
    <nav
      aria-label={viewport === 'mobile' ? 'Mobile navigation' : 'Primary'}
      className={`header-menu header-menu--${viewport}`}
    >
      {viewport === 'mobile' ? (
        <NavLink end onClick={close} prefetch="intent" to="/">
          Home
        </NavLink>
      ) : null}
      {PRIMARY_NAV_ITEMS.filter((item) => item.visible).map((item) => (
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
