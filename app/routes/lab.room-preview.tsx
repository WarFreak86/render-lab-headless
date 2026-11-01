import {data, useLoaderData, useRevalidator} from 'react-router';
import type {Route} from './+types/lab.room-preview';
import {CatalogPreview} from '~/components/room-preview/RoomPreview';
import {loadRoomCatalog} from '~/lib/room-preview.server';
import {ROOM_PREVIEW_HEADERS} from '~/lib/room-preview-access';
import {roomPreviewSelection} from '~/lib/room-preview-navigation';
import roomStyles from '~/styles/room-preview.css?url';

export const links: Route.LinksFunction = () => [
  {rel: 'stylesheet', href: roomStyles},
];
export const meta: Route.MetaFunction = () => [
  {title: 'Room Preview · Render-Lab'},
  {name: 'robots', content: 'noindex, nofollow, noarchive'},
];
export const headers: Route.HeadersFunction = () => ROOM_PREVIEW_HEADERS;

export async function loader({request, context}: Route.LoaderArgs) {
  const catalog = await loadRoomCatalog(
    request,
    context.storefront,
    import.meta.env.DEV,
    context.env,
  );
  const initialVariant = roomPreviewSelection(request.url, catalog.products[0]);
  if (!initialVariant) {
    throw new Response('Preview selection not found', {
      status: 404,
      headers: ROOM_PREVIEW_HEADERS,
    });
  }
  return data(
    {catalog, initialVariantId: initialVariant.id},
    {headers: ROOM_PREVIEW_HEADERS},
  );
}
export default function RoomPreviewRoute() {
  const {catalog, initialVariantId} = useLoaderData<typeof loader>();
  return (
    <CatalogPreview
      key={initialVariantId}
      catalog={catalog}
      initialVariantId={initialVariantId}
    />
  );
}
export function ErrorBoundary() {
  const revalidator = useRevalidator();
  return (
    <div className="preview-app">
      <header className="header">
        <span className="brand">RENDER–LAB</span>
        <span className="local-note">Room preview</span>
      </header>
      <main className="catalog-message">
        <h1>The artwork catalog is unavailable</h1>
        <p>We could not retrieve current Shopify details. Please try again.</p>
        <button
          className="space-cta"
          onClick={() => void revalidator.revalidate()}
        >
          Retry catalog
        </button>
        <p>
          Room preview · purchases disabled · illustrative room scale
        </p>
      </main>
    </div>
  );
}
