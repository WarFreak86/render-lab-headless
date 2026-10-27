import {useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {getStorefrontEnvironment} from '~/lib/config';

const ID = 'G-ELCN4Z6M92';
type Gtag = (...args: unknown[]) => void;
type Browser = Window & {
  dataLayer?: unknown[][];
  gtag?: Gtag;
  __renderLabGA4?: boolean;
  Shopify?: {customerPrivacy?: {analyticsProcessingAllowed?: () => boolean}};
};
type Line = {
  quantity: number;
  cost?: {amountPerQuantity?: {amount: string; currencyCode: string} | null} | null;
  merchandise?: {id: string; title?: string | null; product?: {title: string; vendor?: string | null} | null} | null;
};

function allowed(canTrack: () => boolean) {
  if (typeof window === 'undefined') return false;
  return getStorefrontEnvironment(window.location.href) === 'production' &&
    canTrack() &&
    (window as Browser).Shopify?.customerPrivacy?.analyticsProcessingAllowed?.() === true;
}

function tag(): Gtag {
  const browser = window as Browser;
  if (browser.__renderLabGA4 && browser.gtag) return browser.gtag;
  if (!browser.gtag) {
    browser.dataLayer ||= [];
    browser.gtag = (...args: unknown[]) => { browser.dataLayer!.push(args); };
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(script);
    browser.gtag('js', new Date());
  }
  browser.gtag('config', ID, {send_page_view: false});
  browser.__renderLabGA4 = true;
  return browser.gtag;
}

/** Storefront events only. Purchase events must be configured on Shopify checkout. */
export function GoogleAnalytics() {
  const {subscribe, register, canTrack} = useAnalytics();
  const lastPage = useRef<string | null>(null);
  const {ready} = register('GoogleAnalytics');

  useEffect(() => {
    const page = () => {
      if (!allowed(canTrack)) return;
      const url = window.location.href;
      if (lastPage.current === url) return;
      tag()('event', 'page_view', {page_location: url, page_title: document.title});
      lastPage.current = url;
    };
    subscribe('page_viewed', page);
    subscribe('product_viewed', (event) => {
      if (!allowed(canTrack)) return;
      const p = event.products?.[0];
      if (!p?.id) return;
      const price = Number(p.price?.amount);
      tag()('event', 'view_item', {
        currency: p.price?.currencyCode,
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
      if (!allowed(canTrack)) return;
      const current = event.currentLine as unknown as Line | undefined;
      const previous = event.prevLine as unknown as Line | undefined;
      const quantity = (current?.quantity ?? 0) - (previous?.quantity ?? 0);
      const variant = current?.merchandise;
      const price = Number(current?.cost?.amountPerQuantity?.amount);
      const currency = current?.cost?.amountPerQuantity?.currencyCode;
      if (!Number.isInteger(quantity) || quantity <= 0 || !variant?.id ||
          !Number.isFinite(price) || !currency) return;
      tag()('event', 'add_to_cart', {
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
