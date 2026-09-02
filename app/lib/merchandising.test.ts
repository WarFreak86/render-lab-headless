import {isSuppressedCollection} from './merchandising';

describe('merchandising suppression', () => {
  it('suppresses the current Nightmare Lab collection handles', () => {
    expect(
      isSuppressedCollection({handle: 'nightmare-lab', title: 'Nightmare Lab'}),
    ).toBe(true);
    expect(
      isSuppressedCollection({
        handle: 'nightmare-lab-halloween-2026',
        title: 'Nightmare Lab — Halloween 2026',
      }),
    ).toBe(true);
  });

  it('suppresses Nightmare Lab title variants even if the handle changes', () => {
    expect(
      isSuppressedCollection({
        handle: 'seasonal-collection',
        title: 'Nightmare Lab - Seasonal Collection',
      }),
    ).toBe(true);
  });

  it('does not suppress unrelated active collections', () => {
    expect(
      isSuppressedCollection({
        handle: 'botanical-anomalies',
        title: 'Botanical Anomalies',
      }),
    ).toBe(false);
  });
});