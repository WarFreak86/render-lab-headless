export function getRouteErrorPresentation(status: number) {
  if (status === 404) {
    return {
      eyebrow: 'Archive 404',
      title: 'Nothing lives here.',
      message:
        'The page may have moved, or the work may no longer be in the collection.',
    } as const;
  }

  return {
    eyebrow: `Error ${status}`,
    title: 'The gallery paused.',
    message:
      'Something interrupted this view. Return home or continue browsing the collection.',
  } as const;
}
