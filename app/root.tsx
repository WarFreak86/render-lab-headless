import rootStyles from '~/styles/root-bundle.css?url';
import type {loader as homepageLoader} from '~/routes/_index';
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
import {
  PRODUCTION_ORIGIN,
  SHOPIFY_CHECKOUT_DOMAIN,
  SITE_NAME,
} from '~/lib/config';
import {
  isLiveCollectionHandle,
  LIVE_COLLECTION_QUERY,
} from '~/lib/catalog-collections';
import {isStorefrontArtistReady, sanitizeMenuItems} from '~/lib/navigation';
import {getRouteErrorPresentation} from '~/lib/errors';
import {
  getEnvironmentRobotsDirective,
  getGlobalStructuredData,
  safeJsonLd,
} from '~/lib/seo';
import {PageLayout} from './components/PageLayout';
import {PinterestAnalytics} from './components/PinterestAnalytics';
import {GoogleAnalytics} from './components/GoogleAnalytics';

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
 * Keep shared storefront data current while respecting React Router's normal
 * revalidation behavior. This is especially important for dynamic collections
 * that power the header navigation.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}) => {
  // Revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // Revalidate when manually revalidating via useRevalidator.
  if (currentUrl.toString() === nextUrl.toString()) return true;

  return defaultShouldRevalidate;
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
    previewGa4MeasurementId: (env as typeof env & {PUBLIC_GA4_PREVIEW_MEASUREMENT_ID?: string}).PUBLIC_GA4_PREVIEW_MEASUREMENT_ID,
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
      // Collections drive the dynamic navigation, so keep this cache deliberately short.
      cache: storefront.CacheShort(),
      variables: {
        collectionQuery: LIVE_COLLECTION_QUERY,
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    header: {
      ...header,
      shop: {...header.shop, primaryDomain: {url: PRODUCTION_ORIGIN}},
      menu: header.menu
        ? {...header.menu, items: sanitizeMenuItems(header.menu.items)}
        : null,
      collections: {
        nodes: header.collections.nodes.filter(({handle}) =>
          isLiveCollectionHandle(handle),
        ),
      },
      artists: {
        nodes: header.artists.nodes.filter(({handle}) =>
          isStorefrontArtistReady(handle),
        ),
      },
    },
  };
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
    .then((data) => ({
      ...data,
      menu: data.menu
        ? {...data.menu, items: sanitizeMenuItems(data.menu.items)}
        : null,
    }))
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
  const homepage = useRouteLoaderData<typeof homepageLoader>('routes/_index');
  const globalJsonLd = safeJsonLd(
    getGlobalStructuredData(homepage?.homepage.featuredCollections),
  );

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Links />
        <link rel="stylesheet" href={rootStyles} />
        {rootData?.robots ? (
          <meta name="robots" content={rootData.robots} />
        ) : null}
        <Meta />
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
      <PinterestAnalytics />
      <GoogleAnalytics previewMeasurementId={data.previewGa4MeasurementId} />
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
