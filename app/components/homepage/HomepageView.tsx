import {FeaturedApparel, type HomepageHoodies} from './FeaturedApparel';
import {FeaturedProducts} from './FeaturedProducts';
import {HomepageHero} from './HomepageHero';
import {FeaturedCollections} from './FeaturedCollections';
import {
  ArtistSpotlight,
  ClosingCta,
  EditorialBand,
  MaterialShowcase,
  type ArtistSpotlightItem,
} from './HomepageCinematicSections';
import type {HomepageData} from '~/lib/homepage';

export function HomepageView({
  data,
  artists = [],
  hoodies = [],
}: {
  data: HomepageData;
  artists?: ReadonlyArray<ArtistSpotlightItem>;
  hoodies?: HomepageHoodies;
}) {
  return (
    <div className="home homepage homepage-v2">
      <HomepageHero
        editorial={data.editorial?.hero}
        primaryCta={data.heroPrimaryCta}
        product={data.hero}
        secondaryCta={data.heroSecondaryCta}
      />
      <FeaturedCollections
        collections={data.featuredCollections}
        eyebrow="Distinct worlds. Original perspectives."
        title="Featured collections"
      />
      <FeaturedApparel hoodies={hoodies} />
      <FeaturedProducts products={data.featuredProducts} />
      <EditorialBand />
      <MaterialShowcase />
      <ArtistSpotlight artists={artists} />
      <ClosingCta />
    </div>
  );
}
