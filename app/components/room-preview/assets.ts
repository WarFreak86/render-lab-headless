// Reuse the approved optimized assets; Vite emits fingerprinted delivery URLs.
const assets = import.meta.glob(
  '../../../prototypes/room-preview/public/rooms/empty-wall-v2/*.webp',
  {eager: true, query: '?url', import: 'default'},
) as Record<string, string>;

export function roomImage(id: string, width: number) {
  const path = `../../../prototypes/room-preview/public/rooms/empty-wall-v2/${id}-${width}.webp`;
  const image = assets[path];
  if (!image) throw new Error(`Missing room image: ${id}-${width}`);
  return image;
}
