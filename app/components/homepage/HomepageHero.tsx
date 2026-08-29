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
  const resolvedPrimaryCta = primaryCta ?? editorial.primaryCta;

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__inner">
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
            {secondaryCta ? (
              <ButtonLink
                icon={<Icon name="arrow-right" size={17} />}
                prefetch="intent"
                to={secondaryCta.to}
                variant="text"
              >
                {secondaryCta.label}
              </ButtonLink>
            ) : null}
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
            <div className="home-hero__caption" aria-hidden="true">
              <span>{product.title}</span>
              {product.productType ? <span>{product.productType}</span> : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
