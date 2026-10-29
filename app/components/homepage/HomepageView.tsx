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
}: {
  data: HomepageData;
  artists?: ReadonlyArray<ArtistSpotlightItem>;
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
      <FeaturedProducts products={data.featuredProducts} />
      <EditorialBand />
      <MaterialShowcase />
      <ArtistSpotlight artists={artists} />
      <ClosingCta />
    </div>
  );
}
