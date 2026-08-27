import {Money} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import {getShippingProgress, type ShippingThreshold} from '~/lib/cart';

export function CartShippingProgress({
  subtotal,
  threshold,
}: {
  subtotal?: {amount?: string; currencyCode?: CurrencyCode};
  threshold?: ShippingThreshold;
}) {
  if (
    !subtotal?.amount ||
    !subtotal.currencyCode ||
    !threshold ||
    subtotal.currencyCode !== threshold.currencyCode
  ) {
    return null;
  }

  const progress = getShippingProgress(Number(subtotal.amount), threshold);
  if (!progress) return null;

  return (
    <section className="cart-shipping" aria-label="Shipping progress">
      <p>
        {progress.qualified ? (
          'Your cart qualifies for the configured shipping offer.'
        ) : (
          <>
            Add{' '}
            <Money
              data={{
                amount: String(progress.remaining),
                currencyCode: threshold.currencyCode,
              }}
            />{' '}
            to reach the configured shipping offer.
          </>
        )}
      </p>
      <div
        aria-label={`${Math.round(progress.progress)}% complete`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(progress.progress)}
        className="cart-shipping__track"
        role="progressbar"
      >
        <span style={{width: `${progress.progress}%`}} />
      </div>
    </section>
  );
}
