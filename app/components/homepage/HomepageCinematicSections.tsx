import {Link} from 'react-router';
import {Icon} from '~/components/Icon';

const MATERIALS = [
  {
    title: 'Metal',
    description: 'Crisp detail. Clean edges. Built for impact.',
    to: '/collections/metal-wall-art',
    image:
      'https://cdn.shopify.com/s/files/1/0748/7701/0081/files/render-lab-home-material-metal.png?v=1789594163',
    alt: 'Close-up of premium metal wall art with crisp rigid edge',
  },
  {
    title: 'Canvas',
    description: 'Texture, depth and a gallery-ready finish.',
    to: '/collections/canvas-art',
    image:
      'https://cdn.shopify.com/s/files/1/0748/7701/0081/files/render-lab-home-material-canvas.png?v=1789594173',
    alt: 'Close-up of slim wrapped canvas wall art with visible texture',
  },
  {
    title: 'Posters',
    description: 'Bold imagery in an accessible archival format.',
    to: '/collections/posters',
    image:
      'https://cdn.shopify.com/s/files/1/0748/7701/0081/files/render-lab-home-material-poster.png?v=1789594183',
    alt: 'Close-up of premium poster print with curled paper edge',
  },
] as const;

const ARTISTS = [
  {
    name: 'Nico Vale',
    handle: 'nico-vale',
    biography:
      'Distant coastlines, mountain haze and quiet geometry shaped by cinematic light.',
    image:
      'https://cdn.shopify.com/s/files/1/0748/7701/0081/files/nico-vale-artist-profile.png?v=1788249520',
    alt: 'Portrait of Render-Lab house artist Nico Vale in a coastal-inspired studio',
  },
  {
    name: 'Mara Voss',
    handle: 'mara-voss',
    biography:
      'Botanical beauty pushed toward biological unease, impossible specimens and synthetic life.',
    image:
      'https://cdn.shopify.com/s/files/1/0748/7701/0081/files/mara-voss-artist-portrait.jpg?v=1788254504',
    alt: 'Portrait of Render-Lab house artist Mara Voss in a botanical studio',
  },
  {
    name: 'Dante Mercer',
    handle: 'dante-mercer',
    biography:
      'Street portraiture, neon city culture and larger-than-life urban mythology.',
    image:
      'https://cdn.shopify.com/s/files/1/0748/7701/0081/files/dante-mercer-artist-profile-realistic.png?v=1789478404',
    alt: 'Dante Mercer fictional artist profile portrait',
  },
] as const;

export function EditorialBand() {
  return (
    <section className="home-v2-editorial" aria-labelledby="home-v2-editorial-title">
      <img
        alt="Dark mountain valley at dusk with dramatic clouds and warm light"
        loading="lazy"
        src="https://cdn.shopify.com/s/files/1/0748/7701/0081/files/render-lab-home-editorial-mountains.png?v=1789594150"
      />
      <span className="home-v2-editorial__shade" aria-hidden="true" />
      <div className="home-v2-editorial__copy">
        <p className="home-v2-kicker">Render-Lab / Editorial</p>
        <h2 id="home-v2-editorial-title">More than decoration.</h2>
        <p>A higher standard for your space.</p>
        <Link className="home-v2-link" prefetch="intent" to="/collections/wall-art">
          Explore all wall art <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </section>
  );
}

export function MaterialShowcase() {
  return (
    <section className="home-v2-materials" aria-labelledby="home-v2-materials-title">
      <div className="container container--wide">
        <header className="home-v2-section-head">
          <p className="home-v2-kicker">Shop by material</p>
          <h2 id="home-v2-materials-title">Made for the wall.</h2>
          <p>Three premium formats. One uncompromising standard.</p>
        </header>
        <div className="home-v2-materials__grid">
          {MATERIALS.map((material) => (
            <Link
              aria-label={`Shop ${material.title}`}
              className="home-v2-material-card"
              key={material.title}
              prefetch="intent"
              to={material.to}
            >
              <div className="home-v2-material-card__media">
                <img alt={material.alt} loading="lazy" src={material.image} />
                <span aria-hidden="true" />
              </div>
              <div className="home-v2-material-card__copy">
                <h3>{material.title}</h3>
                <p>{material.description}</p>
                <strong>
                  Shop {material.title} <Icon name="arrow-right" size={15} />
                </strong>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ArtistSpotlight() {
  return (
    <section className="home-v2-artists" aria-labelledby="home-v2-artists-title">
      <div className="container container--wide">
        <header className="home-v2-section-head home-v2-section-head--center">
          <p className="home-v2-kicker">Meet the artists</p>
          <h2 id="home-v2-artists-title">Three distinct visions.</h2>
          <p>One shared obsession.</p>
        </header>
        <div className="home-v2-artists__grid">
          {ARTISTS.map((artist) => (
            <Link
              aria-label={`View ${artist.name}`}
              className="home-v2-artist-card"
              key={artist.handle}
              prefetch="intent"
              to={`/artists/${artist.handle}`}
            >
              <div className="home-v2-artist-card__media">
                <img alt={artist.alt} loading="lazy" src={artist.image} />
              </div>
              <div className="home-v2-artist-card__copy">
                <p className="home-v2-kicker">Artist</p>
                <h3>{artist.name}</h3>
                <p>{artist.biography}</p>
                <strong>
                  View artist <Icon name="arrow-right" size={15} />
                </strong>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="home-v2-closing" aria-labelledby="home-v2-closing-title">
      <img
        alt="Dark coastal landscape beneath a crimson moon with a lone figure"
        loading="lazy"
        src="https://cdn.shopify.com/s/files/1/0748/7701/0081/files/render-lab-home-closing-crimson-horizon.png?v=1789594202"
      />
      <span className="home-v2-closing__shade" aria-hidden="true" />
      <div className="home-v2-closing__copy">
        <p className="home-v2-kicker">Render-Lab / Wall art</p>
        <h2 id="home-v2-closing-title">Find the piece that changes the room.</h2>
        <Link className="home-v2-button" prefetch="intent" to="/collections/wall-art">
          Explore wall art <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </section>
  );
}
