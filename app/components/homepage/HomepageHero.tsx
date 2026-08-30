import {Image} from '@shopify/hydrogen';
import {ButtonLink} from '~/components/Button';
import {Icon} from '~/components/Icon';
import type {
  HomepageEditorialConfig,
  HomepageProductFeature,
} from '~/lib/homepage';

export function HomepageHero({
  editorial,
  primaryCta,
  product,
  secondaryCta,
}: {
  editorial?: HomepageEditorialConfig['hero'];
  primaryCta: {label: string; to: string} | null;
  product: HomepageProductFeature | null;
  secondaryCta: {label: string; to: string} | null;
}) {
  if (!editorial) return null;
  const resolvedPrimaryCta = primaryCta
    ? {...primaryCta, label: editorial.primaryCta.label}
    : editorial.primaryCta;
  const resolvedSecondaryCta = secondaryCta
    ? {...secondaryCta, label: 'Shop wall art'}
    : null;

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__inner">
        <div className="home-hero__progress" aria-hidden="true">
          <span className="is-active">01</span>
          <span>03</span>
        </div>
        <div className="home-hero__content">
          {editorial.eyebrow ? (
            <p className="home-eyebrow home-hero__eyebrow">{editorial.eyebrow}</p>
          ) : null}
          <h1 aria-label={editorial.headline.join(' ')} id="home-hero-title">
            {editorial.headline.map((line, index) => (
              <span
                className={index === editorial.accentLine ? 'home-hero__accent' : undefined}
                key={line}
              >
                {line}{' '}
              </span>
            ))}
          </h1>
          {editorial.description ? <p className="home-hero__copy">{editorial.description}</p> : null}
          <div className="home-hero__actions">
            <ButtonLink prefetch="intent" to={resolvedPrimaryCta.to}>
              {resolvedPrimaryCta.label}
            </ButtonLink>
            {resolvedSecondaryCta ? (
              <ButtonLink
                icon={<Icon name="arrow-right" size={17} />}
                prefetch="intent"
                to={resolvedSecondaryCta.to}
                variant="text"
              >
                {resolvedSecondaryCta.label}
              </ButtonLink>
            ) : null}
          </div>
          <div className="home-hero__proof" aria-label="Available art formats">
            <span className="home-hero__format-stack" aria-hidden="true">
              <i>M</i>
              <i>C</i>
              <i>P</i>
            </span>
            <span>
              <strong>Metal · Canvas · Poster</strong>
              <small>Made for collectors</small>
            </span>
          </div>
        </div>
        {product ? (
          <div className="home-hero__media">
            <Image
              alt={product.image.altText}
              aspectRatio="16/10"
              data={product.image}
              loading="eager"
              sizes="(max-width: 767px) 100vw, 60vw"
            />
            <span className="home-hero__scroll-cue" aria-hidden="true">
              Scroll to explore
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
