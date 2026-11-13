import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {useId, useState} from 'react';
import type {ProductImageData} from '~/lib/product';
import {
  choiceForOptions,
  formatPrintSize,
  optionValue,
  printDimensions,
  printMaterial,
  roomImage,
  type ChoiceVariant,
} from '~/lib/product-confidence';

export function ProductConfidenceSections({
  artwork,
  images,
  onSelect,
  selectedVariant,
  variants,
}: {
  artwork?: ProductImageData;
  images: ProductImageData[];
  onSelect: (variant: ChoiceVariant) => void;
  selectedVariant: ChoiceVariant;
  variants: ReadonlyArray<ChoiceVariant>;
}) {
  const materialName =
    selectedVariant.selectedOptions.find((option) =>
      /^(material|finish)$/i.test(option.name),
    )?.name ?? 'Material';
  const selectedOptions = Object.fromEntries(
    selectedVariant.selectedOptions.map((option) => [
      option.name,
      option.value,
    ]),
  );
  const materials = [
    ...new Set(
      variants
        .map((variant) => optionValue(variant, /^(material|finish)$/i))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  return (
    <div className="confidence-sections">
      <section
        className="confidence-materials"
        id="product-material-guide"
        aria-labelledby="confidence-materials-title"
      >
        <div className="confidence-section-heading">
          <div>
            <p className="confidence-eyebrow">
              A surface that suits your space
            </p>
            <h2 id="confidence-materials-title">
              One artwork. Your expression.
            </h2>
          </div>
          <p>
            Compare the formats offered for this artwork. Room images are
            illustrative; color and texture vary with screens and lighting.
          </p>
        </div>
        <div className="confidence-material-grid">
          {materials.map((material) => {
            const spec = printMaterial(material);
            if (!spec) return null;
            const photo = roomImage(images, material);
            const choice = choiceForOptions(variants, {
              ...selectedOptions,
              [materialName]: material,
            });
            return (
              <article className="confidence-material-card" key={material}>
                {photo ? (
                  <Image
                    data={photo}
                    alt={photo.altText}
                    loading="lazy"
                    sizes="(min-width: 56rem) 25vw, 45vw"
                  />
                ) : (
                  <div
                    className="confidence-material-surface"
                    data-material={material.toLowerCase()}
                    aria-hidden
                  />
                )}
                <div>
                  <p className="confidence-eyebrow">{spec.name}</p>
                  <h3>{spec.presentation}</h3>
                  <p>{spec.description}</p>
                  <dl>
                    <div>
                      <dt>Surface</dt>
                      <dd>{spec.surface}</dd>
                    </div>
                    <div>
                      <dt>Mounting</dt>
                      <dd>
                        {/^metal|canvas$/i.test(material)
                          ? 'Manufacturer hardware included'
                          : 'Check framing requirements'}
                      </dd>
                    </div>
                  </dl>
                  {choice ? (
                    <button
                      type="button"
                      onClick={() => onSelect(choice)}
                      aria-pressed={choice.id === selectedVariant.id}
                    >
                      Choose {spec.name.toLowerCase()}{' '}
                      <span>
                        <Money data={choice.price} />
                        {!choice.availableForSale ? ' · Sold out' : ''}
                      </span>
                    </button>
                  ) : (
                    <p>Not offered in the selected size and options.</p>
                  )}
                  <Link to={`/materials#${material.toLowerCase()}`}>
                    Material details ↗
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {artwork ? (
        <ProductRoomScale
          artwork={artwork}
          selectedVariant={selectedVariant}
          variants={variants}
          onSelect={onSelect}
        />
      ) : null}
      <ProductDeliveryGuide
        hasMetalCanvas={materials.some((material) =>
          /^(metal|canvas)$/i.test(material),
        )}
      />
    </div>
  );
}

function ProductRoomScale({
  artwork,
  selectedVariant,
  variants,
  onSelect,
}: {
  artwork: ProductImageData;
  selectedVariant: ChoiceVariant;
  variants: ReadonlyArray<ChoiceVariant>;
  onSelect: (variant: ChoiceVariant) => void;
}) {
  const id = useId();
  const [room, setRoom] = useState<'living' | 'office'>('living');
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const [reference, setReference] = useState({living: 84, office: 60});
  const [draft, setDraft] = useState<string | null>(null);
  const dimensions = printDimensions(optionValue(selectedVariant, /^size$/i));
  if (!dimensions) return null;
  const value = reference[room];
  const display = (number: number) =>
    unit === 'cm'
      ? `${(number * 2.54).toFixed(1)} cm`
      : `${Number(number.toFixed(1))} in`;
  const noun = room === 'living' ? 'sofa' : 'desk';
  const width = (58 * dimensions.width) / value;
  const height = (width * (1000 / 660) * dimensions.height) / dimensions.width;
  const fits = height <= 53;
  const sizeChoices = variants.filter((variant) =>
    selectedVariant.selectedOptions.every(
      (option) =>
        /^size$/i.test(option.name) ||
        variant.selectedOptions.some(
          (candidate) =>
            candidate.name === option.name && candidate.value === option.value,
        ),
    ),
  );
  const draftInches =
    draft === null ? value : Number(draft) / (unit === 'cm' ? 2.54 : 1);
  const invalid =
    draft !== null &&
    (draft === '' ||
      !Number.isFinite(draftInches) ||
      draftInches < 35.99 ||
      draftInches > 144.02);
  return (
    <section
      id="product-room-scale"
      className="confidence-scale"
      aria-labelledby={`${id}-title`}
    >
      <div className="confidence-section-heading">
        <div>
          <p className="confidence-eyebrow">Measure twice. Choose once.</p>
          <h2 id={`${id}-title`}>Give the work its space.</h2>
        </div>
        <p>
          Compare print proportions against a reference sofa or desk, then
          measure your own wall. This illustration cannot measure your room or
          prove a physical finish.
        </p>
      </div>
      <div className="confidence-scale-layout">
        <div>
          <div className="confidence-scene">
            <img
              className="confidence-scene__background"
              src={`/images/product-scale-${room}.svg`}
              alt=""
            />
            <span className="confidence-scene__label">
              Scale study / {room === 'living' ? 'Living room' : 'Home office'}
            </span>
            {fits ? (
              <div
                className="confidence-scene__art"
                data-material={optionValue(
                  selectedVariant,
                  /^(material|finish)$/i,
                )?.toLowerCase()}
                style={{
                  width: `${width}%`,
                  height: `${height}%`,
                  top: `${Math.min(29, 56 - height)}%`,
                }}
              >
                <img
                  src={artwork.url}
                  alt="Artwork proportions relative to the reference furniture"
                  loading="lazy"
                />
                <span>{display(dimensions.width)} wide</span>
              </div>
            ) : (
              <p className="confidence-scene__notice">
                This size exceeds the illustrated hanging area at this reference
                width. Try a wider reference and measure your own wall.
              </p>
            )}
            <span className="confidence-scene__reference">
              {display(value)} reference {noun}
            </span>
          </div>
          <p className="confidence-scale-caption">
            {selectedVariant.selectedOptions
              .map((option) =>
                /^size$/i.test(option.name)
                  ? formatPrintSize(option.value)
                  : option.value,
              )
              .join(' · ')}{' '}
            <span>Proportional illustration · finish approximate</span>
          </p>
        </div>
        <div className="confidence-scale-controls">
          <fieldset>
            <legend>Your setting</legend>
            <div>
              {(['living', 'office'] as const).map((setting) => (
                <button
                  type="button"
                  key={setting}
                  aria-pressed={room === setting}
                  onClick={() => {
                    setRoom(setting);
                    setDraft(null);
                  }}
                >
                  {setting === 'living' ? 'Living room' : 'Home office'}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Print size · width × height</legend>
            <div>
              {sizeChoices.map((variant) => (
                <button
                  type="button"
                  key={variant.id}
                  aria-pressed={variant.id === selectedVariant.id}
                  onClick={() => onSelect(variant)}
                >
                  {formatPrintSize(optionValue(variant, /^size$/i) ?? '')}
                  {!variant.availableForSale ? <small>Sold out</small> : null}
                </button>
              ))}
            </div>
          </fieldset>
          <label htmlFor={`${id}-width`}>
            {room === 'living' ? 'Sofa' : 'Desk'} width{' '}
            <span>
              <input
                id={`${id}-width`}
                type="number"
                inputMode="decimal"
                min={unit === 'cm' ? 91.4 : 36}
                max={unit === 'cm' ? 365.8 : 144}
                step={unit === 'cm' ? 0.1 : 1}
                value={
                  draft ??
                  (unit === 'cm'
                    ? (value * 2.54).toFixed(1)
                    : Number(value.toFixed(1)))
                }
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? `${id}-error` : undefined}
                onChange={(event) => {
                  const text = event.target.value;
                  setDraft(text);
                  const inches = Number(text) / (unit === 'cm' ? 2.54 : 1);
                  if (text !== '' && inches >= 35.99 && inches <= 144.02)
                    setReference((current) => ({...current, [room]: inches}));
                }}
              />
              {unit}
            </span>
          </label>
          <fieldset>
            <legend>Measurements</legend>
            <div>
              {(['in', 'cm'] as const).map((nextUnit) => (
                <button
                  type="button"
                  key={nextUnit}
                  aria-pressed={unit === nextUnit}
                  onClick={() => {
                    setUnit(nextUnit);
                    setDraft(null);
                  }}
                >
                  {nextUnit}
                </button>
              ))}
            </div>
          </fieldset>
          {invalid ? (
            <p id={`${id}-error`} role="alert">
              Enter a width between{' '}
              {unit === 'cm' ? '91.4 and 365.8 cm' : '36 and 144 inches'}.
            </p>
          ) : null}
          <p aria-live="polite">
            This print is {Math.round((dimensions.width / value) * 100)}% of the{' '}
            {noun}’s width.
          </p>
          <p>
            Mark out {display(dimensions.width)} × {display(dimensions.height)}{' '}
            with painter’s tape before ordering. Artwork appearance and
            placement are illustrative.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProductDeliveryGuide({hasMetalCanvas}: {hasMetalCanvas: boolean}) {
  return (
    <section
      className="confidence-delivery"
      id="product-delivery"
      aria-labelledby="confidence-delivery-title"
    >
      <div>
        <p className="confidence-eyebrow">From the studio to your wall</p>
        <h2 id="confidence-delivery-title">Know what happens next.</h2>
        <p>
          Your print is made after you order. Production and carrier transit are
          separate stages.
        </p>
        <Link to="/policies/shipping-policy">Read the shipping policy ↗</Link>
      </div>
      <div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>Confirm your options</h3>
              <p>
                Checkout shows the available shipping methods and charges for
                your print, destination and order before payment.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Made to order</h3>
              <p>
                {hasMetalCanvas
                  ? 'Metal and canvas are fulfilled through Gelato and typically take 2–4 business days to produce. This is an estimate; transit is additional.'
                  : 'Produced after purchase. Production time varies with the product and current capacity; carrier transit is additional.'}
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Shipped to you</h3>
              <p>
                Delivery estimates depend on the destination and available
                service. No arrival date is promised here. Tracking is provided
                when available; items may arrive in separate packages.
              </p>
            </div>
          </li>
        </ol>
        <details>
          <summary>What will shipping cost?</summary>
          <p>
            Rates vary by product, size, destination and other items in the
            order. There is no universal flat rate or automatic free-shipping
            threshold. Charges and available delivery options are confirmed at
            checkout before payment.
          </p>
        </details>
        <details>
          <summary>What if it is not right for my space?</summary>
          <p>
            Request a return within 14 calendar days of confirmed delivery,
            including for made-to-order prints. Non-defective items must be new,
            unused, undamaged and in suitable original packaging. You pay return
            postage; no restocking fee applies. Original outbound shipping is
            not refunded for non-defective returns unless required by law. Get
            written authorization before mailing.{' '}
            <Link to="/policies/refund-policy">Full refund policy</Link>.
          </p>
        </details>
        <details>
          <summary>What if it arrives damaged?</summary>
          <p>
            Report damage, defects or an incorrect item promptly, ideally within
            7 days and within 30 calendar days of delivery. Email your order
            details and clear photos to{' '}
            <a href="mailto:support@render-lab.org">support@render-lab.org</a>.
            Confirmed issues receive a replacement at no extra cost, or a refund
            if replacement is not feasible. Return shipping is covered if the
            item is needed back.
          </p>
        </details>
      </div>
    </section>
  );
}
