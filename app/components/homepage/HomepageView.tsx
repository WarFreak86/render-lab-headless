import '~/styles/material-proof.css';
import {HomepageHero} from './HomepageHero';
import {FeaturedCollections} from './FeaturedCollections';
import {MaterialProof} from './MaterialProof';
import {BenefitStrip} from './BenefitStrip';
import {FeaturedDrop} from './FeaturedDrop';
import type {HomepageData} from '~/lib/homepage';

export function HomepageView({data}: {data: HomepageData}) {
  return (
    <div className="home homepage">
      <HomepageHero
        editorial={data.editorial?.hero}
        primaryCta={data.heroPrimaryCta}
        product={data.hero}
        secondaryCta={data.heroSecondaryCta}
      />
      <FeaturedCollections
        collections={data.featuredCollections}
        eyebrow={data.editorial?.featuredCollections.eyebrow}
        title="Find your next piece."
      />
      <MaterialProof categories={data.categories} />
      <BenefitStrip benefits={data.editorial?.benefits ?? []} />
      {data.featuredDrop ? <FeaturedDrop
        editorial={data.editorial?.featuredDrop}
        product={data.featuredDrop}
      /> : null}
    </div>
  );
}
