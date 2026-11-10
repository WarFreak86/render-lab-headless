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
import {REFUND_POLICY_PATH, STANDARD_RETURN_DAYS} from '~/lib/return-policy';
import {
  getProductContext,
  isGenericCatalogLabel,
  splitProductIdentity,
} from '~/lib/product-presentation';

type SelectedVariant = ProductFragment['selectedOrFirstAvailableVariant'];
type OptionSelection = Record<string, string>;

/**
 * The mapped option URL can be stale while a previous navigation is in flight.
 * Carry forward the latest requested values before applying the next click.
 */
export function getNextOptionQuery(
  variantUriQuery: string,
  optionName: string,
  value: string,
  pendingSelection: OptionSelection | null,
) {
  const params = new URLSearchParams(variantUriQuery);
  if (pendingSelection) {
    for (const [name, selected] of Object.entries(pendingSelection)) {
      params.set(name, selected);
    }
  }
  params.delete('variant');
  params.set(optionName, value);
  return params.toString();
}

function variantHasOptions(
  variant: SelectedVariant,
  options: OptionSelection,
) {
  return Boolean(
    variant && Object.entries(options).every(([name, value]) =>
      variant.selectedOptions.some(
        (selected) =>
          selected.name.toLowerCase() === name.toLowerCase() &&
          selected.value === value,
      ),
    ),
  );
}

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
  const lastRequestedOptions = useRef<OptionSelection | null>(null);
  const [requestedOptions, setRequestedOptions] = useState<OptionSelection | null>(null);
  const selectionPending = Boolean(
    requestedOptions && !variantHasOptions(selectedVariant, requestedOptions),
  );

  useEffect(() => {
    if (requestedOptions && !selectionPending) {
      lastRequestedOptions.current = null;
      setRequestedOptions(null);
    }
  }, [requestedOptions, selectionPending]);

  useEffect(() => {
    // A combined listing can reuse this component for a new product.
    lastRequestedOptions.current = null;
    setRequestedOptions(null);
  }, [product.handle]);

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
                  const selectedByIntent = requestedOptions?.[option.name];
                  const isSelected =
                    selectedByIntent === undefined
                      ? value.selected
                      : selectedByIntent === value.name;
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
                      aria-pressed={isSelected}
                      className="product-option__value"
                      data-state={state}
                      disabled={!value.exists}
                      key={value.name}
                      onClick={() => {
                        if (!isSelected) {
                          const query = getNextOptionQuery(
                            value.variantUriQuery,
                            option.name,
                            value.name,
                            lastRequestedOptions.current,
                          );
                          const selectedNames = new Set(productOptions.map((item) => item.name));
                          const nextOptions = Object.fromEntries(
                            Array.from(new URLSearchParams(query)).filter(([name]) =>
                              selectedNames.has(name),
                            ),
                          );
                          lastRequestedOptions.current = nextOptions;
                          setRequestedOptions(nextOptions);
                          void navigate(`?${query}`, {
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
        {selectionPending
          ? 'Updating selection…'
          : statusLabel ||
            (selectedVariant?.availableForSale
              ? 'Available'
              : 'Currently unavailable')}
      </div>

      <ProductAddToCart
        disabledLabel={selectionPending ? 'Updating selection…' : disabledLabel}
        product={product}
        purchaseAllowed={purchaseAllowed && !selectionPending}
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
            <small>Rates confirmed at checkout</small>
          </li>
          <li>
            <span>Checkout</span>
            <small>Secure payment processing</small>
          </li>
        </ul>
        {selectedMaterial === 'metal' || selectedMaterial === 'canvas' ? (
          <p className="product-purchase__guide">
            Gelato metal and canvas prints typically take 2–4 business days to
            produce before shipping; transit time is additional. This is an estimate.
          </p>
        ) : null}
        <p className="product-purchase__guide">
          <Link to="/policies/shipping-policy">
            Production and shipping details <Icon name="arrow-right" size={14} />
          </Link>
        </p>
        {selectedMaterial === 'metal' || selectedMaterial === 'canvas' ? <p className="product-purchase__guide">Mounting hardware included by the manufacturer.</p> : null}
        <a className="product-purchase__guide" href="mailto:support@render-lab.org">Questions? Contact Render-Lab <Icon name="arrow-right" size={14} /></a>
        {selectedVariant?.sku ? <details className="product-purchase__reference"><summary>Product reference</summary><p>SKU {selectedVariant.sku}</p></details> : null}
        </>
      ) : (
        <p className="product-purchase__checkout">
          <Icon name="checkout" size={17} />
          Secure checkout
        </p>
      )}
      {purchaseAllowed ? (
        <p className="product-purchase__returns">
          <Link to={REFUND_POLICY_PATH}>
            {STANDARD_RETURN_DAYS}-day returns
          </Link>
          {' · Customer pays return shipping for non-defective items.'}
        </p>
      ) : null}
    </section>
  );
}
