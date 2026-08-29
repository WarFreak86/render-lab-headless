import {HomepageHero} from './HomepageHero';
import {CategoryRail} from './CategoryRail';
import {FeaturedCollections} from './FeaturedCollections';
import {BenefitStrip} from './BenefitStrip';
import {FeaturedDrop} from './FeaturedDrop';
import type {HomepageData} from '~/lib/homepage';

export function HomepageView({data}: {data: HomepageData}) {
  return (
    <div className="home homepage">
      <HomepageHero
        editorial={data.editorial?.hero}
        product={data.hero}
        secondaryCta={data.heroSecondaryCta}
      />
      <FeaturedDrop
        editorial={data.editorial?.featuredDrop}
        product={data.featuredDrop}
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
      <BenefitStrip benefits={data.editorial?.benefits ?? []} />
    </div>
  );
}
