import {getRouteErrorPresentation} from '~/lib/errors';

describe('route error presentation', () => {
  it('provides a restrained branded 404 without exposing route internals', () => {
    const presentation = getRouteErrorPresentation(404);
    expect(presentation).toMatchObject({
      eyebrow: 'Archive 404',
      title: 'Nothing lives here.',
    });
    expect(presentation.message).not.toMatch(/stack|hydrogen|shopify/i);
  });

  it('provides a safe fallback for server errors', () => {
    expect(getRouteErrorPresentation(500)).toMatchObject({
      eyebrow: 'Error 500',
      title: 'The gallery paused.',
    });
  });
});
