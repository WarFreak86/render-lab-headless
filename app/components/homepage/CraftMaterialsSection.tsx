import {Link} from 'react-router';

const pillars = [
  {image: '/images/craft-aluminum.jpg', alt: 'Close-up of an aluminum print edge', title: '3mm Aluminum (DIBOND)', copy: 'Matte, glare-controlled architectural metal prints with rigid, museum-grade durability.'},
  {image: '/images/craft-canvas.jpg', alt: 'Close-up of a gallery-wrapped canvas corner', title: 'Gallery-Wrapped Canvas', copy: 'Heavyweight archival canvas with deep wrapped edges and rich ink saturation.'},
  {image: '/images/craft-hardware.jpg', alt: 'Wall mounting hardware behind an aluminum print', title: 'Ready-to-Hang Studio Curation', copy: 'Integrated hanging hardware and color calibration by J.B. Render bring the artwork into your room.'},
] as const;

export function CraftMaterialsSection() {
  return (
    <section className="craft-materials" aria-labelledby="craft-materials-heading">
      <div className="container container--wide">
        <p className="craft-materials__eyebrow">Craft &amp; materials</p>
        <h2 id="craft-materials-heading">Made to live with.</h2>
        <div className="craft-materials__grid">
          {pillars.map((pillar) => (
            <article className="craft-materials__card" key={pillar.title}>
              <div className="craft-materials__visual">
                <img src={pillar.image} alt={pillar.alt} width={1200} height={900} loading="lazy" decoding="async" />
              </div>
              <div className="craft-materials__copy"><h3>{pillar.title}</h3><p>{pillar.copy}</p></div>
            </article>
          ))}
        </div>
        <Link className="craft-materials__link" to="/materials" prefetch="intent">
          Explore materials <span aria-hidden="true">&#8599;</span>
        </Link>
      </div>
    </section>
  );
}
