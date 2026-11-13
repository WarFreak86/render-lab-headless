/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- This labelled, bounded application region implements keyboard, pointer and pinch pan/zoom. */
import {useEffect, useRef, useState} from 'react';
import {Drawer} from '~/components/Drawer';
import type {ProductImageData} from '~/lib/product';
import {clampArtworkPan} from '~/lib/product-confidence';

export function ProductArtworkZoom({
  image,
  onClose,
  title,
}: {
  image: ProductImageData;
  onClose: () => void;
  title: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, {x: number; y: number}>());
  const pinch = useRef<{distance: number; scale: number} | null>(null);
  const [view, setView] = useState({scale: 1, x: 0, y: 0});
  const [bounds, setBounds] = useState({width: 0, height: 0});
  const [natural, setNatural] = useState({
    width: image.width ?? 0,
    height: image.height ?? 0,
  });
  const fit =
    natural.width && natural.height
      ? Math.min(bounds.width / natural.width, bounds.height / natural.height)
      : 0;
  const width = natural.width * fit;
  const height = natural.height * fit;
  const pan = clampArtworkPan(
    view.x,
    view.y,
    view.scale,
    width,
    height,
    bounds.width,
    bounds.height,
  );

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () =>
      setBounds({width: element.clientWidth, height: element.clientHeight});
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function changeZoom(delta: number) {
    setView((current) => ({
      ...current,
      ...pan,
      scale: Math.min(4, Math.max(1, current.scale + delta)),
    }));
  }
  function release(pointerId: number) {
    pointers.current.delete(pointerId);
    pinch.current = null;
  }
  return (
    <Drawer
      className="confidence-zoom"
      open
      onClose={onClose}
      title={`${title} — artwork detail`}
    >
      <div className="confidence-zoom__help">
        <p>
          Drag to explore. Use + / − to zoom, arrow keys to pan, or 0 to reset.
        </p>
        <p>
          {natural.width && natural.height
            ? `Source: ${natural.width} × ${natural.height} px`
            : 'Original artwork source'}
        </p>
      </div>
      <div
        className="confidence-zoom__viewport"
        ref={viewport}
        role="application"
        aria-roledescription="interactive artwork viewer"
        aria-label="Zoomable artwork. Plus and minus zoom; arrow keys pan; zero resets."
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            ![
              '+',
              '=',
              '-',
              '0',
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'ArrowDown',
            ].includes(event.key)
          )
            return;
          event.preventDefault();
          if (event.key === '+' || event.key === '=') changeZoom(0.5);
          else if (event.key === '-') changeZoom(-0.5);
          else if (event.key === '0') setView({scale: 1, x: 0, y: 0});
          else
            setView((current) => ({
              ...current,
              x:
                pan.x +
                (event.key === 'ArrowLeft'
                  ? 50
                  : event.key === 'ArrowRight'
                    ? -50
                    : 0),
              y:
                pan.y +
                (event.key === 'ArrowUp'
                  ? 50
                  : event.key === 'ArrowDown'
                    ? -50
                    : 0),
            }));
        }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
          });
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinch.current = {
              distance: Math.hypot(a.x - b.x, a.y - b.y),
              scale: view.scale,
            };
          }
        }}
        onPointerMove={(event) => {
          const previous = pointers.current.get(event.pointerId);
          if (!previous) return;
          pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
          });
          if (pointers.current.size === 2 && pinch.current) {
            const [a, b] = [...pointers.current.values()];
            const scale = Math.min(
              4,
              Math.max(
                1,
                (pinch.current.scale * Math.hypot(a.x - b.x, a.y - b.y)) /
                  Math.max(1, pinch.current.distance),
              ),
            );
            setView((current) => ({...current, ...pan, scale}));
          } else
            setView((current) => ({
              ...current,
              x: pan.x + event.clientX - previous.x,
              y: pan.y + event.clientY - previous.y,
            }));
        }}
        onPointerUp={(event) => release(event.pointerId)}
        onPointerCancel={(event) => release(event.pointerId)}
        onLostPointerCapture={(event) => release(event.pointerId)}
      >
        {/* Use the merchant's original URL rather than requesting a synthetic larger image. */}
        <img
          src={image.url}
          alt={image.altText}
          draggable={false}
          onLoad={(event) =>
            setNatural({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
          style={{
            width: width || '100%',
            height: height || '100%',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${view.scale})`,
          }}
        />
      </div>
      <div className="confidence-zoom__controls">
        <button
          type="button"
          aria-label="Zoom out"
          disabled={view.scale <= 1}
          onClick={() => changeZoom(-0.5)}
        >
          −
        </button>
        <output aria-live="polite">{Math.round(view.scale * 100)}%</output>
        <button
          type="button"
          aria-label="Zoom in"
          disabled={view.scale >= 4}
          onClick={() => changeZoom(0.5)}
        >
          +
        </button>
        <button type="button" onClick={() => setView({scale: 1, x: 0, y: 0})}>
          Reset view
        </button>
      </div>
    </Drawer>
  );
}

/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
