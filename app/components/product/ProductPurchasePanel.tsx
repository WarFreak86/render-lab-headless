import {CartForm, Money, type MappedProductOptions} from '@shopify/hydrogen';
import type {FetcherWithComponents} from 'react-router';
import {Link, useNavigate} from 'react-router';
import {useEffect, useRef, useState, type ReactNode} from 'react';
import type {ProductFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {Button} from '~/components/Button';
import {Icon} from '~/components/Icon';
import {ProductPrice} from '~/components/ProductPrice';
import {getOptionState} from '~/lib/product';
import {
  getProductContext,
  isGenericCatalogLabel,
  splitProductIdentity,
} from '~/lib/product-presentation';

type SelectedVariant = ProductFragment['selectedOrFirstAvailableVariant'];

function getCartErrorMessage(data: unknown) {
  if (!data || typeof data !== 'object') return undefined;
  const result = data as {errors?: unknown; warnings?: unknown};
  const messages = [result.errors, result.warnings]
    .flatMap((value) => (Array.isArray(value) ? value : []))
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'message' in item) {
        return String((item as {message: unknown}).message);
      }
      return '';
    })
    .filter(Boolean);
  return messages[0];
}

function AddToCartControl({
  disabledLabel,
  fetcher,
  purchaseAllowed,
  selectedVariant,
}: {
  disabledLabel?: string;
  fetcher: FetcherWithComponents<unknown>;
  purchaseAllowed: boolean;
  selectedVariant: SelectedVariant;
}) {
  const {open, type: asideType} = useAside();
  const mainControl = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const submittedRef = useRef(false);
  const loading = fetcher.state !== 'idle';
  const error = getCartErrorMessage(fetcher.data);

  useEffect(() => {
    if (!mainControl.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting));
    observer.observe(mainControl.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (loading) {
      submittedRef.current = true;
      return;
    }
    if (!submittedRef.current) return;
    submittedRef.current = false;
    const data = fetcher.data as {cart?: unknown} | undefined;
    if (data?.cart && !getCartErrorMessage(fetcher.data)) open('cart');
  }, [fetcher.data, loading, open]);

  const available = Boolean(
    purchaseAllowed && selectedVariant?.availableForSale,
  );

  return (
    <>
      <div ref={mainControl}>
      <Button
        className="product-purchase__add"
        disabled={!available}
        loading={loading}
        type="submit"
      >
        {loading ? (
          'Adding…'
        ) : available && selectedVariant ? (
          <>
            Add to cart <span aria-hidden>•</span>{' '}
            <Money data={selectedVariant.price} />
          </>
        ) : (
          disabledLabel || 'Sold out'
        )}
      </Button>
      </div>
      {showSticky && asideType === 'closed' ? (
        <div className="product-purchase__sticky" aria-label="Quick purchase">
          <div aria-live="polite">
            {selectedVariant ? <Money data={selectedVariant.price} /> : null}
            <small>{selectedVariant?.selectedOptions.map((option) => option.value).join(' · ')}</small>
          </div>
          <Button disabled={!available} loading={loading} type="submit">
            {loading ? 'Adding…' : available ? 'Add to cart' : disabledLabel || 'Sold out'}
          </Button>
        </div>
      ) : null}
      <div className="product-purchase__message" aria-live="polite">
        {error ? <p role="alert">{error}</p> : null}
      </div>
    </>
  );
}

function ProductAddToCart({
  disabledLabel,
  purchaseAllowed,
  selectedVariant,
  product,
}: {
  disabledLabel?: string;
  purchaseAllowed: boolean;
  selectedVariant: SelectedVariant;
  product: {handle: string; title: string};
}) {
  const lines = selectedVariant
    ? [
        {
          merchandiseId: selectedVariant.id,
          quantity: 1,
          selectedVariant,
        },
      ]
    : [];

  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<unknown>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify({
              products: [
                {
                  productGid: selectedVariant?.product?.id,
                  name: product.title,
                  variantGid: selectedVariant?.id,
                  variantName: selectedVariant?.title,
                  quantity: 1,
                },
              ],
              totalValue: selectedVariant?.price.amount,
            })}
          />
          <AddToCartControl
            disabledLabel={disabledLabel}
            fetcher={fetcher}
            purchaseAllowed={purchaseAllowed}
            selectedVariant={selectedVariant}
          />
        </>
      )}
    </CartForm>
  );
}

export function ProductPurchasePanel({
  auxiliaryAction,
  badge,
  collectionTitle,
  disabledLabel,
  presentation = 'standard',
  product,
  productOptions,
  purchaseAllowed = true,
  selectedVariant,
  showIdentity = true,
  statusLabel,
}: {
  auxiliaryAction?: ReactNode;
  badge?: string;
  collectionTitle?: string;
  disabledLabel?: string;
  presentation?: 'standard' | 'drop';
  product: {handle: string; productType?: string | null; title: string};
  productOptions: MappedProductOptions[];
  purchaseAllowed?: boolean;
  selectedVariant: SelectedVariant;
  showIdentity?: boolean;
  statusLabel?: string;
}) {
  const navigate = useNavigate();
  const visibleOptions = productOptions.filter(
    (option) =>
      !(
        option.optionValues.length === 1 &&
        option.optionValues[0]?.name === 'Default Title'
      ),
  );
  const selectedMaterial = productOptions
    .find((option) => /^(material|finish)$/i.test(option.name))
    ?.optionValues.find((value) => value.selected)
    ?.name.toLowerCase();
  const identity = splitProductIdentity(product.title);
  const context = getProductContext(product.title, collectionTitle);
  const isStandard = presentation === 'standard';
  const identityLabel = context
    ? `Series / ${context}`
    : product.productType && !isGenericCatalogLabel(product.productType)
      ? product.productType
      : undefined;

  return (
    <section
      aria-label={showIdentity ? undefined : `${product.title} purchase options`}
      aria-labelledby={showIdentity ? 'product-title' : undefined}
      className={`product-purchase product-purchase--${presentation}`}
    >
      {badge ? <p className="product-purchase__badge">{badge}</p> : null}
      {showIdentity ? (
        <>
          {identityLabel ? (
            <p className="product-purchase__type">{identityLabel}</p>
          ) : null}
          <h1 id="product-title">
            {isStandard ? identity.artworkTitle : product.title}
          </h1>
        </>
      ) : null}
      <ProductPrice
        compareAtPrice={selectedVariant?.compareAtPrice}
        price={selectedVariant?.price}
      />

      {visibleOptions.length > 0 ? (
        <div className="product-purchase__options">
          {visibleOptions.map((option) => (
            <fieldset className="product-option" key={option.name}>
              <legend>{/^(material|finish)$/i.test(option.name) ? 'Material' : /^size$/i.test(option.name) ? 'Size (inches)' : option.name}</legend>
              <div className="product-option__values">
                {option.optionValues.map((value) => {
                  const state = getOptionState(value);
                  const stateLabel =
                    state === 'impossible'
                      ? 'Unavailable combination'
                      : state === 'sold-out' || state === 'selected-sold-out'
                        ? 'Sold out'
                        : undefined;
                  const content = (
                    <>
                      <span>{value.name}</span>
                      {stateLabel ? (
                        <span className="product-option__state">
                          {stateLabel}
                        </span>
                      ) : null}
                    </>
                  );

                  if (value.isDifferentProduct) {
                    return (
                      <Link
                        aria-current={value.selected ? 'page' : undefined}
                        className="product-option__value"
                        data-state={state}
                        key={value.name}
                        prefetch="intent"
                        preventScrollReset
                        replace
                        to={`/products/${value.handle}?${value.variantUriQuery}`}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      aria-pressed={value.selected}
                      className="product-option__value"
                      data-state={state}
                      disabled={!value.exists}
                      key={value.name}
                      onClick={() => {
                        if (!value.selected) {
                          void navigate(`?${value.variantUriQuery}`, {
                            preventScrollReset: true,
                            replace: true,
                          });
                        }
                      }}
                      type="button"
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
              {/^(material|finish)$/i.test(option.name) && selectedMaterial ? (
                <Link className="product-purchase__guide" to={`/materials#${selectedMaterial}`}>
                  Explore {selectedMaterial} <Icon name="arrow-right" size={14} />
                </Link>
              ) : null}
            </fieldset>
          ))}
        </div>
      ) : null}

      {auxiliaryAction}

      <div className="product-purchase__status" aria-live="polite">
        <span
          className="product-purchase__status-dot"
          data-available={selectedVariant?.availableForSale || undefined}
        />
        {statusLabel ||
          (selectedVariant?.availableForSale
            ? 'Available'
            : 'Currently unavailable')}
      </div>

      <ProductAddToCart
        disabledLabel={disabledLabel}
        product={product}
        purchaseAllowed={purchaseAllowed}
        selectedVariant={selectedVariant}
      />

      {isStandard ? (
        <>
        <ul className="product-purchase__assurances" aria-label="Purchase information">
          <li>
            <span>Made to order</span>
            <small>Produced after purchase</small>
          </li>
          <li>
            <span>Shipping</span>
            <small>Calculated at checkout</small>
          </li>
          <li>
            <span>Checkout</span>
            <small>Secured by Shopify</small>
          </li>
        </ul>
        {selectedMaterial === 'metal' || selectedMaterial === 'canvas' ? <p className="product-purchase__guide">Mounting hardware included by the manufacturer.</p> : null}
        <a className="product-purchase__guide" href="mailto:render.lab.art@gmail.com">Questions? Contact Render-Lab <Icon name="arrow-right" size={14} /></a>
        {selectedVariant?.sku ? <details className="product-purchase__reference"><summary>Product reference</summary><p>SKU {selectedVariant.sku}</p></details> : null}
        </>
      ) : (
        <p className="product-purchase__checkout">
          <Icon name="checkout" size={17} />
          Checkout secured by Shopify
        </p>
      )}
    </section>
  );
}
