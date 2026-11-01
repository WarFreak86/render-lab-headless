import {useRef, useState, type CSSProperties} from 'react';
import {
  materialsFor,
  priceFor,
  selectedVariant,
  sizesFor,
  type Material,
  type Artwork,
  type Catalog,
} from './catalog';
import {rooms, placement, type RoomConfig} from './rooms';
import {compositeTreatment} from './compositing';
import {roomProductHref} from '~/lib/room-preview-navigation';

function Arrow({direction = 'right'}: {direction?: 'right' | 'left'}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
      style={{transform: direction === 'left' ? 'rotate(180deg)' : undefined}}
    >
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}

function RoomStage({
  room,
  art,
  material,
  size,
  guides = false,
  expanded = false,
}: {
  room: RoomConfig;
  art: Artwork;
  material: Material;
  size: string;
  guides?: boolean;
  expanded?: boolean;
}) {
  const [roomFailed, setRoomFailed] = useState(false);
  const [artFailed, setArtFailed] = useState(false);
  const bounds = placement(room, size);
  const source = art.image;
  const treatment = compositeTreatment(room, size, material, source);
  const artworkStyle: CSSProperties = {
    ...treatment.style,
    left: `${bounds.x * 100}%`,
    top: `${bounds.y * 100}%`,
    width: `${bounds.width * 100}%`,
    height: `${bounds.height * 100}%`,
  };
  return (
    <div
      className={`room-stage ${guides ? 'show-guides' : ''}`}
      style={{aspectRatio: room.aspectRatio}}
      data-room={room.id}
      data-size={size}
      data-material={material}
      data-placement={JSON.stringify(bounds)}
    >
      <img
        className="room-background"
        src={room.image}
        srcSet={room.imageSrcSet}
        sizes={
          expanded
            ? '(min-width: 1304px) 1160px, 90vw'
            : '(max-width: 760px) 100vw, (min-width: 1700px) calc(100vw - 550px), calc(100vw - 476px)'
        }
        width={room.imageWidth}
        height={room.imageHeight}
        decoding="async"
        fetchPriority="high"
        alt={`${room.name} room with a blank wall`}
        onError={() => setRoomFailed(true)}
      />
      {!roomFailed && (
        <>
          {guides && (
            <div
              className="wall-guide"
              style={{
                left: `${room.wall.x * 100}%`,
                top: `${room.wall.y * 100}%`,
                width: `${room.wall.width * 100}%`,
                height: `${room.wall.height * 100}%`,
              }}
            >
              <span>Wall placement area</span>
            </div>
          )}
          <div
            className={`mounted-art ${material.toLowerCase()}`}
            style={artworkStyle}
            data-depth-mm={treatment.depthMm}
            data-artwork={art.handle}
          >
            <span className="print-contact" aria-hidden="true" />
            <div className="print-object">
              <span
                className="print-edge print-edge-right"
                aria-hidden="true"
              />
              <span
                className="print-edge print-edge-bottom"
                aria-hidden="true"
              />
              <div className="print-face">
                <img
                  key={`${art.handle}-${source}`}
                  src={source}
                  alt={`${art.title}, ${size.replace('x', ' × ')} inches on ${material.toLowerCase()}`}
                  onLoad={() => setArtFailed(false)}
                  onError={() => setArtFailed(true)}
                />
                <span className="print-illumination" aria-hidden="true" />
                {material === 'Metal' ? (
                  <span className="print-reflection" aria-hidden="true" />
                ) : (
                  <span className="print-weave" aria-hidden="true" />
                )}
              </div>
            </div>
            {guides && (
              <span className="size-label">{size.replace('x', ' × ')} in</span>
            )}
          </div>
        </>
      )}
      {(roomFailed || artFailed) && (
        <p className="image-error" role="alert">
          {roomFailed
            ? 'Room image unavailable. Select another room.'
            : 'Artwork image unavailable. Select another artwork.'}
        </p>
      )}
    </div>
  );
}

export function CatalogPreview({catalog, initialVariantId}: {catalog: Catalog; initialVariantId?: string}) {
  const artworks = catalog.products;
  const [artIndex, setArtIndex] = useState(0);
  const initialVariant = artworks[0].variants.find((v) => v.id === initialVariantId);
  const [material, setMaterial] = useState<Material>(initialVariant?.material ?? 'Metal');
  const [size, setSize] = useState(initialVariant?.size ?? '18x24');
  const [roomId, setRoomId] = useState(rooms[0].id);
  const [guides, setGuides] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  function openPreview() {
    setPreviewOpen(true);
    dialog.current?.showModal();
  }
  const art = artworks[artIndex],
    room = rooms.find((value) => value.id === roomId)!;
  const materials = materialsFor(art);
  const effectiveMaterial = materials.includes(material)
    ? material
    : materials[0];
  const sizes = sizesFor(art, effectiveMaterial);
  const effectiveSize = sizes.includes(size) ? size : sizes[0];
  const variant = selectedVariant(art, effectiveMaterial, effectiveSize);
  const price = variant ? priceFor(variant) : 'Unavailable';
  function cycle(delta: number) {
    setArtIndex((index) => (index + delta + artworks.length) % artworks.length);
  }
  return (
    <div className="preview-app">
      <a className="skip-link" href="#product-panel">
        Skip to artwork controls
      </a>
      <header className="header">
        <span className="brand">RENDER–LAB</span>
        <span className="header-center">THE ROOM EDIT</span>
        <span className="local-note">Room preview</span>
      </header>
      {variant ? (
        <nav className="preview-return" aria-label="Product navigation">
          <a href={roomProductHref(art, variant)}>
            <Arrow direction="left" /> Back to Product
          </a>
          <span>{art.title}</span>
        </nav>
      ) : null}
      <main className="preview-layout">
        <section className="visual-pane" aria-label="Room visualizer">
          <div className="visual-topline">
            <span>
              {room.name} / {room.description}
            </span>
            <button
              type="button"
              aria-pressed={guides}
              onClick={() => setGuides((value) => !value)}
            >
              {guides ? 'Hide placement guide' : 'Show placement guide'}
            </button>
          </div>
          <RoomStage
            key={room.id}
            room={room}
            art={art}
            material={effectiveMaterial}
            size={effectiveSize}
            guides={guides}
          />
          <div className="visual-caption">
            <span>
              {art.title}
              <small>
                {effectiveMaterial} · {effectiveSize.replace('x', ' × ')} in
              </small>
            </span>
            <button
              className="expand-button"
              onClick={openPreview}
              aria-label="Expand room preview"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                aria-hidden="true"
              >
                <path d="M4 9V4h5m6 0h5v5m0 6v5h-5M9 20H4v-5" />
              </svg>
            </button>
          </div>
          <p className="scale-note">
            A visual study of scale and atmosphere. Room proportions are
            illustrative.
          </p>
        </section>
        <aside
          className="product-panel"
          id="product-panel"
          aria-label="Artwork options"
        >
          <div className="product-navigation">
            <span>ARTWORK / 0{artIndex + 1}</span>
            <div>
              <button
                onClick={() => cycle(-1)}
                aria-label="Previous artwork"
                disabled={artworks.length < 2}
              >
                <Arrow direction="left" />
              </button>
              <button
                onClick={() => cycle(1)}
                aria-label="Next artwork"
                disabled={artworks.length < 2}
              >
                <Arrow />
              </button>
            </div>
          </div>
          <h1>{art.title}</h1>
          <div className="price-line">
            <span className="price" data-testid="price">
              {price}
            </span>
            <span>{variant?.currencyCode} · current Shopify catalog</span>
          </div>
          <p
            className="catalog-availability"
            data-testid="availability"
            data-variant-id={variant?.id}
          >
            {variant?.availableForSale
              ? 'Available to order'
              : 'Currently unavailable'}{' '}
            · purchases disabled
          </p>
          <p className="description">
            A piece with presence.
            <br />
            Discover how it feels in your space.
          </p>
          <fieldset className="artwork-options">
            <legend>Choose your artwork</legend>
            <div className="artwork-thumbnails">
              {artworks.map((item, index) => (
                <button
                  key={item.handle}
                  aria-label={`Select ${item.title}`}
                  aria-pressed={artIndex === index}
                  onClick={() => setArtIndex(index)}
                >
                  <img src={item.image} alt="" />
                  <span>0{index + 1}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Finish</legend>
            <div className="material-options">
              {materials.map((value) => (
                <button
                  key={value}
                  aria-label={value}
                  aria-pressed={effectiveMaterial === value}
                  onClick={() => setMaterial(value)}
                >
                  <span
                    className={`swatch ${value.toLowerCase()}`}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{value}</strong>
                    <small>
                      {value === 'Metal'
                        ? 'Reflective surface'
                        : 'Soft, textured surface'}
                    </small>
                  </span>
                  <span className="selected-mark" aria-hidden="true">
                    {effectiveMaterial === value ? '✓' : ''}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              Size <span>WIDTH × HEIGHT · INCHES</span>
            </legend>
            <div className="size-options">
              {sizes.map((value) => (
                <button
                  key={value}
                  aria-pressed={effectiveSize === value}
                  onClick={() => setSize(value)}
                >
                  {value.replace('x', ' × ')}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Choose your room</legend>
            <div className="room-options">
              {rooms.map((value) => (
                <button
                  key={value.id}
                  aria-pressed={room.id === value.id}
                  onClick={() => setRoomId(value.id)}
                >
                  <img
                    src={value.thumbnail ?? value.image}
                    alt=""
                    decoding="async"
                  />
                  <span>{value.name}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <button className="space-cta" onClick={openPreview}>
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="1" />
              <path d="m3 17 6-6 5 5 3-3 4 4" />
              <circle cx="16" cy="8" r="1.5" />
            </svg>
            <span>VIEW ROOM PREVIEW</span>
            <Arrow />
          </button>
          <button className="cart-presentation" disabled>
            Add to cart <span>— {price}</span>
            <svg
              viewBox="0 0 24 24"
              width="23"
              height="23"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              aria-hidden="true"
            >
              <path d="M2 3h3l3 13h11l3-10H6" />
              <circle cx="9" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
            </svg>
          </button>
          <p className="commerce-note">
            Presentation only · purchases are disabled
          </p>
          <p className="disclosure">
            {room.assetStatus === 'temporary'
              ? 'This room uses a temporary concept-derived background. '
              : 'Room scene preview. '}
            Print sizes scale proportionally; placement, finish and lighting are
            visual approximations.
          </p>
          <span className="selection-status" role="status">
            {room.name} · {art.title} · {effectiveMaterial} ·{' '}
            {effectiveSize.replace('x', ' × ')} in · {price}
            {' · '}
            {variant?.availableForSale
              ? 'Available to order'
              : 'Currently unavailable'}
          </span>
        </aside>
      </main>
      <dialog
        ref={dialog}
        className="preview-dialog"
        aria-labelledby="preview-dialog-title"
        onClose={() => setPreviewOpen(false)}
      >
        <div className="dialog-header">
          <h2 id="preview-dialog-title">
            {art.title} in {room.name}
          </h2>
          <button
            onClick={() => dialog.current?.close()}
            aria-label="Close room preview"
          >
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        {previewOpen && (
          <RoomStage
            key={`dialog-${room.id}`}
            room={room}
            art={art}
            material={effectiveMaterial}
            size={effectiveSize}
            expanded
          />
        )}
        <p>
          {effectiveSize.replace('x', ' × ')} in · {effectiveMaterial} ·
          Illustrative scale
        </p>
      </dialog>
    </div>
  );
}
