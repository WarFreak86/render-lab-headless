const CAMPAIGN_PARAMETERS = [
  'utm_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];

/** Keep inbound campaign attribution without sending arbitrary queries or fragments. */
export function getAnalyticsPageLocation(href: string) {
  const source = new URL(href);
  const location = new URL(source.origin + source.pathname);
  for (const name of CAMPAIGN_PARAMETERS) {
    const value = source.searchParams.get(name);
    if (value) location.searchParams.set(name, value);
  }
  return location.href;
}
