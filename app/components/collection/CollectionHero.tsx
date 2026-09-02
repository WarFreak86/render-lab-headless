import {Image} from '@shopify/hydrogen';
import type {CollectionHeroData} from '~/lib/collection';

export function CollectionHero({hero}: {hero: CollectionHeroData}) {
  const heading = hero.editorialHeading ?? hero.title;
  const eyebrow = hero.eyebrow ?? (hero.editorialHeading ? hero.title : undefined);

  return (
    <header
      className={`collection-hero collection-hero--story ${
        hero.image ? 'collection-hero--story-image' : 'collection-hero--text-only'
      }`.trim()}
    >
      <div className="container container--wide collection-hero__inner">
        <div className="collection-hero__copy">
          {eyebrow ? <p className="collection-hero__eyebrow">{eyebrow}</p> : null}
          <h1>{heading}</h1>
        </div>
        {hero.image ? (
          <div className="collection-hero__media">
            <Image
              alt={hero.image.altText}
              aspectRatio="16/9"
              data={hero.image}
              loading="eager"
              sizes="100vw"
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
