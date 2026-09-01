import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Link,
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import {SHOPIFY_CHECKOUT_DOMAIN, SITE_NAME} from '~/lib/config';
import {getRouteErrorPresentation} from '~/lib/errors';
import {
  getEnvironmentRobotsDirective,
  getGlobalStructuredData,
  safeJsonLd,
} from '~/lib/seo';
import resetStyles from '~/styles/reset.css?url';
import tokenStyles from '~/styles/tokens.css?url';
import appStyles from '~/styles/app.css?url';
import navigationStyles from '~/styles/navigation.css?url';
import homeStyles from '~/styles/home.css?url';
import collectionStyles from '~/styles/collection.css?url';
import productStyles from '~/styles/product.css?url';
import cartStyles from '~/styles/cart.css?url';
import dropStyles from '~/styles/drop.css?url';
import enhancementStyles from '~/styles/enhancements.css?url';
import {PageLayout} from './components/PageLayout';

import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';

export type RootLoader = typeof loader;

export const meta: Route.MetaFunction = () => {
  return [
    {title: SITE_NAME},
    {
      name: 'description',
      content: 'Render-Lab — art, editions, and objects for collectors.',
    },
  ];
};

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN || SHOPIFY_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
    robots: getEnvironmentRobotsDirective(args.request.url),
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {header};
}

/**
 * Load data necessary for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const rootData = useRouteLoaderData<RootLoader>('root');
  const globalJsonLd = safeJsonLd(getGlobalStructuredData());

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={tokenStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <link rel="stylesheet" href={navigationStyles}></link>
        <link rel="stylesheet" href={homeStyles}></link>
        <link rel="stylesheet" href={collectionStyles}></link>
        <link rel="stylesheet" href={productStyles}></link>
        <link rel="stylesheet" href={cartStyles}></link>
        <link rel="stylesheet" href={dropStyles}></link>
        <link rel="stylesheet" href={enhancementStyles}></link>
        {rootData?.robots ? (
          <meta name="robots" content={rootData.robots} />
        ) : null}
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{__html: globalJsonLd}}
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
        />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
  }
  const presentation = getRouteErrorPresentation(errorStatus);

  return (
    <main className="route-error">
      <Link className="route-error__brand" to="/">
        RENDER-LAB
      </Link>
      <div className="route-error__content">
        <p className="route-error__eyebrow">{presentation.eyebrow}</p>
        <h1>{presentation.title}</h1>
        <p>{presentation.message}</p>
        <div className="route-error__actions">
          <Link className="button button--primary" to="/">
            Return home
          </Link>
          <Link className="button button--secondary" to="/collections">
            Browse collections
          </Link>
        </div>
      </div>
    </main>
  );
}
