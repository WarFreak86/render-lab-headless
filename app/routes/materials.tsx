import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import materialsGalleryStyles from '~/styles/gallery-materials.css?url';
import {Icon} from '~/components/Icon';
import {getProductionUrl} from '~/lib/config';

export const links = () => [{rel: 'stylesheet', href: materialsGalleryStyles}];

const MATERIALS_TITLE =
  'Metal vs Canvas vs Poster: Wall Art Buying Guide | Render-Lab';
const MATERIALS_DESCRIPTION =
  'Compare metal prints, canvas art and matte posters. Learn how to choose the right wall art material, size and finish for your space.';

export const meta = () => {
  const canonical = getProductionUrl('/materials');
  return [
    {title: MATERIALS_TITLE},
    {name: 'description', content: MATERIALS_DESCRIPTION},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: MATERIALS_TITLE},
    {property: 'og:description', content: MATERIALS_DESCRIPTION},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
  ];
};

const materials = [
  {
    id: 'metal',
    title: 'Metal prints',
    label: 'Rigid panel · Frameless presentation',
    description:
      'Choose metal for crisp edges and a clean, contemporary profile. Selected prints use brushed aluminum, whose grain can show through lighter areas. This finish pairs well with modern, minimalist and industrial rooms.',
    image: {
      url: 'https://cdn.shopify.com/s/files/1/1032/5187/0010/files/ui-004-pink-crown-metal-mockup-final-v2.png?v=1795493871',
      width: 1334,
      height: 1334,
      alt: 'Render-Lab Pink Crown metal print product mockup',
    },
    cta: 'Shop metal wall art',
    to: '/collections/metal-wall-art',
  },
  {
    id: 'canvas',
    title: 'Canvas prints',
    label: 'Matte texture · Gallery-wrapped edges',
    description:
      'Choose canvas for a woven surface and more depth at the edges. The print wraps around a stretcher, so it can be displayed without an outer frame. Its texture suits rooms with wood, textiles and other matte finishes.',
    image: {
      url: 'https://cdn.shopify.com/s/files/1/1032/5187/0010/files/ui-004-pink-crown-canvas-mockup-final-v2.png?v=1795493871',
      width: 1334,
      height: 1334,
      alt: 'Render-Lab Pink Crown gallery-wrapped canvas product mockup',
    },
    cta: 'Shop canvas art',
    to: '/collections/canvas-art',
  },
  {
    id: 'poster',
    title: 'Matte posters',
    label: 'Matte paper · Your choice of frame',
    description:
      'Choose a matte poster if you want to select your own frame and mat. Paper prints work well in gallery walls and coordinated sets. A frame with glazing can add reflections, depending on the glazing you choose.',
    image: {
      url: 'https://cdn.shopify.com/s/files/1/1032/5187/0010/files/ui-004-pink-crown-web-final.png?v=1795493871',
      width: 1083,
      height: 1452,
      alt: 'Pink Crown artwork preview for the matte poster edition',
    },
    cta: 'Shop art posters',
    to: '/collections/posters',
  },
];

export default function Materials() {
  return (
    <div className="materials-guide container container--wide">
      <header className="materials-guide__header">
        <p className="eyebrow">Wall art buying guide</p>
        <h1>Choose the Right Wall Art for Your Space</h1>
        <p>
          Compare how metal, canvas and matte paper look on the wall, then
          choose a size and a way to hang it.
        </p>
        <nav aria-label="Buying guide sections">
          <ul>
            <li>
              <a href="#compare-formats">Compare formats</a>
            </li>
            <li>
              <a href="#size-guide">Size and placement</a>
            </li>
            <li>
              <a href="#framing-mounting">Framing and mounting</a>
            </li>
            <li>
              <a href="#delivery">Production and shipping</a>
            </li>
          </ul>
        </nav>
      </header>
      <section
        className="materials-guide__comparison"
        id="compare-formats"
        aria-labelledby="material-comparison-title"
      >
        <h2 id="material-comparison-title">Metal vs. canvas vs. poster</h2>
        <p>
          <Link to="/products/pink-crown-urban-icon">
            Pink Crown from Urban Icon
          </Link>{' '}
          is shown as metal and canvas product mockups and as the artwork
          preview for the poster. Formats, sizes and prices vary by artwork.
        </p>
        <div className="materials-guide__grid">
          {materials.map((material) => (
            <article id={material.id} key={material.id}>
              <div className="materials-guide__media">
                <Image
                  data={material.image}
                  alt={material.image.alt}
                  loading="lazy"
                  sizes="(min-width: 48rem) 30vw, 90vw"
                />
              </div>
              <div className="materials-guide__card-copy">
                <h3>{material.title}</h3>
                <p className="materials-guide__label">{material.label}</p>
                <p>{material.description}</p>
                <Link className="materials-guide__shop" to={material.to}>
                  {material.cta} <Icon name="arrow-right" size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="materials-guide__details">
        <section id="size-guide" aria-labelledby="material-size-title">
          <h2 id="material-size-title">Wall art size guide</h2>
          <p>
            Measure the clear wall area and mark a few possible sizes with
            painter’s tape. Step back to the distance you’ll usually view the
            piece from. A 12 × 16 inch print can sit comfortably on a narrow
            wall, while 18 × 24 or 24 × 32 inches may suit a focal wall above
            furniture. Use the outer frame dimensions if you plan to frame it.
          </p>
          <p>
            A portrait print makes use of a tall, narrow space. A landscape
            print can follow the line of a sofa or console. Start near eye
            level, then adjust for furniture clearance and how you use the room.
          </p>
        </section>
        <section id="framing-mounting" aria-labelledby="material-mount-title">
          <h2 id="material-mount-title">Framing and mounting</h2>
          <p>
            Metal and gallery-wrapped canvas can be displayed without an outer
            frame. Check what comes with the selected print before buying
            hardware. Choose fixtures rated for the weight of the piece and
            appropriate for your wall type. For posters, check the print size
            against the frame opening and allow room for a mat if you want one.
          </p>
        </section>
        <section id="delivery" aria-labelledby="material-delivery-title">
          <h2 id="material-delivery-title">
            Made to order and shipped after production
          </h2>
          <p>
            Wall art is made to order. Metal and canvas production typically
            takes 2–4 business days before carrier transit begins. Poster
            production can vary by product and size. Check checkout for rates,
            available shipping options and estimated delivery for your address.
            See the <Link to="/policies/shipping-policy">shipping policy</Link>.
          </p>
        </section>
      </div>
      <section
        className="materials-guide__next"
        aria-labelledby="material-shop-title"
      >
        <h2 id="material-shop-title">Find artwork for your wall</h2>
        <p>
          Explore the metal and canvas editions of{' '}
          <Link to="/collections/the-veil-between-worlds">
            The Veil Between Worlds
          </Link>{' '}
          for gothic cathedral art and celestial landscapes.
        </p>
        <Link className="materials-guide__shop" to="/collections/wall-art">
          Browse all wall art <Icon name="arrow-right" size={16} />
        </Link>
      </section>
    </div>
  );
}
