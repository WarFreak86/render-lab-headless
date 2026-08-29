import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {CollectionHero} from './CollectionHero';
import type {CollectionHeroData} from '~/lib/collection';
import type {CollectionDirectoryEntry} from '~/lib/collection-directory';

export function CollectionDirectoryView({
  entries,
  hero,
}: {
  entries: CollectionDirectoryEntry[];
  hero: CollectionHeroData;
}) {
  return (
    <div className="collection-experience collection-directory-page">
      <CollectionHero hero={hero} />
      <section
        aria-labelledby="collection-directory-heading"
        className="collection-directory"
      >
        <div className="container container--wide">
          <div className="collection-directory__heading">
            <h2 id="collection-directory-heading">Browse by collection</h2>
            <p>Choose a series to see only the artwork that belongs to it.</p>
          </div>

          {entries.length ? (
            <div className="collection-directory__grid">
              {entries.map((entry, index) => (
                <CollectionDirectoryCard
                  entry={entry}
                  index={index}
                  key={entry.id}
                />
              ))}
            </div>
          ) : (
            <div className="collection-directory__empty">
              <h2>New collections are being prepared.</h2>
              <p>Check back soon for the next curated release.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CollectionDirectoryCard({
  entry,
  index,
}: {
  entry: CollectionDirectoryEntry;
  index: number;
}) {
  return (
    <article className="collection-directory-card">
      <Link prefetch="intent" to={entry.to}>
        <div className="collection-directory-card__media">
          {entry.image ? (
            <Image
              alt={entry.image.altText}
              aspectRatio="16/9"
              data={entry.image}
              loading={index < 2 ? 'eager' : undefined}
              sizes="(min-width: 64rem) 50vw, 100vw"
            />
          ) : (
            <span>Collection artwork coming soon</span>
          )}
        </div>
        <div className="collection-directory-card__body">
          <h3>{entry.title}</h3>
          {entry.description ? <p>{entry.description}</p> : null}
          <span className="collection-directory-card__action">
            View collection
            <ArrowIcon />
          </span>
        </div>
      </Link>
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 12">
      <path d="M0 6h46M40 1l6 5-6 5" />
    </svg>
  );
}
