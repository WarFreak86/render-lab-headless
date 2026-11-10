type VariantOptions = {
  selectedOptions: ReadonlyArray<{name: string; value: string}>;
};

function uniqueOptionValues(variants: ReadonlyArray<VariantOptions>, name: RegExp) {
  return Array.from(
    new Set(
      variants.flatMap((variant) =>
        variant.selectedOptions
          .filter((option) => name.test(option.name))
          .map((option) => option.value.trim())
          .filter(Boolean),
      ),
    ),
  );
}

function formatSize(value: string) {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)$/i);
  return match ? `${match[1]} × ${match[2]} in` : value;
}

function sizeArea(value: string) {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)$/i);
  return match ? Number(match[1]) * Number(match[2]) : Number.POSITIVE_INFINITY;
}

/**
 * The product's purchasable variants, not its artwork image dimensions,
 * determine which materials and sizes we may advertise.
 */
export function ProductTechnicalSpecs({
  variants,
}: {
  variants: ReadonlyArray<VariantOptions>;
}) {
  const materials = uniqueOptionValues(variants, /^(material|finish)$/i);
  const sizes = uniqueOptionValues(variants, /^size$/i).sort(
    (a, b) => sizeArea(a) - sizeArea(b),
  );

  if (!materials.length && !sizes.length) return null;

  return (
    <div className="product-technical-specs">
      {materials.length ? (
        <>
          <h3>Available materials</h3>
          <ul>
            {materials.map((material) => (
              <li key={material}>
                <strong>{material}:</strong>{' '}
                {/^metal$/i.test(material)
                  ? 'Frameless aluminum wall art with a clean, contemporary presentation.'
                  : /^canvas$/i.test(material)
                    ? 'Gallery-wrapped canvas with a textured finish.'
                    : 'Select this material above for details and pricing.'}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {sizes.length ? (
        <>
          <h3>Available sizes</h3>
          <p>{sizes.map(formatSize).join(' · ')}</p>
          <p>Select a size above to see the current price and availability.</p>
        </>
      ) : null}
    </div>
  );
}
