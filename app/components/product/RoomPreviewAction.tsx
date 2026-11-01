import {Link} from 'react-router';
import type {ProductFragment} from 'storefrontapi.generated';
import {roomPreviewHref} from '~/lib/room-preview-navigation';

export function RoomPreviewAction({
  product,
  selectedVariant,
  pending = false,
}: {
  pending?: boolean;
  product: {handle: string};
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const href =
    selectedVariant && roomPreviewHref(product.handle, selectedVariant);
  if (!href) return null;
  return (
    <Link
      className="product-room-preview"
      to={href}
      aria-disabled={pending || undefined}
      tabIndex={pending ? -1 : undefined}
      onClick={(event) => {
        if (pending) event.preventDefault();
      }}
    >
      <span aria-hidden="true">▧</span>
      View in a Room
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
