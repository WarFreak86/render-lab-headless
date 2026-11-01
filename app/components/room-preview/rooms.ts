import {roomImage} from './assets';
export interface RoomConfig {
  id: string;
  name: string;
  description: string;
  image: string;
  imageSrcSet?: string;
  thumbnail?: string;
  imageWidth?: number;
  imageHeight?: number;
  assetStatus: 'temporary' | 'final';
  // Normalized 0..1 image coordinates. The image and all overlays share one aspect ratio.
  aspectRatio: number;
  wall: {x: number; y: number; width: number; height: number};
  artwork: {x: number; y: number; width: number; height: number};
  scale: {
    mode: 'proportional';
    referenceWidthInches: number;
    referenceHeightInches: number;
  };
  treatment: {
    perspective: {yaw: number; pitch: number; roll: number};
    light: {
      directionX: number;
      directionY: number;
      warmth: number;
      reflection: number;
    };
    shadow: {
      color: string;
      contactOpacity: number;
      castOpacity: number;
      softness: number;
    };
    edge: {x: number; y: number; metalColor: string};
  };
}
function roomFiles(id: string) {
  return {
    image: roomImage(id, 1024),
    imageSrcSet: `${roomImage(id, 640)} 640w, ${roomImage(id, 1024)} 1024w, ${roomImage(id, 1672)} 1672w`,
    thumbnail: roomImage(id, 320),
    imageWidth: 1672,
    imageHeight: 941,
  };
}
const photoAspect = 1672 / 941;
export const rooms: RoomConfig[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Warm plaster · soft daylight',
    ...roomFiles('modern'),
    assetStatus: 'final',
    aspectRatio: photoAspect,
    wall: {x: 0.3, y: 0.055, width: 0.49, height: 0.46},
    artwork: {
      x: 0.59,
      y: 0.29,
      width: 0.17,
      height: (0.17 * photoAspect * 4) / 3,
    },
    scale: {
      mode: 'proportional',
      referenceWidthInches: 24,
      referenceHeightInches: 32,
    },
    treatment: {
      perspective: {yaw: -1.1, pitch: 0.12, roll: -0.08},
      light: {
        directionX: 0.72,
        directionY: 0.88,
        warmth: 0.024,
        reflection: 0.055,
      },
      shadow: {
        color: '35 23 11',
        contactOpacity: 0.3,
        castOpacity: 0.25,
        softness: 0.65,
      },
      edge: {x: 0.42, y: 0.24, metalColor: '#8b8c86'},
    },
  },
  {
    id: 'loft',
    name: 'Loft',
    description: 'Industrial texture · afternoon light',
    ...roomFiles('loft'),
    assetStatus: 'final',
    aspectRatio: photoAspect,
    wall: {x: 0.32, y: 0.04, width: 0.5, height: 0.51},
    artwork: {
      x: 0.61,
      y: 0.29,
      width: 0.17,
      height: (0.17 * photoAspect * 4) / 3,
    },
    scale: {
      mode: 'proportional',
      referenceWidthInches: 24,
      referenceHeightInches: 32,
    },
    treatment: {
      perspective: {yaw: 0.85, pitch: 0.18, roll: 0.04},
      light: {
        directionX: 0.78,
        directionY: 0.82,
        warmth: 0.018,
        reflection: 0.042,
      },
      shadow: {
        color: '12 9 5',
        contactOpacity: 0.36,
        castOpacity: 0.32,
        softness: 0.82,
      },
      edge: {x: 0.36, y: 0.28, metalColor: '#77766d'},
    },
  },
  {
    id: 'office',
    name: 'Office',
    description: 'Walnut details · considered workspace',
    ...roomFiles('office'),
    assetStatus: 'final',
    aspectRatio: photoAspect,
    wall: {x: 0.25, y: 0.035, width: 0.59, height: 0.46},
    artwork: {
      x: 0.55,
      y: 0.275,
      width: 0.165,
      height: (0.165 * photoAspect * 4) / 3,
    },
    scale: {
      mode: 'proportional',
      referenceWidthInches: 24,
      referenceHeightInches: 32,
    },
    treatment: {
      perspective: {yaw: -0.35, pitch: -0.12, roll: -0.02},
      light: {
        directionX: 0.62,
        directionY: 0.9,
        warmth: 0.016,
        reflection: 0.036,
      },
      shadow: {
        color: '37 26 13',
        contactOpacity: 0.27,
        castOpacity: 0.22,
        softness: 0.6,
      },
      edge: {x: 0.32, y: 0.22, metalColor: '#96958b'},
    },
  },
];

export function placement(room: RoomConfig, size: string) {
  const match = /^(12x16|18x24|24x32)$/.exec(size);
  if (!match) throw new RangeError('Unsupported portrait size');
  const [width, height] = size.split('x').map(Number);
  const reference = room.artwork;
  // Uniform fit preserves print proportions if a future slot has a different shape.
  const fit = Math.min(
    reference.width / (room.scale.referenceWidthInches * 0.0254),
    reference.height /
      (room.scale.referenceHeightInches * 0.0254 * room.aspectRatio),
  );
  const w = width * 0.0254 * fit,
    h = height * 0.0254 * fit * room.aspectRatio;
  return {
    x: reference.x - w / 2,
    y: reference.y - h / 2,
    width: w,
    height: h,
    widthInches: width,
    heightInches: height,
  };
}
