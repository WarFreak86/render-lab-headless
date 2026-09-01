import {Image} from '@shopify/hydrogen';
import {Form, Link, useLoaderData} from 'react-router';
import type {Route} from './+types/artists._index';
import {getProductionUrl} from '~/lib/config';

export const meta: Route.MetaFunction = () => {
  const canonical = getProductionUrl('/artists');
  return [
    {title: 'Artists | Render-Lab'},
    {
      name: 'description',
      content: 'Browse Render-Lab artists and discover their collections.',
    },
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Artists | Render-Lab'},
    {
      property: 'og:description',
      content: 'Browse Render-Lab artists and discover their collections.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: canonical},
  ];
};

export async function loader({context, request}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim();
  const normalizedQuery = query.toLocaleLowerCase();

  const {metaobjects} = await context.storefront.query(ARTISTS_QUERY, {
    cache: context.storefront.CacheLong(),
  });

  const artists = metaobjects.nodes
    .map((artist) => {
      const photoReference = artist.photo?.reference;
      return {
        id: artist.id,
        handle: artist.handle,
        name: artist.name?.value?.trim() || artist.handle,
        biography: artist.biography?.value?.trim() || '',
        image:
          photoReference && 'image' in photoReference
            ? photoReference.image
            : null,
      };
    })
    .filter((artist) =>
      normalizedQuery
        ? `${artist.name} ${artist.biography}`
            .toLocaleLowerCase()
            .includes(normalizedQuery)
        : true,
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return {artists, query};
}

export default function ArtistsIndexRoute() {
  const {artists, query} = useLoaderData<typeof loader>();

  return (
    <div className="artists-page">
      <header className="artists-page__header">
        <p className="artists-page__eyebrow">Render-Lab Artists</p>
        <h1>Shop by artist</h1>
        <p>
          Discover the artists behind each collection, then browse the work tied
          to their individual profile.
        </p>
      </header>

      <Form className="artists-search" method="get" role="search">
        <label className="sr-only" htmlFor="artist-search">
          Search artists
        </label>
        <input
          defaultValue={query}
          id="artist-search"
          name="q"
          placeholder="Search artists"
          type="search"
        />
        <button className="button button--primary" type="submit">
          Search
        </button>
        {query ? (
          <Link className="artists-search__clear" to="/artists">
            Clear
          </Link>
        ) : null}
      </Form>

      {artists.length ? (
        <div className="artists-grid">
          {artists.map((artist) => (
            <Link
              className="artist-card"
              key={artist.id}
              prefetch="intent"
              to={`/artists/${artist.handle}`}
            >
              <div className="artist-card__media">
                {artist.image ? (
                  <Image
                    alt={artist.image.altText || `${artist.name} portrait`}
                    aspectRatio="4/5"
                    data={artist.image}
                    loading="lazy"
                    sizes="(min-width: 64rem) 24vw, (min-width: 40rem) 45vw, 92vw"
                  />
                ) : (
                  <div className="artist-card__placeholder" aria-hidden="true" />
                )}
              </div>
              <div className="artist-card__copy">
                <p className="artist-card__label">Artist</p>
                <h2>{artist.name}</h2>
                {artist.biography ? <p>{artist.biography}</p> : null}
                <span>View artist profile →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="artists-empty">
          <h2>No artists found</h2>
          <p>Try another name or browse the complete artist directory.</p>
          <Link className="button button--secondary" to="/artists">
            View all artists
          </Link>
        </div>
      )}
    </div>
  );
}

const ARTISTS_QUERY = `#graphql
  query ArtistsDirectory($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    metaobjects(type: "artist", first: 100) {
      nodes {
        id
        handle
        name: field(key: "name") { value }
        biography: field(key: "bio") { value }
        photo: field(key: "profile_image") {
          reference {
            ... on MediaImage {
              image {
                id
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
` as const;
