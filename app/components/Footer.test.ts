import {describe, expect, it} from 'vitest';
import {requiresFullPagePrivacyNavigation} from './Footer';

describe('Shopify privacy opt-out navigation', () => {
  it('forces a full document load for the native opt-out page', () => {
    expect(
      requiresFullPagePrivacyNavigation('/pages/data-sharing-opt-out'),
    ).toBe(true);
    expect(
      requiresFullPagePrivacyNavigation('/pages/data-sharing-opt-out?utm_source=footer'),
    ).toBe(true);
  });

  it('keeps ordinary storefront navigation in React Router', () => {
    expect(requiresFullPagePrivacyNavigation('/pages/contact')).toBe(false);
    expect(requiresFullPagePrivacyNavigation('/policies/privacy-policy')).toBe(false);
  });

  it('does not classify other hosts as the trusted storefront opt-out page', () => {
    expect(
      requiresFullPagePrivacyNavigation(
        'https://example.org/pages/data-sharing-opt-out',
      ),
    ).toBe(false);
  });
});
