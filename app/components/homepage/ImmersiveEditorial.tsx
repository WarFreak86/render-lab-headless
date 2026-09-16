import {Link} from 'react-router';
import {Icon} from '~/components/Icon';
import '~/styles/immersive-editorial.css';

const IMMERSIVE_IMAGE =
  'https://cdn.shopify.com/s/files/1/0748/7701/0081/files/render-lab-immersive-art-editorial.png?v=1789454338';

export function ImmersiveEditorial() {
  return (
    <section className="home-immersive" aria-labelledby="home-immersive-title">
      <div className="home-immersive__frame">
        <div className="home-immersive__media">
          <img
            alt="Conceptual Render-Lab editorial showing fiery volcanic artwork extending dramatically beyond a wall-mounted print"
            decoding="async"
            loading="lazy"
            sizes="(max-width: 767px) 100vw, 96vw"
            src={`${IMMERSIVE_IMAGE}&width=1800`}
            srcSet={`${IMMERSIVE_IMAGE}&width=960 960w, ${IMMERSIVE_IMAGE}&width=1440 1440w, ${IMMERSIVE_IMAGE}&width=2048 2048w`}
          />
        </div>

        <div className="home-immersive__caption">
          <div className="home-immersive__heading">
            <p className="home-eyebrow">Render-Lab / room impact</p>
            <h2 id="home-immersive-title">Art should change the room.</h2>
          </div>

          <div className="home-immersive__copy">
            <p>
              A conceptual brand visualization of the scale, energy and atmosphere a
              statement piece can bring to a space. The artwork stays physical; the
              impact should feel larger than the frame.
            </p>
            <Link className="home-text-link" prefetch="intent" to="/collections/wall-art">
              Explore wall art <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
