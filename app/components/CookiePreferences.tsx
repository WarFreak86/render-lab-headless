import {useAnalytics} from '@shopify/hydrogen';

/** Reopen Shopify's configured choices without changing regional targeting. */
export function CookiePreferences() {
  const {privacyBanner} = useAnalytics();
  if (!privacyBanner) return null;

  return (
    <button
      type="button"
      className="site-footer__cookie-preferences"
      onClick={() => privacyBanner.showPreferences()}
    >
      Cookie preferences
    </button>
  );
}
