import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';
import {SHOPIFY_CHECKOUT_DOMAIN} from '~/lib/config';

const extraDefaultSources = [
  'https://s.pinimg.com',
  'https://ct.pinterest.com',
  'https://www.googletagmanager.com',
  'https://hcaptcha.com',
  'https://*.hcaptcha.com',
];

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain:
        context.env.PUBLIC_CHECKOUT_DOMAIN || SHOPIFY_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    // Analytics scripts and collection endpoints must be allowed by the
    // existing CSP; add only these hosts to Hydrogen's default directives.
    // Shopify's native U.S. Privacy Choices page embeds hCaptcha. Allow only
    // hCaptcha-owned origins needed by its challenge scripts and frames.
    defaultSrc: extraDefaultSources,
    // Keep the existing default image sources when setting an explicit img-src.
    imgSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://shopify.com',
      ...(import.meta.env.DEV ? ['http://localhost:*'] : []),
      ...extraDefaultSources,
      'https://static.subliminator.com/shops/images/size-guides/hoodie.png',
    ],
    connectSrc: [
      'https://ct.pinterest.com',
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://www.googletagmanager.com',
      'https://hcaptcha.com',
      'https://*.hcaptcha.com',
    ],
    styleSrc: ['https://*.hcaptcha.com'],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
