import {Image} from '@shopify/hydrogen';
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/artists.$handle';
import {getProductionUrl} from '~/lib/config';

export const meta: Route.MetaFunction = ({data}) => {
  const artist = data?.artist;
  const title = `${artist?.name ?? 'Artist'} | Render-Lab`;
  const description =
    artist?.biography || 'Discover this Render-Lab artist and their collections.';
  const canonical = getProductionUrl(`/artists/${artist?.handle ?? ''}`);
  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'profile'},
    {property: 'og:url', content: canonical},
    ...(artist?.image
      ? [
          {property: 'og:image', content: artist.image.url},
          {
            property: 'og:image:alt',
            content: artist.image.altText || artist.name,
          },
        ]
      : []),
  ];
};

export async function loader({context, params}: Route.LoaderArgs) {
  const handle = params.handle;
  if (!handle) throw new Response('Artist not found', {status: 404});

  const {metaobject, collections} = await context.storefront.query(
    ARTIST_PROFILE_QUERY,
    {
      variables: {handle: {type: 'artist', handle}},
      cache: context.storefront.CacheLong(),
    },
  );

  if (!metaobject) throw new Response(`Artist ${handle} not found`, {status: 404});

  const photoReference = metaobject.photo?.reference;
  const artist = {
    id: metaobject.id,
    handle: metaobject.handle,
    name: metaobject.name?.value?.trim() || metaobject.handle,
    biography: metaobject.biography?.value?.trim() || '',
    image:
      photoReference && 'image' in photoReference ? photoReference.image : null,
  };

  const artistCollections = collections.nodes
    .filter((collection) => {
      const reference = collection.artist?.reference;
      return reference && 'id' in reference && reference.id === artist.id;
    })
    .map((collection) => ({
      id: collection.id,
      handle: collection.handle,
      title: collection.title,
      description: collection.description,
      image: collection.image,
    }));

  return {artist, collections: artistCollections};
}

export default function ArtistProfileRoute() {
  const {artist, collections} = useLoaderData<typeof loader>();

  return (
    <div className="artist-profile">
      <Link className="artist-profile__back" to="/artists">
        ← All artists
      </Link>

      <section className="artist-profile__hero">
        <div className="artist-profile__media">
          {artist.image ? (
            <Image
              alt={artist.image.altText || `${artist.name} portrait`}
              aspectRatio="4/5"
              data={artist.image}
              sizes="(min-width: 64rem) 28rem, 92vw"
            />
          ) : (
            <div className="artist-profile__placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="artist-profile__copy">
          <p className="artist-profile__eyebrow">Artist</p>
          <h1>{artist.name}</h1>
          {artist.biography ? <p>{artist.biography}</p> : null}
        </div>
      </section>

      <section className="artist-profile__collections" aria-labelledby="artist-work-heading">
        <div className="artist-profile__section-heading">
          <p>Collections</p>
          <h2 id="artist-work-heading">Work by {artist.name}</h2>
        </div>

        {collections.length ? (
          <div className="artist-collections-grid">
            {collections.map((collection) => (
              <Link
                className="artist-collection-card"
                key={collection.id}
                prefetch="intent"
                to={`/collections/${collection.handle}`}
              >
                <div className="artist-collection-card__media">
                  {collection.image ? (
                    <Image
                      alt={collection.image.altText || collection.title}
                      aspectRatio="16/10"
                      data={collection.image}
                      loading="lazy"
                      sizes="(min-width: 64rem) 31vw, (min-width: 40rem) 46vw, 92vw"
                    />
                  ) : (
                    <div className="artist-collection-card__placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="artist-collection-card__copy">
                  <h3>{collection.title}</h3>
                  {collection.description ? <p>{collection.description}</p> : null}
                  <span>Browse collection →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="artist-profile__empty">No published collections are linked to this artist yet.</p>
        )}
      </section>
    </div>
  );
}

const ARTIST_PROFILE_QUERY = `#graphql
  query ArtistProfile(
    $handle: MetaobjectHandleInput!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    metaobject(handle: $handle) {
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
    collections(first: 100) {
      nodes {
        id
        handle
        title
        description
        image {
          id
          url
          altText
          width
          height
        }
        artist: metafield(namespace: "custom", key: "artist") {
          reference {
            ... on Metaobject { id }
          }
        }
      }
    }
  }
` as const;
