import '~/styles/collection-storytelling.css';
import '~/styles/catalog-cards.css';
import {Link} from 'react-router';
import {CollectionHero} from './CollectionHero';
import {CollectionControls} from './CollectionControls';
import {CollectionProductGrid} from './CollectionProductGrid';
import {CollectionArtist} from './CollectionArtist';
import {
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
      <CollectionBuyingGuide handle={data.handle} />
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
      'The Veil Between Worlds pairs monumental architecture with celestial imagery and lone figures. Consider the mood of the room, the detail you want to emphasize, and the space available for a portrait-format print.',
    tips: [
      {
        heading: 'Metal or canvas?',
        text: 'Metal gives the luminous highlights and dark architectural lines a crisp presentation. Matte canvas softens the contrast with a textured, dimensional finish. Both formats are made to order; check each artwork for its available variants.',
      },
      {
        heading: 'Which portrait size?',
        text: 'Choose from 12 × 16, 18 × 24, or 24 × 32 inch portrait formats. A smaller piece can anchor a narrow wall, while a larger print creates a stronger focal point above furniture. Allow enough clear wall space around the composition.',
      },
      {
        heading: 'Choose by atmosphere',
        text: 'Cathedral of the Void emphasizes gothic architecture and a spiraling sky. Ascension Beyond Time centers on a solitary figure and celestial scale. The Last Radiance leans into luminous, dramatic light. Compare their details before selecting a finish.',
      },
    ],
    recommendations: [
      {
        label: 'Cathedral of the Void',
        to: '/products/cathedral-of-the-void',
      },
      {
        label: 'Ascension Beyond Time',
        to: '/products/ascension-beyond-time',
      },
      {
        label: 'The Last Radiance',
        to: '/products/the-last-radiance',
      },
    ],
  },
};

function CollectionBuyingGuide({handle}: {handle: string}) {
  const guide = COLLECTION_BUYING_GUIDES[handle];
  if (!guide) return null;

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
            <h3>Explore individual artworks</h3>
            <ul>
              {guide.recommendations.map((recommendation) => (
                <li key={recommendation.to}>
                  <Link to={recommendation.to}>{recommendation.label}</Link>
                </li>
              ))}
            </ul>
            <Link
              className="collection-buying-guide__materials-link"
              to="/materials"
            >
              Compare metal and canvas finishes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
