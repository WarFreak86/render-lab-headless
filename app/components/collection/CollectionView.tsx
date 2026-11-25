import '~/styles/collection-storytelling.css';
import '~/styles/catalog-cards.css';
import {Link} from 'react-router';
import {CollectionHero} from './CollectionHero';
import {CollectionControls} from './CollectionControls';
import {CollectionProductGrid} from './CollectionProductGrid';
import {CollectionArtist} from './CollectionArtist';
import {
  CARNIVORA_BUYING_GUIDE,
  getActiveCollectionFilters,
  type CollectionPageData,
} from '~/lib/collection';

export function CollectionView({
  connection,
  data,
  searchParams,
}: {
  connection: {
    nodes: CollectionPageData['products'];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
  };
  data: CollectionPageData;
  searchParams: URLSearchParams;
}) {
  const activeFilters = getActiveCollectionFilters(
    searchParams,
    data.filterGroups,
  );

  return (
    <div className="collection-experience collection-experience--storytelling">
      <CollectionHero hero={data.hero} />

      <div className="container container--wide collection-browser">
        <CollectionControls
          filterGroups={data.filterGroups}
          searchParams={searchParams}
        />
        <div
          className="collection-browser__layout collection-browser__layout--full"
        >
          <CollectionProductGrid
            connection={connection}
            context={{
              artistName: data.artist?.name,
              collectionTitle: data.hero.title,
            }}
            hasActiveFilters={activeFilters.length > 0}
            searchParams={searchParams}
          />
        </div>
      </div>
      <CollectionBuyingGuide handle={data.handle} products={data.products} />
      {data.artist ? <CollectionArtist artist={data.artist} /> : null}
    </div>
  );
}

interface CollectionBuyingGuideData {
  title: string;
  introduction: string;
  tips: {heading: string; text: string}[];
  recommendations: {label: string; to: string}[];
}

const COLLECTION_BUYING_GUIDES: Record<string, CollectionBuyingGuideData> = {
  carnivora: CARNIVORA_BUYING_GUIDE,
  'chrome-thunder': {
    title: 'Choosing classic car wall art',
    introduction:
      'Bring hot rod and muscle car artwork into a garage, office, study, or living space. Start with the car you love, then choose a print surface and landscape size that fit the wall.',
    tips: [
      {
        heading: 'Metal or canvas?',
        text: 'Metal offers a crisp, contemporary presentation that suits chrome, paintwork, and bold contrasts. Matte stretched canvas has a softer, textured finish that works well in warmer rooms.',
      },
      {
        heading: 'Which landscape size?',
        text: 'These artworks are offered in 16 × 12, 24 × 18, and 32 × 24 inch landscape formats. The smaller size suits a tighter display; the larger formats give a favorite car more wall presence. Measure the available space before selecting a variant.',
      },
      {
        heading: 'Find your kind of horsepower',
        text: 'For prewar hot rod shapes, start with Fireglass or Willys Wild. For 1970s muscle-car silhouettes, compare Boss Green with Purple Menace. Open each artwork to see the available material, size, and price.',
      },
    ],
    recommendations: [
      {
        label: 'Fireglass — 1934 Ford Three-Window',
        to: '/products/fireglass-1934-ford-three-window',
      },
      {
        label: 'Willys Wild — 1941 Willys Coupe',
        to: '/products/willys-wild-1941-willys-coupe',
      },
      {
        label: 'Boss Green — 1970 Ford Mustang Boss',
        to: '/products/boss-green-1970-ford-mustang-boss',
      },
      {
        label: 'Purple Menace — 1970 Dodge Challenger',
        to: '/products/purple-menace-1970-dodge-challenger',
      },
    ],
  },
  'the-veil-between-worlds': {
    title: 'Choosing cosmic gothic wall art',
    introduction:
      'Start with the subject you want to live with. For an architectural focal point, look for strong vertical lines. For a quieter display, look for a composition with more open sky and a smaller central figure.',
    tips: [
      {
        heading: 'Metal or canvas?',
        text: 'Metal gives the luminous highlights and dark architectural lines a crisp presentation. Matte canvas softens the contrast with a textured, dimensional finish. Both formats are made to order; check each artwork for its available variants.',
      },
      {
        heading: 'Which portrait size?',
        text: 'Tape out 12 × 16, 18 × 24, or 24 × 32 inches on your wall before ordering. Smaller prints work in narrow spaces. Larger prints give distant details, such as cathedral spires, more room to read.',
      },
    ],
    recommendations: [
      {
        label: 'Cathedral of the Void — Gothic spires and a spiraling sky',
        to: '/products/cathedral-of-the-void',
      },
      {
        label: 'Ascension Beyond Time — A lone figure against an open sky',
        to: '/products/ascension-beyond-time',
      },
      {
        label: 'Keeper of the Threshold — A guardian beneath a cosmic portal',
        to: '/products/keeper-of-the-threshold',
      },
    ],
  },
};

export function CollectionBuyingGuide({
  handle,
  products,
}: {
  handle: string;
  products: CollectionPageData['products'];
}) {
  const guide = COLLECTION_BUYING_GUIDES[handle];
  if (!guide) return null;
  const isVeil = handle === 'the-veil-between-worlds';
  const recommendations = isVeil
    ? guide.recommendations.filter(({to}) =>
        products.some(
          (product) =>
            product.availableForSale && `/products/${product.handle}` === to,
        ),
      )
    : guide.recommendations;

  return (
    <section
      className="collection-buying-guide"
      aria-labelledby="collection-buying-guide-title"
    >
      <div className="container container--wide collection-buying-guide__inner">
        <div className="collection-buying-guide__intro">
          <p className="collection-buying-guide__eyebrow">Artwork buying guide</p>
          <h2 id="collection-buying-guide-title">{guide.title}</h2>
          <p>{guide.introduction}</p>
        </div>
        <div className="collection-buying-guide__details">
          <div className="collection-buying-guide__tips">
            {guide.tips.map((tip) => (
              <div className="collection-buying-guide__tip" key={tip.heading}>
                <h3>{tip.heading}</h3>
                <p>{tip.text}</p>
              </div>
            ))}
          </div>
          <div className="collection-buying-guide__links">
            {recommendations.length ? (
              <>
                <h3>Explore individual artworks</h3>
                <ul>
                  {recommendations.map((recommendation) => (
                    <li key={recommendation.to}>
                      <Link to={recommendation.to}>{recommendation.label}</Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <Link
              className="collection-buying-guide__materials-link"
              to={isVeil ? '/materials#compare-formats' : '/materials'}
            >
              Compare metal and canvas finishes
            </Link>
            <p>
              Browse more <Link to="/collections/metal-wall-art">metal wall art</Link>{' '}
              or <Link to="/collections/canvas-art">canvas prints</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
