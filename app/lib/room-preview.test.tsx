import {fireEvent, render, screen} from '@testing-library/react';
import {CacheNone} from '@shopify/hydrogen';
import fixture from '../../prototypes/room-preview/fixtures/live-product.json';
import {CatalogPreview} from '~/components/room-preview/RoomPreview';
import {rooms, placement} from '~/components/room-preview/rooms';
import {
  loadRoomCatalog,
  mapRoomProduct,
  ROOM_PREVIEW_QUERY,
} from './room-preview.server';
import {
  isRoomPreviewPath,
  ROOM_PREVIEW_HEADERS,
} from './room-preview-access';
import {guardRoomPreview} from './room-preview-access.server';
import {loader as rootLoader, shouldRevalidate} from '~/root';
import server from '../../server';

describe('isolated Hydrogen room preview', () => {
  it('guards page and data requests before any Shopify or session access', async () => {
    for (const suffix of ['', '/', '.data', '/.data']) {
      expect(isRoomPreviewPath(`/lab/room-preview${suffix}`)).toBe(true);
      const response = await server.fetch(
        new Request(`https://render-lab.org/lab/room-preview${suffix}`),
        {} as Env,
        {} as never,
      );
      expect(response.status).toBe(404);
      expect(response.headers.get('X-Robots-Tag')).toBe(
        ROOM_PREVIEW_HEADERS['X-Robots-Tag'],
      );
    }
    expect(isRoomPreviewPath('/products/the-sky-unbound')).toBe(false);
    expect(isRoomPreviewPath('/lab/room-preview-other')).toBe(false);
    for (const [url, dev] of [
      ['http://localhost:4321/lab/room-preview', false],
      ['https://preview.example.com/lab/room-preview', true],
    ] as const) {
      expect(() => guardRoomPreview(new Request(url), dev)).toThrow();
    }
    expect(() =>
      guardRoomPreview(
        new Request('http://localhost:4321/lab/room-preview', {method: 'POST'}),
        true,
      ),
    ).toThrow();
  });
  it('uses the existing Hydrogen client and exact live variant fields without cache', async () => {
    const query = vi.fn().mockResolvedValue({product: fixture.product});
    const storefront = {query, CacheNone};
    const catalog = await loadRoomCatalog(
      new Request('http://localhost:4321/lab/room-preview'),
      storefront as never,
      true,
    );
    expect(query).toHaveBeenCalledWith(ROOM_PREVIEW_QUERY, {
      variables: {handle: 'the-sky-unbound'},
      cache: CacheNone(),
    });
    expect(ROOM_PREVIEW_QUERY).not.toMatch(/mutation|cart|customer/i);
    expect(catalog.products).toHaveLength(1);
    expect(catalog.products[0].variants).toHaveLength(6);
    for (const variant of fixture.product.variants.nodes) {
      expect(
        catalog.products[0].variants.find((v) => v.id === variant.id),
      ).toMatchObject({
        price: variant.price.amount,
        currencyCode: variant.price.currencyCode,
        availableForSale: variant.availableForSale,
      });
    }
  });
  it('does not query Shopify for denied requests and sanitizes upstream failures', async () => {
    const query = vi
      .fn()
      .mockRejectedValue(new Error('private upstream diagnostics'));
    const storefront = {query, CacheNone};
    await expect(
      loadRoomCatalog(
        new Request('https://render-lab.org/lab/room-preview'),
        storefront as never,
        true,
      ),
    ).rejects.toMatchObject({status: 404});
    expect(query).not.toHaveBeenCalled();
    try {
      await loadRoomCatalog(
        new Request('http://localhost/lab/room-preview'),
        storefront as never,
        true,
      );
    } catch (response) {
      expect((response as Response).status).toBe(502);
      expect(await (response as Response).text()).not.toContain('private');
    }
    expect(() => mapRoomProduct(null)).toThrow();
    const invalid = structuredClone(fixture.product);
    invalid.variants.pageInfo.hasNextPage = true;
    expect(() => mapRoomProduct(invalid)).toThrow();
  });
  it('skips root menu, cart, account and analytics data for the lab', async () => {
    expect(
      await rootLoader({
        request: new Request('http://localhost:4321/lab/room-preview'),
        context: {},
      } as never),
    ).toBeNull();
    expect(
      shouldRevalidate({
        formMethod: 'GET',
        currentUrl: new URL('http://localhost/products/art'),
        nextUrl: new URL('http://localhost/lab/room-preview'),
        defaultShouldRevalidate: false,
      } as never),
    ).toBe(true);
    expect(
      shouldRevalidate({
        formMethod: 'GET',
        currentUrl: new URL('http://localhost/lab/room-preview'),
        nextUrl: new URL('http://localhost/products/art'),
        defaultShouldRevalidate: false,
      } as never),
    ).toBe(true);
  });
  it('preserves the approved room placements, proportional sizes and portrait ratio', () => {
    expect(rooms.map((room) => room.name)).toEqual([
      'Modern',
      'Loft',
      'Office',
    ]);
    for (const room of rooms) {
      const p = ['12x16', '18x24', '24x32'].map((size) =>
        placement(room, size),
      );
      expect(p[2].width / p[0].width).toBeCloseTo(2);
      for (const art of p) {
        expect(art.x + art.width / 2).toBeCloseTo(room.artwork.x);
        expect((art.width * room.aspectRatio) / art.height).toBeCloseTo(0.75);
      }
    }
  });
  it('updates variant price, availability, material and room while commerce stays disabled', () => {
    const product = mapRoomProduct(fixture.product);
    render(
      <CatalogPreview
        catalog={{
          source: 'Shopify Storefront API',
          fetchedAt: fixture.fetchedAt,
          products: [product],
        }}
      />,
    );
    expect(screen.getByTestId('price')).toHaveTextContent('$109.00');
    fireEvent.click(screen.getByRole('button', {name: 'Canvas'}));
    fireEvent.click(screen.getByRole('button', {name: '24 × 32'}));
    expect(screen.getByTestId('price')).toHaveTextContent('$119.00');
    expect(screen.getByTestId('availability')).toHaveTextContent(
      'Available to order',
    );
    fireEvent.click(screen.getByRole('button', {name: 'Office'}));
    expect(document.querySelector('.room-stage')).toHaveAttribute(
      'data-room',
      'office',
    );
    expect(document.querySelector('.print-face img')).toHaveAttribute(
      'src',
      product.image,
    );
    expect(document.querySelector('.print-weave')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Add to cart/})).toBeDisabled();
    expect(
      screen.getByText(/Room proportions are illustrative/),
    ).toBeInTheDocument();
  });
});
