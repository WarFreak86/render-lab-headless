import {Image} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import {Drawer} from '~/components/Drawer';
import {Icon} from '~/components/Icon';
import type {ProductImageData} from '~/lib/product';

export function ProductGallery({
  images,
  presentation = 'artwork',
  selectedVariantImageId,
  title,
}: {
  images: ProductImageData[];
  presentation?: 'artwork' | 'apparel' | 'drop';
  selectedVariantImageId?: string | null;
  title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const stripRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!selectedVariantImageId) return;
    const index = images.findIndex(
      (image) => image.id === selectedVariantImageId,
    );
    if (index >= 0) setSelectedIndex(index);
  }, [images, selectedVariantImageId]);

  useEffect(() => {
    if (!zoomOpen || images.length < 2) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        setSelectedIndex(
          (index) => (index - 1 + images.length) % images.length,
        );
      } else if (event.key === 'ArrowRight') {
        setSelectedIndex((index) => (index + 1) % images.length);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [images.length, zoomOpen]);

  if (images.length === 0) {
    return (
      <section
        className={`product-gallery product-gallery--${presentation} product-gallery--empty`}
        aria-label="Product media"
      >
        <div className="product-gallery__placeholder">
          <span>Render-Lab</span>
          <p>Artwork preview unavailable</p>
        </div>
      </section>
    );
  }

  const selectedImage = images[selectedIndex] ?? images[0];

  function selectImage(index: number) {
    setSelectedIndex(index);
    const strip = stripRef.current;
    if (strip && window.matchMedia?.('(max-width: 55.99rem)').matches) {
      strip.scrollTo({left: strip.clientWidth * index, behavior: 'smooth'});
    }
  }

  return (
    <section
      className={`product-gallery product-gallery--${presentation}`}
      aria-label="Product media"
    >
      <div className="product-gallery__layout">
        {images.length > 1 ? (
          <div
            className="product-gallery__thumbs"
            aria-label="Choose product image"
          >
            {images.map((image, index) => (
              <button
                aria-label={`View image ${index + 1} of ${images.length}`}
                aria-pressed={selectedIndex === index}
                className="product-gallery__thumb"
                key={image.id}
                onClick={() => selectImage(index)}
                type="button"
              >
                <Image alt="" data={image} loading="lazy" sizes="5rem" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="product-gallery__stage">
          <ul
            className="product-gallery__strip"
            onScroll={(event) => {
              const element = event.currentTarget;
              if (!element.clientWidth) return;
              const index = Math.round(
                element.scrollLeft / element.clientWidth,
              );
              if (
                index >= 0 &&
                index < images.length &&
                index !== selectedIndex
              ) {
                setSelectedIndex(index);
              }
            }}
            ref={stripRef}
          >
            {images.map((image, index) => (
              <li
                className="product-gallery__slide"
                data-active={selectedIndex === index || undefined}
                key={image.id}
              >
                <Image
                  alt={image.altText}
                  aspectRatio={
                    image.width && image.height
                      ? `${image.width}/${image.height}`
                      : '1/1'
                  }
                  data={image}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="(min-width: 80rem) 52rem, (min-width: 48rem) 60vw, 100vw"
                />
              </li>
            ))}
          </ul>
          <button
            aria-label={`Zoom image ${selectedIndex + 1}`}
            className="product-gallery__zoom-trigger"
            onClick={() => setZoomOpen(true)}
            type="button"
          >
            <Icon name="search" size={18} />
            <span>Zoom</span>
          </button>
          {images.length > 1 ? (
            <p className="product-gallery__counter" aria-live="polite">
              {selectedIndex + 1} / {images.length}
            </p>
          ) : null}
        </div>
      </div>

      <Drawer
        className="product-gallery__zoom-drawer"
        onClose={() => setZoomOpen(false)}
        open={zoomOpen}
        title={`${title} — image ${selectedIndex + 1} of ${images.length}`}
      >
        <div className="product-gallery__zoom-content">
          {images.length > 1 ? (
            <button
              aria-label="Previous image"
              className="product-gallery__zoom-nav product-gallery__zoom-nav--previous"
              onClick={() =>
                setSelectedIndex(
                  (index) => (index - 1 + images.length) % images.length,
                )
              }
              type="button"
            >
              <Icon name="arrow-left" />
            </button>
          ) : null}
          <Image
            alt={selectedImage.altText}
            data={selectedImage}
            sizes="100vw"
          />
          {images.length > 1 ? (
            <button
              aria-label="Next image"
              className="product-gallery__zoom-nav product-gallery__zoom-nav--next"
              onClick={() =>
                setSelectedIndex((index) => (index + 1) % images.length)
              }
              type="button"
            >
              <Icon name="arrow-right" />
            </button>
          ) : null}
        </div>
      </Drawer>
    </section>
  );
}
