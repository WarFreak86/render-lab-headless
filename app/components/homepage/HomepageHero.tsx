import {ButtonLink} from '~/components/Button';
import type {
  HomepageEditorialConfig,
  HomepageProductFeature,
} from '~/lib/homepage';

export function HomepageHero({
  editorial,
}: {
  editorial?: HomepageEditorialConfig['hero'];
  primaryCta: {label: string; to: string} | null;
  product: HomepageProductFeature | null;
  secondaryCta: {label: string; to: string} | null;
}) {
  if (!editorial) return null;

  return (
    <section className="home-hero home-hero--v2" aria-labelledby="home-hero-title">
      <div className="home-hero__media" aria-hidden="true">
        <img
          alt=""
          fetchPriority="high"
          loading="eager"
          src="https://cdn.shopify.com/s/files/1/0748/7701/0081/files/render-lab-home-volcanic-gallery.png?v=1789594138"
        />
      </div>
      <div className="home-hero__inner">
        <div className="home-hero__content">
          <p className="home-eyebrow home-hero__eyebrow">Render-Lab / Wall Art</p>
          <h1 id="home-hero-title">
            <span>Art should</span>
            <span>change the room.</span>
          </h1>
          <p className="home-hero__copy">
            Bold imagery. Premium materials. Work designed to become part of the
            space, not disappear into it.
          </p>
          <div className="home-hero__actions">
            <ButtonLink prefetch="intent" to="/collections/wall-art">
              Explore wall art
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
