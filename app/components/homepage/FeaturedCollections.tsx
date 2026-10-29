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
  const visibleCollections = collections;

  if (visibleCollections.length === 0) return null;

  return (
    <section
      className="home-featured home-featured--editorial section"
      aria-labelledby="home-featured-title"
    >
      <div className="container container--wide">
        <SectionHeading
          action={
            <Link
              className="home-text-link"
              prefetch="intent"
              to="/collections"
            >
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
          {visibleCollections.map((collection) => (
            <Link
              aria-label={collection.title}
              className="collection-feature-card collection-feature-card--editorial"
              key={collection.id}
              prefetch="intent"
              to={collection.to}
            >
              <div className="collection-feature-card__media">
                <Image
                  alt={collection.image.altText}
                  aspectRatio="4/3"
                  data={collection.image}
                  loading="lazy"
                  sizes="(max-width: 767px) 92vw, (max-width: 1120px) 46vw, 31vw"
                />
                <span
                  className="collection-feature-card__shade"
                  aria-hidden="true"
                />
                <div className="collection-feature-card__content">
                  <h3>{collection.title}</h3>
                  {collection.description ? (
                    <small>{collection.description}</small>
                  ) : null}
                  <span
                    className="collection-feature-card__action"
                    aria-hidden="true"
                  >
                    View collection <Icon name="arrow-right" size={15} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
