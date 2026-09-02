import type {CollectionHeroData} from '~/lib/collection';

export function CollectionStatement({
  hero,
  hasArtist,
}: {
  hero: CollectionHeroData;
  hasArtist: boolean;
}) {
  if (!hero.description) return null;

  const heading = hasArtist ? 'About the series' : 'About the collection';

  return (
    <section
      aria-labelledby="collection-statement-heading"
      className="collection-statement"
    >
      <div className="container container--wide collection-statement__layout">
        <div className="collection-statement__meta">
          <p>{hasArtist ? 'Series statement' : 'Collection statement'}</p>
          <span>{hero.title}</span>
        </div>
        <div className="collection-statement__copy">
          <h2 id="collection-statement-heading">{heading}</h2>
          <p>{hero.description}</p>
        </div>
      </div>
    </section>
  );
}
