import {CartForm, useOptimisticCart} from '@shopify/hydrogen';
import type {FetcherWithComponents} from 'react-router';
import {Link} from 'react-router';
import {useEffect, useId, useState} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartShippingProgress} from '~/components/CartShippingProgress';
import {CartSummary} from '~/components/CartSummary';
import {getCartMutationMessage} from '~/lib/cart';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

export function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childLines] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childLines);
      }
    }
  }
  return children;
}

export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const lines = cart?.lines?.nodes ?? [];
  const cartHasItems = (cart?.totalQuantity ?? 0) > 0;
  const withDiscount = Boolean(
    cart?.discountCodes?.some((code) => code.applicable),
  );
  const childrenMap = getLineItemChildrenMap(lines);

  return (
    <section
      className={`cart-main cart-main--${layout}${withDiscount ? ' with-discount' : ''}`}
      aria-label={layout === 'page' ? 'Cart page' : 'Cart drawer'}
    >
      {!cartHasItems ? <CartEmpty /> : null}
      {cartHasItems ? (
        <>
          <div className="cart-main__scroll">
            <CartShippingProgress subtotal={cart?.cost?.subtotalAmount} />
            <p id={`cart-lines-${layout}`} className="sr-only">
              Line items
            </p>
            <ul aria-labelledby={`cart-lines-${layout}`} className="cart-lines">
              {lines.map((line) => {
                if (
                  'parentRelationship' in line &&
                  line.parentRelationship?.parent
                ) {
                  return null;
                }
                return (
                  <CartLineItem
                    key={line.id}
                    line={line}
                    layout={layout}
                    childrenMap={childrenMap}
                  />
                );
              })}
            </ul>
            <CartNote note={cart?.note ?? ''} />
          </div>
          <CartSummary cart={cart} layout={layout} />
        </>
      ) : null}
    </section>
  );
}

function CartNote({note}: {note: string}) {
  const [value, setValue] = useState(note);
  const noteId = useId();
  useEffect(() => setValue(note), [note]);

  return (
    <details className="cart-note">
      <summary>Add an order note</summary>
      <CartForm
        action={CartForm.ACTIONS.NoteUpdate}
        inputs={{note: value}}
        route="/cart"
      >
        {(fetcher: FetcherWithComponents<unknown>) => {
          const pending = fetcher.state !== 'idle';
          const error = getCartMutationMessage(fetcher.data);
          return (
            <div className="cart-note__body">
              <label htmlFor={noteId}>Note for the studio</label>
              <textarea
                id={noteId}
                maxLength={250}
                onChange={(event) => setValue(event.currentTarget.value)}
                rows={3}
                value={value}
              />
              <div className="cart-note__actions">
                <span aria-live="polite">
                  {error ? <span role="alert">{error}</span> : null}
                </span>
                <button disabled={pending} type="submit">
                  {pending ? 'Saving…' : 'Save note'}
                </button>
              </div>
            </div>
          );
        }}
      </CartForm>
    </details>
  );
}

function CartEmpty() {
  const {close} = useAside();
  return (
    <div className="cart-empty">
      <p className="cart-empty__eyebrow">Your cart is quiet</p>
      <h3>Your collection starts here.</h3>
      <p>
        Explore original wall art and curated sets, then return when something earns
        its place.
      </p>
      <div className="cart-empty__actions">
        <Link
          className="button button--primary"
          onClick={close}
          to="/collections/wall-art"
        >
          Explore wall art
        </Link>
        <Link
          className="button button--secondary"
          onClick={close}
          to="/collections/bundles"
        >
          Shop bundles
        </Link>
      </div>
    </div>
  );
}
