type ArtworkDimensions = {
  width?: number | null;
  height?: number | null;
};

const SIZING_TEXT = {
  portrait:
    'Available in multiple sizes, from versatile 12x16" prints to large-scale 24x32" statement pieces.',
  landscape:
    'Available in multiple sizes, from versatile 16x12" prints to large-scale 32x24" statement pieces.',
  square:
    'Available in multiple sizes, from versatile 12x12" prints to large-scale 32x32" statement pieces.',
};

export function ProductTechnicalSpecs({
  image,
}: {
  image?: ArtworkDimensions | null;
}) {
  const {width, height} = image ?? {};
  const orientation =
    width && height && width > 0 && height > 0
      ? height > width
        ? 'portrait'
        : width > height
          ? 'landscape'
          : 'square'
      : 'square';
  const dynamicSizingString = SIZING_TEXT[orientation];

  return (
    <div className="product-technical-specs">
      <h3>Premium Material Formats</h3>
      <ul>
        <li>
          <strong>Aluminum Metal Wall Art:</strong> Printed directly onto
          brushed DIBOND® aluminum. Delivers crisp, rigid edges, deep contrast,
          and a modern gallery aesthetic. Arrives ready to hang, floating ½-inch
          off the wall.
        </li>
        <li>
          <strong>Gallery-Wrapped Canvas:</strong> Printed on fade-resistant,
          heavyweight canvas and hand-stretched over a solid wood frame. Adds
          tactile, traditional texture and depth to the artwork.
        </li>
        <li>
          <strong>Archival Matte Poster:</strong> Museum-grade, heavy paper
          stock with vibrant color reproduction. Delivered rolled and ready for
          your custom frame.
        </li>
      </ul>
      <h3>Sizing &amp; Display Context</h3>
      <p>{dynamicSizingString}</p>
    </div>
  );
}
