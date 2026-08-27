import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import {
  CartForm,
  Image,
  Money,
  type OptimisticCartLine,
} from '@shopify/hydrogen';
import {Link, useFetcher} from 'react-router';
import type {
  CartApiQueryFragment,
  CartLineFragment,
} from 'storefrontapi.generated';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {useAside} from '~/components/Aside';
import {
  getCartMutationMessage,
  isMeaningfulCartOption,
  isStableShopifyLineId,
} from '~/lib/cart';
import {useVariantUrl} from '~/lib/variants';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const meaningfulOptions = selectedOptions.filter(isMeaningfulCartOption);
  const mutationKey = getCartMutationKey([id]);
  const mutationFetcher = useFetcher({key: mutationKey});
  const pending = mutationFetcher.state !== 'idle';
  const mutationError = getCartMutationMessage(mutationFetcher.data);

  return (
    <li className="cart-line">
      <article className="cart-line__inner">
        <Link
          aria-label={`View ${product.title}`}
          className="cart-line__media"
          onClick={layout === 'aside' ? close : undefined}
          prefetch="intent"
          to={lineItemUrl}
        >
          {image ? (
            <Image
              alt={image.altText || `${product.title} — ${title}`}
              data={image}
              height={128}
              loading="lazy"
              sizes="(max-width: 430px) 88px, 112px"
              width={128}
            />
          ) : (
            <span aria-hidden className="cart-line__media-placeholder" />
          )}
        </Link>

        <div className="cart-line__content">
          <div className="cart-line__heading">
            <div>
              <Link
                className="cart-line__title"
                onClick={layout === 'aside' ? close : undefined}
                prefetch="intent"
                to={lineItemUrl}
              >
                {product.title}
              </Link>
              {meaningfulOptions.length ? (
                <dl className="cart-line__options">
                  {meaningfulOptions.map((option) => (
                    <div key={option.name}>
                      <dt>{option.name}</dt>
                      <dd>{option.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
            <Money
              as="p"
              className="cart-line__price"
              data={line.cost.totalAmount}
            />
          </div>

          <div className="cart-line__actions">
            <CartLineQuantity
              line={line}
              mutationKey={mutationKey}
              pending={pending}
            />
            <CartLineRemoveButton
              disabled={!isStableShopifyLineId(id)}
              lineId={id}
              mutationKey={mutationKey}
              pending={pending}
              productTitle={product.title}
            />
          </div>
          <div
            aria-live="polite"
            className="cart-line__status"
            data-pending={pending || undefined}
          >
            {mutationError ? (
              <span role="alert">{mutationError}</span>
            ) : pending ? (
              'Updating cart…'
            ) : null}
          </div>
        </div>
      </article>

      {lineItemChildren?.length ? (
        <div className="cart-line__children">
          <p id={`cart-line-children-${id}`} className="sr-only">
            Items included with {product.title}
          </p>
          <ul aria-labelledby={`cart-line-children-${id}`}>
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function CartLineQuantity({
  line,
  mutationKey,
  pending,
}: {
  line: CartLine;
  mutationKey: string;
  pending: boolean;
}) {
  if (typeof line.quantity === 'undefined') return null;
  const {id: lineId, quantity} = line;
  const stableLine = isStableShopifyLineId(lineId);
  const productTitle = line.merchandise.product.title;

  return (
    <div
      aria-label={`Quantity for ${productTitle}`}
      className="cart-line-quantity"
      role="group"
    >
      <CartLineUpdateButton
        fetcherKey={mutationKey}
        lines={[{id: lineId, quantity: Math.max(1, quantity - 1)}]}
      >
        <button
          aria-busy={pending || undefined}
          aria-label={`Decrease quantity of ${productTitle}`}
          disabled={!stableLine || quantity <= 1}
          type="submit"
        >
          <span aria-hidden>−</span>
        </button>
      </CartLineUpdateButton>
      <output aria-live="off" aria-label="Current quantity">
        {quantity}
      </output>
      <CartLineUpdateButton
        fetcherKey={mutationKey}
        lines={[{id: lineId, quantity: quantity + 1}]}
      >
        <button
          aria-busy={pending || undefined}
          aria-label={`Increase quantity of ${productTitle}`}
          disabled={!stableLine}
          type="submit"
        >
          <span aria-hidden>+</span>
        </button>
      </CartLineUpdateButton>
    </div>
  );
}

function CartLineRemoveButton({
  disabled,
  lineId,
  mutationKey,
  pending,
  productTitle,
}: {
  disabled: boolean;
  lineId: string;
  mutationKey: string;
  pending: boolean;
  productTitle: string;
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.LinesRemove}
      fetcherKey={mutationKey}
      inputs={{lineIds: [lineId]}}
      route="/cart"
    >
      <button
        aria-busy={pending || undefined}
        aria-label={`Remove ${productTitle} from cart`}
        className="cart-line__remove"
        disabled={disabled}
        type="submit"
      >
        Remove
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  fetcherKey,
  lines,
}: {
  children: React.ReactNode;
  fetcherKey: string;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      action={CartForm.ACTIONS.LinesUpdate}
      fetcherKey={fetcherKey}
      inputs={{lines}}
      route="/cart"
    >
      {children}
    </CartForm>
  );
}

export function getCartMutationKey(lineIds: string[]) {
  return ['cart-line', ...lineIds].join('-');
}

export type {CartLineFragment};
