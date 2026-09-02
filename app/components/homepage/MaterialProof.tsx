import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {HomepageCategory} from '~/lib/homepage';

const FORMAT_STUDIES = [
  {
    id: 'metal',
    title: 'Metal',
    to: '/collections/metal-wall-art',
    label: 'Brushed aluminum',
    description:
      'Selected metal editions use brushed aluminum DIBOND® for a crisp, contemporary presentation where the surface can become part of the work.',
    details: ['Direct-to-metal finish', 'Clean contemporary edge', 'Multiple sizes where offered'],
  },
  {
    id: 'canvas',
    title: 'Canvas',
    to: '/collections/canvas-art',
    label: 'Textured depth',
    description:
      'Canvas adds visible surface texture and dimensional presence while keeping the artwork itself at the center of the presentation.',
    details: ['Textured surface', 'Dimensional wall presence', 'Multiple sizes where offered'],
  },
  {
    id: 'poster',
    title: 'Poster',
    to: '/collections/posters',
    label: 'Flexible paper edition',
    description:
      'Poster editions offer a clean, easy-to-frame format for collectors who want flexibility in how the finished work is presented.',
    details: ['Easy to frame', 'Lightweight presentation', 'Multiple sizes where offered'],
  },
] as const;

export function MaterialProof({categories}: {categories: HomepageCategory[]}) {
  const categoryByDestination = new Map(
    categories.map((category) => [category.to, category]),
  );

  return (
    <section className="home-materials" aria-labelledby="home-materials-title">
      <div className="container container--wide">
        <header className="home-materials__header">
          <div className="home-materials__meta">
            <p className="home-eyebrow">Materials &amp; craft</p>
            <span>Format studies / 01–03</span>
          </div>
          <div className="home-materials__intro">
            <h2 id="home-materials-title">Built to live on a wall.</h2>
            <p>
              Metal, canvas and poster editions change the surface, depth and framing
              of the work. Available formats vary by artwork.
            </p>
          </div>
        </header>

        <div className="material-proof-grid">
          {FORMAT_STUDIES.map((format, index) => {
            const category = categoryByDestination.get(format.to);
            return (
              <article className="material-proof-card" key={format.id}>
                <div className="material-proof-card__media">
                  <span className="material-proof-card__index">
                    {String(index + 1).padStart(2, '0')} / {format.title}
                  </span>
                  <div
                    className={`material-proof__object material-proof__object--${format.id}`}
                  >
                    {category ? (
                      <Image
                        alt={`${format.title} format artwork preview`}
                        aspectRatio="4/5"
                        data={category.image}
                        loading="lazy"
                        sizes="(max-width: 767px) 68vw, (max-width: 1100px) 28vw, 20vw"
                      />
                    ) : (
                      <span className="material-proof__surface" aria-hidden="true" />
                    )}
                  </div>
                </div>

                <div className="material-proof-card__body">
                  <p className="material-proof-card__label">{format.label}</p>
                  <h3>{format.title}</h3>
                  <p className="material-proof-card__description">{format.description}</p>
                  <ul>
                    {format.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  <Link
                    className="material-proof-card__link"
                    prefetch="intent"
                    to={category?.to ?? format.to}
                  >
                    Explore {format.title.toLowerCase()}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="home-materials__assurance" aria-label="Format buying notes">
          <div>
            <strong>Made to order</strong>
            <span>Produced when you select a work and format.</span>
          </div>
          <div>
            <strong>Size choice</strong>
            <span>Available dimensions are listed on each artwork.</span>
          </div>
          <div>
            <strong>Clear format details</strong>
            <span>Finish and pricing are shown before you add to cart.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
