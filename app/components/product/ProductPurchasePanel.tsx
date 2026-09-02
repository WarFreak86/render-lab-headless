import {CartForm, Money, type MappedProductOptions} from '@shopify/hydrogen';
import type {FetcherWithComponents} from 'react-router';
import {Link, useNavigate} from 'react-router';
import {useEffect, useRef, type ReactNode} from 'react';
import type {ProductFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {Button} from '~/components/Button';
import {Icon} from '~/components/Icon';
import {ProductPrice} from '~/components/ProductPrice';
import {getOptionState} from '~/lib/product';
import {
  getProductContext,
  isGenericCatalogLabel,
  parseProductSizeDimensions,
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
  const {open} = useAside();
  const submittedRef = useRef(false);
  const loading = fetcher.state !== 'idle';
  const error = getCartErrorMessage(fetcher.data);

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
    .find((option) => option.name.toLowerCase() === 'material')
    ?.optionValues.find((value) => value.selected)
    ?.name.toLowerCase();
  const selectedOptions = visibleOptions.flatMap((option) => {
    const selected = option.optionValues.find((value) => value.selected);
    return selected ? [{name: option.name, value: selected.name}] : [];
  });
  const selectedSize = selectedOptions.find(
    (option) => option.name.toLowerCase() === 'size',
  );
  const sizeDimensions = parseProductSizeDimensions(selectedSize?.value);
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
              <legend>{option.name}</legend>
              <div className="product-option__values">
                {option.optionValues.map((value, index) => {
                  const state = getOptionState(value);
                  const stateLabel =
                    state === 'impossible'
                      ? 'Unavailable combination'
                      : state === 'sold-out' || state === 'selected-sold-out'
                        ? 'Sold out'
                        : undefined;
                  const isBestValue =
                    product.productType === 'Wall Art' &&
                    option.name.toLowerCase() === 'size' &&
                    selectedMaterial === 'metal' &&
                    option.optionValues.length >= 3 &&
                    index === 1;
                  const content = (
                    <>
                      <span>{value.name}</span>
                      {isBestValue ? (
                        <span className="product-option__value-badge">Best value</span>
                      ) : null}
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
            </fieldset>
          ))}
        </div>
      ) : null}

      {isStandard && selectedOptions.length > 0 ? (
        <div className="product-purchase__selection-summary">
          <dl>
            {selectedOptions.map((option) => (
              <div key={option.name}>
                <dt>{option.name}</dt>
                <dd>{option.value}</dd>
              </div>
            ))}
          </dl>
          {selectedSize && sizeDimensions ? (
            <div
              aria-label={`Selected proportion ${selectedSize.value}`}
              className="product-purchase__proportion"
            >
              <span
                aria-hidden="true"
                style={{
                  aspectRatio: `${sizeDimensions.width} / ${sizeDimensions.height}`,
                }}
              />
              <div>
                <small>Selected proportion</small>
                <strong>{selectedSize.value}</strong>
              </div>
            </div>
          ) : null}
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
        {selectedVariant?.sku ? <span>SKU {selectedVariant.sku}</span> : null}
      </div>

      <ProductAddToCart
        disabledLabel={disabledLabel}
        product={product}
        purchaseAllowed={purchaseAllowed}
        selectedVariant={selectedVariant}
      />

      {isStandard ? (
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
      ) : (
        <p className="product-purchase__checkout">
          <Icon name="checkout" size={17} />
          Checkout secured by Shopify
        </p>
      )}
    </section>
  );
}
