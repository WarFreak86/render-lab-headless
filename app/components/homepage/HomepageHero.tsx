import {Image} from '@shopify/hydrogen';
import {ButtonLink} from '~/components/Button';
import {
  HOMEPAGE_HERO_IMAGE,
  type HomepageEditorialConfig,
  type HomepageProductFeature,
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
    <section
      className="home-hero home-hero--v2"
      aria-labelledby="home-hero-title"
    >
      <div className="home-hero__media" aria-hidden="true">
        <Image
          alt=""
          data={{...HOMEPAGE_HERO_IMAGE, altText: ''}}
          {...{fetchpriority: 'high'}}
          loading="eager"
          sizes="100vw"
        />
      </div>
      <div className="home-hero__inner">
        <div className="home-hero__content">
          <p className="home-eyebrow home-hero__eyebrow">
            Render-Lab / Wall Art
          </p>
          <h1 id="home-hero-title">
            <span>Modern Wall Art</span> <span>for Unordinary Spaces</span>
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
