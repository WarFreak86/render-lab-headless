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
  Shopify?: {customerPrivacy?: {analyticsProcessingAllowed?: () => boolean}};
};
type Line = {
  quantity: number;
  cost?: {amountPerQuantity?: {amount: string; currencyCode: string} | null} | null;
  merchandise?: {id: string; title?: string | null; product?: {title: string; vendor?: string | null} | null} | null;
};

function allowed(canTrack: () => boolean, previewMeasurementId?: string) {
  if (typeof window === 'undefined') return false;
  const environment = getStorefrontEnvironment(window.location.href);
  if (environment === 'local') return false;
  if (environment === 'preview' &&
      (!previewMeasurementId || !GA4_ID_PATTERN.test(previewMeasurementId) ||
       previewMeasurementId === PRODUCTION_ID)) return false;
  return canTrack() &&
    (window as Browser).Shopify?.customerPrivacy?.analyticsProcessingAllowed?.() === true;
}

function tag(id: string): Gtag {
  const browser = window as Browser;
  if (browser.__renderLabGA4ConfiguredId === id && browser.gtag) return browser.gtag;
  if (!browser.gtag) {
    browser.dataLayer ||= [];
    browser.gtag = (...args: unknown[]) => { browser.dataLayer!.push(args); };
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(script);
    browser.gtag('js', new Date());
  }
  browser.gtag('config', id, {send_page_view: false});
  browser.__renderLabGA4ConfiguredId = id;
  return browser.gtag;
}

/** Storefront events only. Purchase events must be configured on Shopify checkout. */
export function GoogleAnalytics({previewMeasurementId}: {previewMeasurementId?: string}) {
  const measurementId = typeof window !== 'undefined' &&
    getStorefrontEnvironment(window.location.href) === 'preview'
    ? previewMeasurementId
    : PRODUCTION_ID;
  const {subscribe, register, canTrack} = useAnalytics();
  const lastPage = useRef<string | null>(null);
  const {ready} = register('GoogleAnalytics');

  useEffect(() => {
    const page = () => {
      if (!allowed(canTrack, previewMeasurementId)) return;
      const url = window.location.href;
      if (lastPage.current === url) return;
      tag(measurementId!)('event', 'page_view', {page_location: url, page_title: document.title});
      lastPage.current = url;
    };
    subscribe('page_viewed', page);
    subscribe('product_viewed', (event) => {
      if (!allowed(canTrack, previewMeasurementId)) return;
      const p = event.products?.[0];
      if (!p?.id) return;
      const price = Number(p.price);
      tag(measurementId!)('event', 'view_item', {
        currency: 'USD',
        value: Number.isFinite(price) ? price : undefined,
        items: [{
          item_id: p.variantId || p.id,
          item_name: p.title,
          item_brand: p.vendor,
          item_variant: p.variantTitle,
          price: Number.isFinite(price) ? price : undefined,
          quantity: 1,
        }],
      });
    });
    subscribe('product_added_to_cart', (event) => {
      if (!allowed(canTrack, previewMeasurementId)) return;
      const current = event.currentLine as unknown as Line | undefined;
      const previous = event.prevLine as unknown as Line | undefined;
      const quantity = (current?.quantity ?? 0) - (previous?.quantity ?? 0);
      const variant = current?.merchandise;
      const price = Number(current?.cost?.amountPerQuantity?.amount);
      const currency = current?.cost?.amountPerQuantity?.currencyCode;
      if (!Number.isInteger(quantity) || quantity <= 0 || !variant?.id ||
          !Number.isFinite(price) || !currency) return;
      tag(measurementId!)('event', 'add_to_cart', {
        currency, value: Math.round(price * quantity * 100) / 100,
        items: [{item_id: variant.id, item_name: variant.product?.title || variant.title,
          item_brand: variant.product?.vendor, item_variant: variant.title, price, quantity}],
      });
    });
    document.addEventListener('shopifyCustomerPrivacyApiLoaded', page);
    document.addEventListener('visitorConsentCollected', page);
    ready();
    page();
    return () => {
      document.removeEventListener('shopifyCustomerPrivacyApiLoaded', page);
      document.removeEventListener('visitorConsentCollected', page);
    };
    // Shopify subscriptions are registered once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
