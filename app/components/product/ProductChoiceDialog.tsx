import {Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {Drawer} from '~/components/Drawer';
import {
  formatPrintSize,
  optionValue,
  type ChoiceVariant,
} from '~/lib/product-confidence';

export type ChoiceDialogKind = 'prices' | 'review' | null;

export function ProductChoiceDialog({
  kind,
  onClose,
  onSelect,
  pending,
  productTitle,
  selectedVariant,
  variants,
  cartControl,
}: {
  kind: ChoiceDialogKind;
  onClose: () => void;
  onSelect: (variant: ChoiceVariant) => void;
  pending: boolean;
  productTitle: string;
  selectedVariant: ChoiceVariant | null | undefined;
  variants: ReadonlyArray<ChoiceVariant>;
  cartControl: React.ReactNode;
}) {
  return (
    <Drawer
      className="confidence-dialog"
      open={kind !== null}
      onClose={onClose}
      title={
        kind === 'prices'
          ? 'Every option, clearly priced.'
          : 'Your considered choice.'
      }
    >
      {kind === 'prices' ? (
        <>
          <p className="confidence-copy">
            Live artwork prices from Shopify. Shipping and any applicable tax
            are additional. Choose an option to update the product page.
          </p>
          <div className="confidence-table-wrap">
            <table className="confidence-table">
              <caption className="sr-only">
                {productTitle} — all available product combinations
              </caption>
              <thead>
                <tr>
                  <th scope="col">Format</th>
                  <th scope="col">Artwork price</th>
                  <th scope="col">Choose</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr
                    key={variant.id}
                    data-selected={
                      variant.id === selectedVariant?.id || undefined
                    }
                  >
                    <td>
                      {variant.selectedOptions
                        .map((option) =>
                          /^size$/i.test(option.name)
                            ? formatPrintSize(option.value)
                            : option.value,
                        )
                        .join(' · ')}
                    </td>
                    <td>
                      <Money data={variant.price} />
                      <small>{variant.price.currencyCode}</small>
                    </td>
                    <td>
                      <button
                        type="button"
                        aria-pressed={variant.id === selectedVariant?.id}
                        onClick={() => onSelect(variant)}
                        aria-label={`Choose ${variant.selectedOptions.map((option) => option.value).join(', ')}`}
                      >
                        {variant.id === selectedVariant?.id
                          ? 'Selected'
                          : 'Select'}
                        {!variant.availableForSale ? (
                          <small>Sold out</small>
                        ) : null}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="confidence-selection" aria-live="polite">
            {pending
              ? 'Updating selection…'
              : selectedVariant
                ? `${selectedVariant.selectedOptions.map((option) => option.value).join(' · ')} selected`
                : 'Choose an option'}
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={onClose}
          >
            Continue with this selection
          </button>
        </>
      ) : selectedVariant ? (
        <>
          <p className="confidence-eyebrow">
            Review before adding to your cart
          </p>
          <h3 className="confidence-review-title">{productTitle}</h3>
          <p className="confidence-copy">
            {selectedVariant.selectedOptions
              .map((option) =>
                /^size$/i.test(option.name)
                  ? formatPrintSize(option.value)
                  : option.value,
              )
              .join(' · ')}
          </p>
          {selectedVariant.sku ? (
            <p className="confidence-reference">
              SKU {selectedVariant.sku} · Quantity 1
            </p>
          ) : null}
          <dl className="confidence-costs">
            <div>
              <dt>Artwork · 1 print</dt>
              <dd>
                <Money data={selectedVariant.price} />{' '}
                {selectedVariant.price.currencyCode}
              </dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>Confirmed at checkout</dd>
            </div>
            <div>
              <dt>Applicable tax</dt>
              <dd>Confirmed at checkout</dd>
            </div>
            <div>
              <dt>Final total</dt>
              <dd>Pending shipping & tax</dd>
            </div>
          </dl>
          <p className="confidence-callout">
            {['metal', 'canvas'].includes(
              optionValue(
                selectedVariant,
                /^(material|finish)$/i,
              )?.toLowerCase() ?? '',
            )
              ? 'Made to order through Gelato. Production typically takes 2–4 business days; transit is additional. Timing is an estimate.'
              : 'Made to order. Shipping methods, charges and any available delivery estimates are confirmed at checkout.'}
          </p>
          <p className="confidence-copy">
            Request a return within 14 calendar days of delivery, subject to the{' '}
            <Link to="/policies/refund-policy">refund policy</Link>. You pay
            return postage for non-defective items.
          </p>
          {cartControl}
        </>
      ) : null}
    </Drawer>
  );
}
