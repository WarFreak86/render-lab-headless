import '~/styles/material-proof.css';
import {HomepageHero} from './HomepageHero';
import {CategoryRail} from './CategoryRail';
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
      <CategoryRail
        categories={data.categories}
        eyebrow={data.editorial?.categories.eyebrow}
        title={data.editorial?.categories.title ?? 'Explore'}
      />
      <FeaturedCollections
        collections={data.featuredCollections}
        eyebrow={data.editorial?.featuredCollections.eyebrow}
        title={data.editorial?.featuredCollections.title ?? 'Collections'}
      />
      <MaterialProof categories={data.categories} />
      <BenefitStrip benefits={data.editorial?.benefits ?? []} />
      <FeaturedDrop
        editorial={data.editorial?.featuredDrop}
        product={data.featuredDrop}
      />
    </div>
  );
}
