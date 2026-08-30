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
  if (!editorial) return null;
  const description = product
    ? shortDescription(product.description)
    : 'A new numbered release is currently being prepared for the Render-Lab archive.';
  const title = product?.title ?? 'Next limited drop';
  return (
    <section className="home-drop" aria-labelledby="home-drop-title">
      <div className="container container--wide">
        <div className="featured-drop" data-placeholder={product ? undefined : true}>
          <div className="featured-drop__intro">
            {editorial.eyebrow ? <p className="home-eyebrow">{editorial.eyebrow}</p> : null}
            <h2 id="home-drop-title">{title}</h2>
            {description ? <p className="featured-drop__description">{description}</p> : null}
            <div className="featured-drop__release-grid" aria-label="Release details">
              <span><strong>—</strong><small>Release</small></span>
              <span><strong>—</strong><small>Edition</small></span>
              <span><strong>—</strong><small>Remaining</small></span>
            </div>
          </div>
          <div className="featured-drop__media">
            {product ? (
              <Image
                alt={product.image.altText}
                aspectRatio="16/10"
                data={product.image}
                loading="lazy"
                sizes="(max-width: 767px) 100vw, 42vw"
              />
            ) : (
              <div className="featured-drop__placeholder-art" aria-label="Artwork placeholder">
                <span>Artwork in development</span>
              </div>
            )}
          </div>
          <div className="featured-drop__content">
            <ul className="featured-drop__features">
              <li><Icon name="material" size={24} /><span><strong>Material</strong><small>{product?.productType ?? 'To be announced'}</small></span></li>
              <li><Icon name="edition" size={24} /><span><strong>Edition</strong><small>Release details coming soon</small></span></li>
              <li><Icon name="details" size={24} /><span><strong>Presentation</strong><small>Specifications listed at launch</small></span></li>
            </ul>
            {product?.price ? (
              <p className="featured-drop__price">
                <span>From</span>
                {formatMoney(product.price.amount, product.price.currencyCode)}
              </p>
            ) : <p className="featured-drop__price featured-drop__price--pending">Price announced at launch</p>}
            <ButtonLink
              icon={<Icon name="arrow-right" size={17} />}
              prefetch="intent"
              to={product?.to ?? '/collections/wall-art'}
            >
              {product ? editorial.ctaLabel : 'Explore current work'}
            </ButtonLink>
            <div className="featured-drop__status" aria-hidden="true"><span /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
