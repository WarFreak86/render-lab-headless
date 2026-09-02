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
  const visibleCollections = collections.slice(0, 3);

  if (visibleCollections.length === 0) return null;

  return (
    <section
      className="home-featured home-featured--editorial section"
      aria-labelledby="home-featured-title"
    >
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

        <div
          className="featured-collections-grid featured-collections-grid--mosaic"
          data-count={visibleCollections.length}
        >
          {visibleCollections.map((collection, index) => (
            <Link
              aria-label={collection.title}
              className={`collection-feature-card collection-feature-card--editorial ${
                index === 0
                  ? 'collection-feature-card--lead'
                  : 'collection-feature-card--support'
              }`}
              key={collection.id}
              prefetch="intent"
              to={collection.to}
            >
              <div className="collection-feature-card__media">
                <Image
                  alt={collection.image.altText}
                  data={collection.image}
                  loading="lazy"
                  sizes={
                    index === 0
                      ? '(max-width: 767px) 100vw, 66vw'
                      : '(max-width: 767px) 100vw, 34vw'
                  }
                />
                <span className="collection-feature-card__shade" aria-hidden="true" />
                <span className="collection-feature-card__badge">Curated series</span>
                <span className="collection-feature-card__content">
                  <strong>{collection.title}</strong>
                  {collection.description ? <small>{collection.description}</small> : null}
                  <span className="collection-feature-card__action" aria-hidden="true">
                    Explore series <Icon name="arrow-right" size={15} />
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
