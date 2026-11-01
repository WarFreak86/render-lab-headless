export const ROOM_PREVIEW_PATH = '/lab/room-preview';
export const ROOM_PREVIEW_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'no-store',
} as const;

export function isRoomPreviewPath(pathname: string) {
  try {
    return /^\/lab\/room-preview(?:\/|\.data|\/\.data)?$/i.test(
      decodeURIComponent(pathname),
    );
  } catch {
    return false;
  }
}
