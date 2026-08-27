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
  if (!collections.length) return null;
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
          {collections.map((collection) => (
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
              </div>
              <span className="collection-feature-card__content">
                <strong>{collection.title}</strong>
                {collection.description ? <small>{collection.description}</small> : null}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
