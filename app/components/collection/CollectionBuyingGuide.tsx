import {Link} from 'react-router';
import {COLLECTION_BUYING_GUIDES} from '~/lib/collection-buying-guides';

export function CollectionBuyingGuide({handle}: {handle: string}) {
  const guide = COLLECTION_BUYING_GUIDES[handle];
  if (!guide) return null;

  return (
    <section
      className="collection-buying-guide"
      aria-labelledby="collection-buying-guide-title"
    >
      <div className="container container--wide collection-buying-guide__inner">
        <div className="collection-buying-guide__intro">
          <p className="collection-buying-guide__eyebrow">
            Artwork buying guide
          </p>
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
            <h3>
              {guide.recommendationsHeading ?? 'Explore individual artworks'}
            </h3>
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
