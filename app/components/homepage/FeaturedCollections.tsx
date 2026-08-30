import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {Icon} from '~/components/Icon';
import type {HomepageCollectionFeature} from '~/lib/homepage';
import {SectionHeading} from './SectionHeading';

export function FeaturedCollections({
  collections,
  title,
  eyebrow,
}: {
  collections: HomepageCollectionFeature[];
  title: string;
  eyebrow?: string;
}) {
  const visibleCollections = collections.slice(0, 5);
  const placeholders = Array.from(
    {length: Math.max(0, 5 - visibleCollections.length)},
    (_, index) => index,
  );
  return (
    <section className="home-featured section" aria-labelledby="home-featured-title">
      <div className="container container--wide">
        <SectionHeading
          action={
            <Link className="home-text-link" prefetch="intent" to="/collections">
              View all collections <Icon name="arrow-right" size={16} />
            </Link>
          }
          eyebrow={eyebrow}
          id="home-featured-title"
          title={title}
        />
        <div className="featured-collections-grid">
          {visibleCollections.map((collection) => (
            <Link
              aria-label={collection.title}
              className="collection-feature-card"
              key={collection.id}
              prefetch="intent"
              to={collection.to}
            >
              <div className="collection-feature-card__media">
                <Image
                  alt={collection.image.altText}
                  aspectRatio="4/5"
                  data={collection.image}
                  loading="lazy"
                  sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
                />
                <span className="collection-feature-card__shade" aria-hidden="true" />
                <span className="collection-feature-card__badge">Collection</span>
              </div>
              <span className="collection-feature-card__content">
                <strong>{collection.title}</strong>
                {collection.description ? <small>{collection.description}</small> : null}
              </span>
            </Link>
          ))}
          {placeholders.map((placeholder) => (
            <article
              aria-label="Upcoming collection"
              className="collection-feature-card collection-feature-card--placeholder"
              key={`featured-placeholder-${placeholder}`}
            >
              <div className="collection-feature-card__media" data-placeholder={placeholder + 1}>
                <span className="collection-feature-card__badge">Coming soon</span>
              </div>
              <span className="collection-feature-card__content">
                <strong>New collection</strong>
                <small>Artwork currently in development</small>
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
