import {useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {getStorefrontEnvironment} from '~/lib/config';

const PINTEREST_TAG_ID = '2612416049289';
const PINTEREST_SCRIPT_URL = 'https://s.pinimg.com/ct/core.js';

type PinterestTracker = ((...args: unknown[]) => void) & {
  queue?: unknown[][];
  version?: string;
};

type PrivacyWindow = Window & {
  Shopify?: {
    customerPrivacy?: {
      marketingAllowed?: () => boolean;
    };
  };
  pintrk?: PinterestTracker;
  __renderLabPinterestInitialized?: boolean;
};

type CartLineSnapshot = {
  quantity: number;
  cost?: {
    amountPerQuantity?: {
      amount: string;
      currencyCode: string;
    } | null;
  } | null;
  merchandise?: {
    id: string;
    title?: string | null;
    product?: {
      id: string;
      title: string;
      vendor?: string | null;
    } | null;
  } | null;
};

type AddToCartData = {
  value: number;
  order_quantity: number;
  currency: string;
  line_items: Array<{
    product_id: string;
    product_variant_id: string;
    product_name: string;
    product_variant?: string;
    product_brand?: string;
    product_price: number;
    product_quantity: number;
  }>;
};

/** Calculate only the increase, rather than the full existing cart line. */
export function createPinterestAddToCartData(
  currentLine?: CartLineSnapshot | null,
  prevLine?: CartLineSnapshot | null,
): AddToCartData | null {
  if (!currentLine) return null;

  const quantity = currentLine.quantity - (prevLine?.quantity ?? 0);
  const price = Number(currentLine.cost?.amountPerQuantity?.amount);
  const currency = currentLine.cost?.amountPerQuantity?.currencyCode;
  const variant = currentLine.merchandise;
  const product = variant?.product;

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !currency ||
    !variant?.id ||
    !product?.id
  ) {
    return null;
  }

  return {
    value: Math.round(price * quantity * 100) / 100,
    order_quantity: quantity,
    currency,
    line_items: [
      {
        product_id: product.id,
        product_variant_id: variant.id,
        product_name: product.title,
        ...(variant.title ? {product_variant: variant.title} : {}),
        ...(product.vendor ? {product_brand: product.vendor} : {}),
        product_price: price,
        product_quantity: quantity,
      },
    ],
  };
}

function canSendPinterestEvents(canTrack: () => boolean): boolean {
  if (typeof window === 'undefined') return false;
  if (getStorefrontEnvironment(window.location.href) !== 'production') {
    return false;
  }

  const privacy = (window as PrivacyWindow).Shopify?.customerPrivacy;
  // Pinterest is an advertising destination. Require marketing permission
  // in addition to Hydrogen's analytics permission before loading the tag.
  return canTrack() && privacy?.marketingAllowed?.() === true;
}

function pinterestTracker(): PinterestTracker {
  const browser = window as PrivacyWindow;

  if (typeof browser.pintrk !== 'function') {
    const queue: unknown[][] = [];
    const tracker = ((...args: unknown[]) => {
      queue.push(args);
    }) as PinterestTracker;
    tracker.queue = queue;
    tracker.version = '3.0';
    browser.pintrk = tracker;

    const script = document.createElement('script');
    script.src = PINTEREST_SCRIPT_URL;
    script.async = true;
    document.head.appendChild(script);

    browser.pintrk('load', PINTEREST_TAG_ID);
    browser.pintrk('page');
  }
  // If Shopify already installed the Pinterest tag, reuse it instead of
  // loading the base tag or sending its initial page event a second time.
  browser.__renderLabPinterestInitialized = true;
  return browser.pintrk!;
}

/**
 * Browser-only storefront events. Checkout/purchase stays managed by the
 * existing Pinterest for Shopify connection on checkout.render-lab.org.
 */
export function PinterestAnalytics() {
  const {subscribe, register, canTrack} = useAnalytics();
  const lastPageRef = useRef<string | null>(null);
  const {ready} = register('PinterestAnalytics');

  useEffect(() => {
    const sendPageVisit = () => {
      if (!canSendPinterestEvents(canTrack)) return;
      const path = window.location.pathname;
      if (lastPageRef.current === path) return;
      pinterestTracker()('track', 'pagevisit');
      lastPageRef.current = path;
    };

    subscribe('page_viewed', sendPageVisit);
    subscribe('product_added_to_cart', (event) => {
      if (!canSendPinterestEvents(canTrack)) return;

      const payload = createPinterestAddToCartData(
        event.currentLine as unknown as CartLineSnapshot,
        event.prevLine as unknown as CartLineSnapshot | undefined,
      );
      if (payload) pinterestTracker()('track', 'addtocart', payload);
    });

    const onConsentChange = () => sendPageVisit();
    document.addEventListener('shopifyCustomerPrivacyApiLoaded', onConsentChange);
    document.addEventListener('visitorConsentCollected', onConsentChange);

    // Register the destination before releasing Hydrogen's initial events.
    ready();
    sendPageVisit();

    return () => {
      document.removeEventListener('shopifyCustomerPrivacyApiLoaded', onConsentChange);
      document.removeEventListener('visitorConsentCollected', onConsentChange);
    };
    // Hydrogen's subscribe API has no unsubscribe; register once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
