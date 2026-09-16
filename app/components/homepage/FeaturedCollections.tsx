import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {Icon} from '~/components/Icon';
import type {HomepageCollectionFeature} from '~/lib/homepage';
import {SectionHeading} from './SectionHeading';
import {editorialTeaser} from '~/lib/editorial-text';

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
                  data={collection.image}
                  loading="lazy"
                  sizes="(max-width: 767px) 78vw, (max-width: 1120px) 33vw, 20vw"
                />
                <span className="collection-feature-card__shade" aria-hidden="true" />
                <span className="collection-feature-card__content">
                  <strong>{collection.title}</strong>
                  {collection.description ? (
                    <small>{editorialTeaser(collection.description)}</small>
                  ) : null}
                  <span className="collection-feature-card__action" aria-hidden="true">
                    View collection <Icon name="arrow-right" size={15} />
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
