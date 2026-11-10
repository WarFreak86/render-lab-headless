import {useAnalytics, useNonce} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router';
import {getStorefrontEnvironment} from '~/lib/config';

const PRODUCTION_ID = 'G-ELCN4Z6M92';
const GA4_ID_PATTERN = /^G-[A-Z0-9]+$/;
// Keep campaign attribution without transmitting arbitrary URL parameters to GA4.
const GA4_CAMPAIGN_PARAM_PATTERN =
  /^(utm_(source|medium|campaign|id|term|content|source_platform|creative_format|marketing_tactic)|gclid|gclsrc|gbraid|wbraid|gad_source|msclkid|epik)$/i;

export function getGa4PageViewParameters(href: string, title: string) {
  const original = new URL(href);
  const safeLocation = new URL(original.pathname, original.origin);
  for (const [key, value] of original.searchParams) {
    if (GA4_CAMPAIGN_PARAM_PATTERN.test(key) && value.trim()) {
      safeLocation.searchParams.append(key, value);
    }
  }

  return {
    page_path: original.pathname,
    page_location: safeLocation.toString(),
    page_title: title,
  };
}
type Gtag = (...args: unknown[]) => void;

type Browser = Window & {
  dataLayer?: ArrayLike<unknown>[];
  gtag?: Gtag;
  __renderLabGA4ConfiguredId?: string;
  Shopify?: {
    customerPrivacy?: {analyticsProcessingAllowed?: () => boolean};
  };
};

type ViewProduct = {
  id: string;
  price?: string | number | null;
  title: string;
  vendor?: string | null;
  variantId?: string | null;
  variantTitle?: string | null;
};

type CartLine = {
  quantity: number;
  cost?: {
    amountPerQuantity?: {amount: string; currencyCode: string} | null;
  } | null;
  merchandise?: {
    id: string;
    title?: string | null;
    product?: {title: string; vendor?: string | null} | null;
  } | null;
};

function allowed(canTrack: () => boolean, previewMeasurementId?: string) {
  if (typeof window === 'undefined') return false;
  const environment = getStorefrontEnvironment(window.location.href);
  if (environment === 'local') return false;
  if (
    environment === 'preview' &&
    (!previewMeasurementId ||
      !GA4_ID_PATTERN.test(previewMeasurementId) ||
      previewMeasurementId === PRODUCTION_ID)
  ) return false;

  return (
    canTrack() &&
    (window as Browser).Shopify?.customerPrivacy?.analyticsProcessingAllowed?.() === true
  );
}

/** Standard gtag.js bootstrap: queue gtag arguments, not GTM ecommerce objects. */
function initializeGtag(id: string, nonce?: string) {
  const browser = window as Browser;
  if (browser.__renderLabGA4ConfiguredId === id && browser.gtag) return;
  if (typeof browser.gtag !== 'function') {
    browser.dataLayer ||= [];
    browser.gtag = function () {
      // eslint-disable-next-line prefer-rest-params -- gtag.js requires native Arguments, not arrays.
      browser.dataLayer!.push(arguments);
    };

    const script = document.createElement('script');
    script.async = true;
    if (nonce) script.nonce = nonce;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(script);

    browser.gtag('js', new Date());
  }

  browser.gtag('config', id, {send_page_view: false});
  browser.__renderLabGA4ConfiguredId = id;
}

export function createGa4ViewItemData(product?: ViewProduct | null, currency = 'USD') {
  if (!product?.id) return null;
  const price = Number(product.price);
  const validPrice = product.price != null && Number.isFinite(price) && price >= 0;
  return {
    currency,
    value: validPrice ? price : undefined,
    items: [
      {
        item_id: product.variantId || product.id,
        item_name: product.title,
        item_brand: product.vendor,
        item_variant: product.variantTitle,
        price: validPrice ? price : undefined,
        quantity: 1,
      },
    ],
  };
}

/** Report only the added quantity, not the whole cart line. */
export function createGa4AddToCartData(
  current?: CartLine | null,
  previous?: CartLine | null,
) {
  if (!current) return null;
  const quantity = current.quantity - (previous?.quantity ?? 0);
  const variant = current.merchandise;
  const price = Number(current.cost?.amountPerQuantity?.amount);
  const currency = current.cost?.amountPerQuantity?.currencyCode;

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    !variant?.id ||
    !Number.isFinite(price) ||
    price < 0 ||
    !currency
  ) return null;

  return {
    currency,
    value: Math.round(price * quantity * 100) / 100,
    items: [
      {
        item_id: variant.id,
        item_name: variant.product?.title || variant.title,
        item_brand: variant.product?.vendor,
        item_variant: variant.title,
        price,
        quantity,
      },
    ],
  };
}

/** Send GA4 event parameters directly, without a GTM-style ecommerce wrapper. */
export function dispatchGa4EcommerceEvent(
  name: 'view_item' | 'add_to_cart',
  payload: NonNullable<ReturnType<typeof createGa4ViewItemData>> |
    NonNullable<ReturnType<typeof createGa4AddToCartData>>,
) {
  if (typeof window === 'undefined') return;
  const gtag = (window as Browser).gtag;
  if (typeof gtag === 'function') {
    gtag('event', name, payload);
  }
}

/**
 * Tracks storefront only. Shopify checkout is responsible for purchase events.
 * Consent is required before the tag is loaded or an ecommerce event is sent.
 */
export function GoogleAnalytics({
  previewMeasurementId,
}: {
  previewMeasurementId?: string;
}) {
  const measurementId =
    typeof window !== 'undefined' &&
    getStorefrontEnvironment(window.location.href) === 'preview'
      ? previewMeasurementId
      : PRODUCTION_ID;
  const {subscribe, register, canTrack} = useAnalytics();
  const {pathname} = useLocation();
  const nonce = useNonce();
  const lastPage = useRef<string | null>(null);
  const sendPage = useRef<(() => void) | null>(null);
  const {ready} = register('GoogleAnalytics');

  useEffect(() => {
    const page = () => {
      if (!allowed(canTrack, previewMeasurementId) || !measurementId) return;
      const path = window.location.pathname;
      if (lastPage.current === path) return;
      initializeGtag(measurementId, nonce);
      (window as Browser).gtag?.(
        'event',
        'page_view',
        getGa4PageViewParameters(window.location.href, document.title),
      );
      lastPage.current = path;
    };
    sendPage.current = page;

    subscribe('page_viewed', page);
    subscribe('product_viewed', (event) => {
      if (!allowed(canTrack, previewMeasurementId) || !measurementId) return;
      const payload = createGa4ViewItemData(event.products?.[0], event.shop?.currency);
      if (!payload) return;
      initializeGtag(measurementId, nonce);
      dispatchGa4EcommerceEvent('view_item', payload);
    });

    subscribe('product_added_to_cart', (event) => {
      if (!allowed(canTrack, previewMeasurementId) || !measurementId) return;
      const payload = createGa4AddToCartData(
        event.currentLine as unknown as CartLine | undefined,
        event.prevLine as unknown as CartLine | undefined,
      );
      if (!payload) return;
      initializeGtag(measurementId, nonce);
      dispatchGa4EcommerceEvent('add_to_cart', payload);
    });

    document.addEventListener('shopifyCustomerPrivacyApiLoaded', page);
    document.addEventListener('visitorConsentCollected', page);

    ready();
    page();

    return () => {
      document.removeEventListener('shopifyCustomerPrivacyApiLoaded', page);
      document.removeEventListener('visitorConsentCollected', page);
    };
    // Hydrogen subscriptions are registered once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sendPage.current?.();
  }, [pathname]);

  return null;
}
