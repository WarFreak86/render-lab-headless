import handleRequest from '~/entry.server';

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  ServerRouter: () => null,
}));

vi.mock('react-dom/server', () => ({
  renderToReadableStream: async () => new ReadableStream(),
}));

it('allows the supplier hoodie diagram only as an image', async () => {
  const response = await handleRequest(
    new Request('https://render-lab.org/products/fighter-jet-graphic-hoodie'),
    200,
    new Headers(),
    {} as Parameters<typeof handleRequest>[3],
    {env: {}} as Parameters<typeof handleRequest>[4],
  );
  const directives = new Map(
    response.headers.get('Content-Security-Policy')?.split(/;\s*/).map((directive) => {
      const [name, ...sources] = directive.split(/\s+/);
      return [name, sources] as const;
    }),
  );
  const diagram = 'https://static.subliminator.com/shops/images/size-guides/hoodie.png';
  const fallbackImageSources = directives
    .get('default-src')
    ?.filter((source) => !source.startsWith("'nonce-"));

  expect(directives.get('img-src')).toEqual(
    expect.arrayContaining([...(fallbackImageSources ?? []), diagram]),
  );
  expect(
    directives.get('img-src')?.filter((source) => source.includes('subliminator')),
  ).toEqual([diagram]);
  expect(
    [...directives].filter(
      ([name, sources]) =>
        name !== 'img-src' && sources.some((source) => source.includes('subliminator')),
    ),
  ).toEqual([]);
});
