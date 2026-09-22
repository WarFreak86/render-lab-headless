import {Link} from 'react-router';
import {Icon} from '~/components/Icon';
import {getProductionUrl} from '~/lib/config';

const MATERIALS_TITLE = 'Materials | Render-Lab';
const MATERIALS_DESCRIPTION =
  'Explore metal, canvas and poster formats for your Render-Lab artwork.';

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
    title: 'Metal',
    label: 'A crisp, contemporary surface',
    description:
      'Selected metal editions use brushed aluminum DIBOND®. Explore the available artwork, then choose the size and finish offered on its product page.',
    to: '/collections/metal-wall-art',
  },
  {
    id: 'canvas',
    title: 'Canvas',
    label: 'Texture and dimensional presence',
    description:
      'Stretched matte canvas gives the artwork a softer surface and depth on the wall. Available formats and sizes vary by artwork.',
    to: '/collections/canvas-art',
  },
  {
    id: 'poster',
    title: 'Poster',
    label: 'A flexible paper format',
    description:
      'Matte poster editions offer a low-glare surface and flexibility in how you present the work. Check the product details before choosing your frame.',
    to: '/collections/posters',
  },
];

export default function Materials() {
  return (
    <div className="materials-guide container container--wide">
      <header>
        <p className="eyebrow">Materials</p>
        <h1>Built to live on a wall.</h1>
        <p>Choose the artwork first. Find the surface that suits your space.</p>
      </header>
      <div className="materials-guide__grid">
        {materials.map((material) => (
          <section id={material.id} key={material.id}>
            <h2>{material.title}</h2>
            <h3>{material.label}</h3>
            <p>{material.description}</p>
            <Link to={material.to}>
              Explore {material.title.toLowerCase()}{' '}
              <Icon name="arrow-right" size={16} />
            </Link>
          </section>
        ))}
      </div>
      <Link to="/collections/wall-art">
        Explore all collections <Icon name="arrow-right" size={16} />
      </Link>
    </div>
  );
}
