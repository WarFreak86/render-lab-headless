export type DropLifecycleState =
  | 'PRE_LAUNCH'
  | 'LIVE'
  | 'SOLD_OUT'
  | 'ENDED';

export interface DropCollectorBenefit {
  title: string;
  description: string;
}

export interface DropEditionConfig {
  label: string;
  description?: string;
  size?: number;
}

export interface DropSizeGuideConfig {
  title: string;
  notes: ReadonlyArray<string>;
}

export interface DropEditorialConfig {
  handle: string;
  productHandle: string;
  eyebrow?: string;
  statement?: string;
  releaseDate?: string;
  endDate?: string;
  allowPurchaseBeforeRelease?: boolean;
  allowPurchaseAfterEnd?: boolean;
  story?: {
    heading: string;
    body?: string;
    useProductDescription?: boolean;
    mediaIndex?: number;
  };
  collectorBenefits?: ReadonlyArray<DropCollectorBenefit>;
  edition?: DropEditionConfig;
  sizeGuide?: DropSizeGuideConfig;
}

export interface DropLifecycleInput {
  now: Date | number | string;
  releaseDate?: string;
  endDate?: string;
  available: boolean;
}

export interface DropCountdownValue {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Temporary development configuration for the Phase 6 campaign route.
 * Shopify remains the source of product, media, price, variant and inventory data.
 * This object can be replaced by a public Storefront Metaobject query when a
 * merchant-owned drop model is configured.
 */
export const DROP_CONFIGS: ReadonlyArray<DropEditorialConfig> = [
  {
    handle: 'marine-heavyweight-oversized-hoodie',
    productHandle: 'marine-heavyweight-oversized-hoodie',
    eyebrow: 'Limited drop',
    story: {
      heading: 'The garment',
      useProductDescription: true,
      mediaIndex: 1,
    },
    collectorBenefits: [],
  },
];

function toTimestamp(value: Date | number | string | undefined) {
  if (value === undefined) return undefined;
  const timestamp =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function normalizeDropWindow(releaseDate?: string, endDate?: string) {
  const releaseAt = toTimestamp(releaseDate);
  const endAt = toTimestamp(endDate);

  if (
    releaseAt !== undefined &&
    endAt !== undefined &&
    endAt <= releaseAt
  ) {
    return {releaseAt: undefined, endAt: undefined, valid: false} as const;
  }

  return {
    releaseAt,
    endAt,
    valid:
      (releaseDate === undefined || releaseAt !== undefined) &&
      (endDate === undefined || endAt !== undefined),
  } as const;
}

export function resolveDropLifecycle({
  now,
  releaseDate,
  endDate,
  available,
}: DropLifecycleInput): DropLifecycleState {
  const nowAt = toTimestamp(now) ?? Date.now();
  const window = normalizeDropWindow(releaseDate, endDate);

  if (window.endAt !== undefined && nowAt >= window.endAt) return 'ENDED';
  if (window.releaseAt !== undefined && nowAt < window.releaseAt) {
    return 'PRE_LAUNCH';
  }
  return available ? 'LIVE' : 'SOLD_OUT';
}

export function getDropCountdownTarget(
  state: DropLifecycleState,
  releaseDate?: string,
  endDate?: string,
) {
  const window = normalizeDropWindow(releaseDate, endDate);
  if (!window.valid) return undefined;
  if (state === 'PRE_LAUNCH') return window.releaseAt;
  if (state === 'LIVE') return window.endAt;
  return undefined;
}

export function getDropCountdownValue(
  target: Date | number | string,
  now: Date | number | string,
): DropCountdownValue {
  const targetAt = toTimestamp(target);
  const nowAt = toTimestamp(now);
  const totalSeconds = Math.max(
    0,
    Math.floor(((targetAt ?? 0) - (nowAt ?? 0)) / 1000),
  );

  return {
    totalSeconds,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function canPurchaseDrop(
  state: DropLifecycleState,
  config: Pick<
    DropEditorialConfig,
    'allowPurchaseAfterEnd' | 'allowPurchaseBeforeRelease'
  >,
) {
  if (state === 'LIVE') return true;
  if (state === 'PRE_LAUNCH') return Boolean(config.allowPurchaseBeforeRelease);
  if (state === 'ENDED') return Boolean(config.allowPurchaseAfterEnd);
  return false;
}

export function getDropConfig(handle: string | undefined) {
  return DROP_CONFIGS.find((drop) => drop.handle === handle);
}

export function getDropConfigForProduct(productHandle: string | undefined) {
  return DROP_CONFIGS.find((drop) => drop.productHandle === productHandle);
}

export function getDropStatusLabel(state: DropLifecycleState) {
  switch (state) {
    case 'PRE_LAUNCH':
      return 'Coming soon';
    case 'LIVE':
      return 'Available now';
    case 'SOLD_OUT':
      return 'Sold out';
    case 'ENDED':
      return 'Release ended';
  }
}
