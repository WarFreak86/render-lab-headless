import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import type {FetcherWithComponents} from 'react-router';
import {Link} from 'react-router';
import {useId} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {useAside} from '~/components/Aside';
import {Icon} from '~/components/Icon';
import {getCartMutationMessage} from '~/lib/cart';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const {close} = useAside();
  const subtotal = cart?.cost?.subtotalAmount;
  const itemCount = cart?.totalQuantity ?? 0;

  return (
    <footer className={`cart-summary cart-summary--${layout}`}>
      <CartOffers cart={cart} />
      <dl className="cart-summary__subtotal">
        <dt>
          Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </dt>
        <dd>{subtotal ? <Money data={subtotal} /> : '—'}</dd>
      </dl>
      <p className="cart-summary__disclaimer">
        Shipping and taxes calculated at checkout.
      </p>
      {cart?.checkoutUrl ? (
        <a className="cart-checkout" href={cart.checkoutUrl}>
          <Icon name="checkout" size={18} />
          Checkout
        </a>
      ) : null}
      {layout === 'aside' ? (
        <Link className="cart-view" onClick={close} to="/cart">
          View cart
        </Link>
      ) : null}
    </footer>
  );
}

function CartOffers({
  cart,
}: {
  cart: OptimisticCart<CartApiQueryFragment | null>;
}) {
  const discountInputId = useId();
  const giftCardInputId = useId();
  const appliedDiscounts =
    cart?.discountCodes?.filter((discount) => discount.applicable) ?? [];
  const appliedGiftCards = cart?.appliedGiftCards ?? [];

  return (
    <details className="cart-offers">
      <summary>Promo or gift card</summary>
      <div className="cart-offers__body">
        {appliedDiscounts.length ? (
          <ul className="cart-offers__applied" aria-label="Applied discounts">
            {appliedDiscounts.map((discount) => (
              <li key={discount.code}>
                <code>{discount.code}</code>
                <CartForm
                  action={CartForm.ACTIONS.DiscountCodesUpdate}
                  inputs={{
                    discountCodes: appliedDiscounts
                      .filter((item) => item.code !== discount.code)
                      .map((item) => item.code),
                  }}
                  route="/cart"
                >
                  <button type="submit">Remove</button>
                </CartForm>
              </li>
            ))}
          </ul>
        ) : null}
        <CartForm
          action={CartForm.ACTIONS.DiscountCodesUpdate}
          inputs={{discountCodes: appliedDiscounts.map((item) => item.code)}}
          route="/cart"
        >
          {(fetcher: FetcherWithComponents<unknown>) => (
            <OfferForm
              error={getCartMutationMessage(fetcher.data)}
              inputId={discountInputId}
              inputLabel="Discount code"
              inputName="discountCode"
              pending={fetcher.state !== 'idle'}
            />
          )}
        </CartForm>

        {appliedGiftCards.length ? (
          <ul className="cart-offers__applied" aria-label="Applied gift cards">
            {appliedGiftCards.map((giftCard) => (
              <li key={giftCard.id}>
                <span>
                  Gift card ending in {giftCard.lastCharacters} ·{' '}
                  <Money data={giftCard.amountUsed} />
                </span>
                <CartForm
                  action={CartForm.ACTIONS.GiftCardCodesRemove}
                  inputs={{giftCardCodes: [giftCard.id]}}
                  route="/cart"
                >
                  <button
                    aria-label={`Remove gift card ending in ${giftCard.lastCharacters}`}
                    type="submit"
                  >
                    Remove
                  </button>
                </CartForm>
              </li>
            ))}
          </ul>
        ) : null}
        <CartForm action={CartForm.ACTIONS.GiftCardCodesAdd} route="/cart">
          {(fetcher: FetcherWithComponents<unknown>) => (
            <OfferForm
              error={getCartMutationMessage(fetcher.data)}
              inputId={giftCardInputId}
              inputLabel="Gift card code"
              inputName="giftCardCode"
              pending={fetcher.state !== 'idle'}
            />
          )}
        </CartForm>
      </div>
    </details>
  );
}

function OfferForm({
  error,
  inputId,
  inputLabel,
  inputName,
  pending,
}: {
  error?: string;
  inputId: string;
  inputLabel: string;
  inputName: string;
  pending: boolean;
}) {
  return (
    <div className="cart-offers__form">
      <label className="sr-only" htmlFor={inputId}>
        {inputLabel}
      </label>
      <input id={inputId} name={inputName} placeholder={inputLabel} />
      <button disabled={pending} type="submit">
        {pending ? 'Applying…' : 'Apply'}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
