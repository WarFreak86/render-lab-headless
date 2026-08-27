import {Image} from '@shopify/hydrogen';
import {ButtonLink} from '~/components/Button';
import {Icon} from '~/components/Icon';
import type {
  HomepageEditorialConfig,
  HomepageProductFeature,
} from '~/lib/homepage';

function shortDescription(description?: string) {
  if (!description) return undefined;
  const firstSentence = description.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return firstSentence || description.slice(0, 180).trim();
}

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(Number(amount));
}

export function FeaturedDrop({
  product,
  editorial,
}: {
  product: HomepageProductFeature | null;
  editorial?: HomepageEditorialConfig['featuredDrop'];
}) {
  if (!product || !editorial) return null;
  const description = shortDescription(product.description);
  return (
    <section className="home-drop section" aria-labelledby="home-drop-title">
      <div className="container container--wide">
        <div className="featured-drop">
          <div className="featured-drop__media">
            <Image
              alt={product.image.altText}
              aspectRatio="16/10"
              data={product.image}
              loading="lazy"
              sizes="(max-width: 767px) 100vw, 58vw"
            />
          </div>
          <div className="featured-drop__content">
            {editorial.eyebrow ? <p className="home-eyebrow">{editorial.eyebrow}</p> : null}
            <h2 id="home-drop-title">{product.title}</h2>
            {product.productType ? <p className="featured-drop__type">{product.productType}</p> : null}
            {description ? <p className="featured-drop__description">{description}</p> : null}
            {product.price ? (
              <p className="featured-drop__price">
                <span>From</span>{' '}
                {formatMoney(product.price.amount, product.price.currencyCode)}
              </p>
            ) : null}
            <ButtonLink
              icon={<Icon name="arrow-right" size={17} />}
              prefetch="intent"
              to={product.to}
            >
              {editorial.ctaLabel}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
