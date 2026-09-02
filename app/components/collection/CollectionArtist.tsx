import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CollectionArtistData} from '~/lib/collection';

export function CollectionArtist({artist}: {artist: CollectionArtistData}) {
  const profileUrl = artist.profileUrl ?? `/artists/${artist.handle}`;
  const isInternalProfile = profileUrl.startsWith('/');

  return (
    <section
      aria-labelledby="collection-artist-heading"
      className="collection-artist collection-artist--story"
    >
      <div className="container container--wide collection-artist__inner">
        <p className="collection-artist__label">Artist behind the series</p>
        <div
          className={`collection-artist__layout ${
            artist.image ? '' : 'collection-artist__layout--text-only'
          }`.trim()}
        >
          {artist.image ? (
            <div className="collection-artist__media">
              <Image
                alt={artist.image.altText}
                aspectRatio="4/5"
                data={artist.image}
                sizes="(min-width: 64rem) 24rem, (min-width: 48rem) 34vw, 92vw"
              />
            </div>
          ) : null}
          <div className="collection-artist__copy">
            <h2 id="collection-artist-heading">{artist.name}</h2>
            {artist.biography ? <p>{artist.biography}</p> : null}
            {isInternalProfile ? (
              <Link className="collection-artist__link" to={profileUrl}>
                View artist profile
                <ArrowIcon />
              </Link>
            ) : (
              <a className="collection-artist__link" href={profileUrl}>
                View artist profile
                <ArrowIcon />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 12">
      <path d="M0 6h46M40 1l6 5-6 5" />
    </svg>
  );
}
