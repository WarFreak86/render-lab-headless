import {Image} from '@shopify/hydrogen';
import type {CollectionHeroData} from '~/lib/collection';

export function CollectionHero({hero}: {hero: CollectionHeroData}) {
  const heading = hero.editorialHeading ?? hero.title;
  const eyebrow = hero.eyebrow ?? (hero.editorialHeading ? hero.title : undefined);

  return (
    <header
      className={`collection-hero ${hero.image ? '' : 'collection-hero--text-only'}`.trim()}
    >
      <div className="container container--wide collection-hero__inner">
        <div className="collection-hero__copy">
          {eyebrow ? <p className="collection-hero__eyebrow">{eyebrow}</p> : null}
          <h1>{heading}</h1>
          {hero.description ? <p>{hero.description}</p> : null}
        </div>
        {hero.image ? (
          <div className="collection-hero__media">
            <Image
              alt={hero.image.altText}
              aspectRatio="16/9"
              data={hero.image}
              loading="eager"
              sizes="(min-width: 64rem) 58vw, 100vw"
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
