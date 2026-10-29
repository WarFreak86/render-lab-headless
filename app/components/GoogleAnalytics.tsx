import {useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {getStorefrontEnvironment} from '~/lib/config';

const PRODUCTION_ID = 'G-ELCN4Z6M92';
const GA4_ID_PATTERN = /^G-[A-Z0-9]+$/;
type Gtag = (...args: unknown[]) => void;

type Browser = Window & {
  dataLayer?: unknown[][];
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
function initializeGtag(id: string) {
  const browser = window as Browser;
  if (browser.__renderLabGA4ConfiguredId === id && browser.gtag) return;
  if (typeof browser.gtag !== 'function') {
    browser.dataLayer ||= [];
    browser.gtag = (...args: unknown[]) => {
      browser.dataLayer!.push(args);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(script);

    browser.gtag('js', new Date());
  }

  browser.gtag('config', id, {send_page_view: false});
  browser.__renderLabGA4ConfiguredId = id;
}

export function createGa4ViewItemData(product?: ViewProduct | null) {
  if (!product?.id) return null;
  const price = Number(product.price);
  const validPrice = product.price != null && Number.isFinite(price) && price >= 0;
  return {
    currency: 'USD',
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
  const lastPage = useRef<string | null>(null);
  const {ready} = register('GoogleAnalytics');

  useEffect(() => {
    const page = () => {
      if (!allowed(canTrack, previewMeasurementId) || !measurementId) return;
      const url = window.location.href;
      if (lastPage.current === url) return;
      initializeGtag(measurementId);
      (window as Browser).gtag?.('event', 'page_view', {
        page_location: url,
        page_title: document.title,
      });
      lastPage.current = url;
    };

    subscribe('page_viewed', page);
    subscribe('product_viewed', (event) => {
      if (!allowed(canTrack, previewMeasurementId) || !measurementId) return;
      const payload = createGa4ViewItemData(event.products?.[0]);
      if (!payload) return;
      initializeGtag(measurementId);
      dispatchGa4EcommerceEvent('view_item', payload);
    });

    subscribe('product_added_to_cart', (event) => {
      if (!allowed(canTrack, previewMeasurementId) || !measurementId) return;
      const payload = createGa4AddToCartData(
        event.currentLine as unknown as CartLine | undefined,
        event.prevLine as unknown as CartLine | undefined,
      );
      if (!payload) return;
      initializeGtag(measurementId);
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

  return null;
}
