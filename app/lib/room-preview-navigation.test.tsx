import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import fixture from '../../prototypes/room-preview/fixtures/live-product.json';
import {mapRoomProduct} from './room-preview.server';
import {
  roomPreviewHref,
  roomPreviewSelection,
  roomProductHref,
} from './room-preview-navigation';
import {ROOM_PREVIEW_HEADERS} from './room-preview-access';
import {isLocalRoomPreview} from './room-preview-access.server';
import {CatalogPreview} from '~/components/room-preview/RoomPreview';
import {RoomPreviewAction} from '~/components/product/RoomPreviewAction';
import {loader} from '~/routes/lab.room-preview';
import {loader as productLoader} from '~/routes/products.$handle';
import type {ProductFragment} from 'storefrontapi.generated';

const art = mapRoomProduct(fixture.product);
const catalog = {
  source: 'Shopify Storefront API' as const,
  fetchedAt: fixture.fetchedAt,
  products: [art],
};

describe('product to room navigation', () => {
  it('round-trips every Shopify variant with exact option spelling and artwork', () => {
    for (const original of fixture.product.variants.nodes) {
      const href = roomPreviewHref(art.handle, original)!;
      const url = new URL(href, 'http://localhost:3000');
      expect(url.pathname).toBe('/lab/room-preview');
      expect(url.searchParams.get('product')).toBe(art.handle);
      for (const option of original.selectedOptions) {
        expect(url.searchParams.get(option.name)).toBe(option.value);
      }
      const selected = roomPreviewSelection(url.href, art)!;
      expect(selected.id).toBe(original.id);
      const back = new URL(roomProductHref(art, selected), url);
      expect(back.pathname).toBe(`/products/${art.handle}`);
      expect(back.searchParams.get('variant')).toBe(
        original.id.split('/').at(-1),
      );
      for (const option of original.selectedOptions) {
        expect(back.searchParams.get(option.name)).toBe(option.value);
      }
    }
  });
  it('rejects other artwork and unknown variants instead of silently changing a selection', () => {
    expect(
      roomPreviewHref('other-art', fixture.product.variants.nodes[0]),
    ).toBeUndefined();
    expect(
      roomPreviewSelection(
        'http://localhost/lab/room-preview?product=other-art',
        art,
      ),
    ).toBeUndefined();
    for (const variant of [
      '',
      '999',
      '//evil.example',
      'gid://shopify/ProductVariant/1',
    ]) {
      expect(
        roomPreviewSelection(
          `http://localhost/lab/room-preview?variant=${encodeURIComponent(variant)}`,
          art,
        ),
      ).toBeUndefined();
    }
  });
  it('only allows the entry on local development hosts', () => {
    for (const host of [
      'render-lab.org',
      'www.render-lab.org',
      'preview.example.com',
      'localhost.evil.example',
    ]) {
      expect(
        isLocalRoomPreview(`https://${host}/products/${art.handle}`, true),
      ).toBe(false);
    }
    expect(
      isLocalRoomPreview(
        'http://localhost:3000/products/the-sky-unbound',
        false,
      ),
    ).toBe(false);
    expect(
      isLocalRoomPreview(
        'http://localhost:3000/products/the-sky-unbound',
        true,
      ),
    ).toBe(true);
  });
  it('disables the product entry in production builds and on nonlocal development hosts', async () => {
    try {
      for (const [development, host, expected] of [
        [false, 'localhost', false],
        [false, 'render-lab.org', false],
        [true, 'render-lab.org', false],
        [true, 'localhost', true],
      ] as const) {
        vi.stubEnv('DEV', development);
        const result = await productLoader({
          request: new Request(`http://${host}/products/${art.handle}`),
          params: {handle: art.handle},
          context: {
            storefront: {
              query: vi.fn().mockResolvedValue({product: fixture.product}),
              CacheShort: vi.fn(),
            },
          },
        } as never);
        expect(result.roomPreviewEnabled).toBe(expected);
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it('updates the product action when the selected variant changes and hides it for other products', () => {
    const renderAction = (handle: string, index: number) => (
      <MemoryRouter>
        <RoomPreviewAction
          product={{handle}}
          selectedVariant={
            fixture.product.variants.nodes[
              index
            ] as ProductFragment['selectedOrFirstAvailableVariant']
          }
        />
      </MemoryRouter>
    );
    const {rerender} = render(renderAction(art.handle, 0));
    expect(screen.getByRole('link', {name: 'View in a Room'})).toHaveAttribute(
      'href',
      roomPreviewHref(art.handle, fixture.product.variants.nodes[0]),
    );
    rerender(renderAction(art.handle, 5));
    expect(screen.getByRole('link', {name: 'View in a Room'})).toHaveAttribute(
      'href',
      roomPreviewHref(art.handle, fixture.product.variants.nodes[5]),
    );
    rerender(renderAction('other-art', 5));
    expect(
      screen.queryByRole('link', {name: 'View in a Room'}),
    ).not.toBeInTheDocument();
  });
  it('initializes the room from the entry variant and returns the current room selection', () => {
    const initial = art.variants.find(
      (v) => v.material === 'Canvas' && v.size === '24x32',
    )!;
    render(<CatalogPreview catalog={catalog} initialVariantId={initial.id} />);
    expect(screen.getByRole('button', {name: 'Canvas'})).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', {name: '24 × 32'})).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('link', {name: 'Back to Product'})).toHaveAttribute(
      'href',
      roomProductHref(art, initial),
    );
    fireEvent.click(screen.getByRole('button', {name: 'Metal'}));
    fireEvent.click(screen.getByRole('button', {name: '12 × 16'}));
    const next = art.variants.find(
      (v) => v.material === 'Metal' && v.size === '12x16',
    )!;
    for (const room of ['Modern', 'Loft', 'Office']) {
      fireEvent.click(screen.getByRole('button', {name: room}));
      expect(
        screen.getByRole('link', {name: 'Back to Product'}),
      ).toHaveAttribute('href', roomProductHref(art, next));
      expect(document.querySelector('.mounted-art')).toHaveAttribute(
        'data-artwork',
        art.handle,
      );
    }
    expect(screen.getByRole('button', {name: /Add to cart/})).toBeDisabled();
  });
  it('validates route selections and retains noindex/no-store on invalid selection responses', async () => {
    const query = vi.fn().mockResolvedValue({product: fixture.product});
    const args = (search: string) =>
      ({
        request: new Request(`http://localhost:3000/lab/room-preview${search}`),
        context: {storefront: {query, CacheNone: () => ({mode: 'no-store'})}},
      }) as never;
    const result = await loader(
      args(
        `?product=${art.handle}&variant=${art.variants[5].id.split('/').at(-1)}`,
      ),
    );
    expect(result.data.initialVariantId).toBe(art.variants[5].id);
    await expect(loader(args('?variant=999'))).rejects.toMatchObject({
      status: 404,
    });
    try {
      await loader(args('?product=other-art'));
    } catch (response) {
      for (const [name, value] of Object.entries(ROOM_PREVIEW_HEADERS)) {
        expect((response as Response).headers.get(name)).toBe(value);
      }
    }
  });
});
