import {
  canPurchaseDrop,
  getDropConfig,
  getDropConfigForProduct,
  getDropCountdownTarget,
  getDropCountdownValue,
  getDropStatusLabel,
  normalizeDropWindow,
  resolveDropLifecycle,
} from './drops';

const releaseDate = '2026-08-26T12:00:00.000Z';
const endDate = '2026-08-27T12:00:00.000Z';

describe('drop configuration and lifecycle', () => {
  it('maps the configured drop to a real Shopify product handle', () => {
    expect(getDropConfig('marine-heavyweight-oversized-hoodie')).toMatchObject({
      productHandle: 'marine-heavyweight-oversized-hoodie',
    });
    expect(
      getDropConfigForProduct('marine-heavyweight-oversized-hoodie')?.handle,
    ).toBe('marine-heavyweight-oversized-hoodie');
  });

  it('does not resolve an unknown drop', () => {
    expect(getDropConfig('unknown-drop')).toBeUndefined();
  });

  it('resolves PRE_LAUNCH before a valid release date', () => {
    expect(
      resolveDropLifecycle({
        now: '2026-08-26T11:59:59.000Z',
        releaseDate,
        endDate,
        available: true,
      }),
    ).toBe('PRE_LAUNCH');
  });

  it('resolves LIVE inside the release window with available merchandise', () => {
    expect(
      resolveDropLifecycle({
        now: '2026-08-26T18:00:00.000Z',
        releaseDate,
        endDate,
        available: true,
      }),
    ).toBe('LIVE');
  });

  it('resolves SOLD_OUT inside the release window without available merchandise', () => {
    expect(
      resolveDropLifecycle({
        now: '2026-08-26T18:00:00.000Z',
        releaseDate,
        endDate,
        available: false,
      }),
    ).toBe('SOLD_OUT');
  });

  it('resolves ENDED at the exact campaign end time', () => {
    expect(
      resolveDropLifecycle({
        now: endDate,
        releaseDate,
        endDate,
        available: true,
      }),
    ).toBe('ENDED');
  });

  it('uses availability safely when dates are missing', () => {
    expect(resolveDropLifecycle({now: 0, available: true})).toBe('LIVE');
    expect(resolveDropLifecycle({now: 0, available: false})).toBe('SOLD_OUT');
  });

  it('ignores malformed and inverted date windows without inventing a state', () => {
    expect(normalizeDropWindow('not-a-date', 'also-not-a-date').valid).toBe(
      false,
    );
    expect(normalizeDropWindow(endDate, releaseDate).valid).toBe(false);
    expect(
      resolveDropLifecycle({
        now: releaseDate,
        releaseDate: 'not-a-date',
        endDate: 'also-not-a-date',
        available: true,
      }),
    ).toBe('LIVE');
  });

  it('never returns a negative countdown', () => {
    expect(getDropCountdownValue(releaseDate, endDate)).toEqual({
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('splits the countdown into days, hours, minutes and seconds', () => {
    expect(
      getDropCountdownValue(
        '2026-08-28T14:03:04.000Z',
        '2026-08-26T12:00:00.000Z',
      ),
    ).toEqual({
      totalSeconds: 180184,
      days: 2,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });
  });

  it('selects only a valid lifecycle countdown target', () => {
    expect(getDropCountdownTarget('PRE_LAUNCH', releaseDate, endDate)).toBe(
      new Date(releaseDate).getTime(),
    );
    expect(getDropCountdownTarget('LIVE', releaseDate, endDate)).toBe(
      new Date(endDate).getTime(),
    );
    expect(getDropCountdownTarget('SOLD_OUT', releaseDate, endDate)).toBeUndefined();
    expect(getDropCountdownTarget('LIVE', 'bad', endDate)).toBeUndefined();
  });

  it('keeps lifecycle purchase gates separate from Shopify availability', () => {
    expect(canPurchaseDrop('LIVE', {})).toBe(true);
    expect(canPurchaseDrop('SOLD_OUT', {})).toBe(false);
    expect(canPurchaseDrop('PRE_LAUNCH', {})).toBe(false);
    expect(
      canPurchaseDrop('PRE_LAUNCH', {allowPurchaseBeforeRelease: true}),
    ).toBe(true);
    expect(canPurchaseDrop('ENDED', {allowPurchaseAfterEnd: true})).toBe(true);
  });

  it('provides restrained customer-facing labels for every lifecycle state', () => {
    expect(
      ['PRE_LAUNCH', 'LIVE', 'SOLD_OUT', 'ENDED'].map((state) =>
        getDropStatusLabel(state as any),
      ),
    ).toEqual(['Coming soon', 'Available now', 'Sold out', 'Release ended']);
  });
});
