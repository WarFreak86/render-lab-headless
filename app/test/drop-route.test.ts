import {loader} from '~/routes/drops.$handle';

function loaderArgs(handle: string, product: unknown) {
  const query = vi.fn().mockResolvedValue({product});
  return {
    context: {storefront: {query}},
    params: {handle},
    request: new Request(`https://render-lab.org/drops/${handle}`),
    query,
  };
}

describe('drop route loader', () => {
  it('loads the configured real Shopify apparel product', async () => {
    const args = loaderArgs('marine-heavyweight-oversized-hoodie', {
      id: 'gid://shopify/Product/1',
      availableForSale: true,
      title: 'Marine Heavyweight Oversized Hoodie',
    });
    const result = await loader(args as any);
    expect(args.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        variables: expect.objectContaining({
          handle: 'marine-heavyweight-oversized-hoodie',
        }),
      }),
    );
    expect(result.product.title).toBe('Marine Heavyweight Oversized Hoodie');
    expect(result.lifecycle).toBe('LIVE');
  });

  it('returns route-level 404 behavior for an unknown drop', async () => {
    const args = loaderArgs('unknown-drop', null);
    await expect(loader(args as any)).rejects.toMatchObject({status: 404});
    expect(args.query).not.toHaveBeenCalled();
  });

  it('returns route-level 404 behavior when the referenced product is missing', async () => {
    const args = loaderArgs('marine-heavyweight-oversized-hoodie', null);
    await expect(loader(args as any)).rejects.toMatchObject({status: 404});
  });
});
