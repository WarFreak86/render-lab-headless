import type {CSSProperties} from 'react';
import type {Material} from './catalog';
import {placement, type RoomConfig} from './rooms';

// Reference construction depths, not a claim about the exact fulfillment SKU.
export const PRINT_DEPTH_MM = {Metal: 3, Canvas: 20} as const;
type CompositeStyle = CSSProperties & Record<`--${string}`, string | number>;

export function compositeTreatment(
  room: RoomConfig,
  size: string,
  material: Material,
  image: string,
) {
  const bounds = placement(room, size);
  const t = room.treatment;
  // Normalize by the selected print width: physical depth stays constant across
  // print sizes, while container units scale all treatments with the viewport.
  const mm = bounds.width / (bounds.widthInches * 25.4);
  const depth = PRINT_DEPTH_MM[material];
  const standOff = material === 'Metal' ? 8 : 4;
  const distance = (depth + standOff) * mm;
  const cqw = (value: number) => `${(value * 100).toFixed(6)}cqw`;
  const shadowColor = (alpha: number) => `rgb(${t.shadow.color} / ${alpha})`;
  const tightBlur = mm * (material === 'Metal' ? 2 : 3);
  const castBlur = distance * t.shadow.softness;
  const style: CompositeStyle = {
    '--plane-transform': `perspective(100cqw) rotateX(${t.perspective.pitch}deg) rotateY(${t.perspective.yaw}deg) rotateZ(${t.perspective.roll}deg)`,
    '--contact-shadow': `0 ${cqw(mm * 0.5)} ${cqw(tightBlur)} ${cqw(mm * 0.3)} ${shadowColor(t.shadow.contactOpacity)}, ${cqw(distance * t.light.directionX)} ${cqw(distance * t.light.directionY)} ${cqw(castBlur)} ${cqw(-mm)} ${shadowColor(t.shadow.castOpacity)}`,
    '--edge-x': cqw(mm * depth * t.edge.x),
    '--edge-y': cqw(mm * depth * t.edge.y),
    '--metal-edge-color': t.edge.metalColor,
    '--artwork-image': `url("${image}")`,
    '--reflection-opacity': material === 'Metal' ? t.light.reflection : 0,
    '--room-warmth': t.light.warmth,
    '--room-shade': material === 'Metal' ? 0.022 : 0.028,
  };
  return {
    style,
    depthMm: depth,
    edgeX: mm * depth * t.edge.x,
    edgeY: mm * depth * t.edge.y,
  };
}
