import '~/styles/home-v2.css';
import '~/styles/home-v2-width-fix.css';
import '~/styles/home-v2-artists-dynamic.css';
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
      <EditorialBand />
      <MaterialShowcase />
      <ArtistSpotlight artists={artists} />
      <ClosingCta />
    </div>
  );
}
