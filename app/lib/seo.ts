import {
  getProductionUrl,
  getStorefrontEnvironment,
  PRODUCTION_ORIGIN,
} from '~/lib/config';

export const PREVIEW_ROBOTS_DIRECTIVE = 'noindex, nofollow, noarchive';
export const SEARCH_ROBOTS_DIRECTIVE = 'noindex, follow';

export function getEnvironmentRobotsDirective(requestUrl: string) {
  return getStorefrontEnvironment(requestUrl) === 'production'
    ? undefined
    : PREVIEW_ROBOTS_DIRECTIVE;
}

export function getProductionRequest(request: Request) {
  const source = new URL(request.url);
  const production = new URL(source.pathname + source.search, PRODUCTION_ORIGIN);
  return new Request(production, request);
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function getGlobalStructuredData() {
  const organizationId = getProductionUrl('/#organization');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Render-Lab',
        url: PRODUCTION_ORIGIN,
      },
      {
        '@type': 'WebSite',
        '@id': getProductionUrl('/#website'),
        name: 'Render-Lab',
        url: PRODUCTION_ORIGIN,
        publisher: {'@id': organizationId},
      },
    ],
  };
}

interface CommerceJsonLdInput {
  canonical: string;
  title: string;
  description?: string | null;
  images: string[];
  vendor?: string | null;
  variant?: {
    availableForSale: boolean;
    price: {amount: string; currencyCode: string};
    sku?: string | null;
  } | null;
  breadcrumb?: {name: string; url: string}[];
}

export function getCommerceStructuredData({
  canonical,
  title,
  description,
  images,
  vendor,
  variant,
  breadcrumb,
}: CommerceJsonLdInput) {
  const product = {
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name: title,
    url: canonical,
    ...(description ? {description} : {}),
    ...(images.length ? {image: images} : {}),
    ...(variant?.sku ? {sku: variant.sku} : {}),
    ...(vendor ? {brand: {'@type': 'Brand', name: vendor}} : {}),
    ...(variant
      ? {
          offers: {
            '@type': 'Offer',
            availability: variant.availableForSale
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            price: variant.price.amount,
            priceCurrency: variant.price.currencyCode,
            url: canonical,
          },
        }
      : {}),
  };

  if (!breadcrumb?.length) {
    return {'@context': 'https://schema.org', ...product};
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      product,
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumb.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    ],
  };
}

function generalDisallowRules(sitemapUrl?: string) {
  return `Disallow: /cart
Disallow: /account
Disallow: /collections/*sort_by*
Disallow: /*/collections/*sort_by*
Disallow: /collections/*+*
Disallow: /collections/*%2B*
Disallow: /collections/*%2b*
Disallow: /*/collections/*+*
Disallow: /*/collections/*%2B*
Disallow: /*/collections/*%2b*
Disallow: /*/collections/*filter*&*filter*
Disallow: /blogs/*+*
Disallow: /blogs/*%2B*
Disallow: /blogs/*%2b*
Disallow: /*/blogs/*+*
Disallow: /*/blogs/*%2B*
Disallow: /*/blogs/*%2b*
Disallow: /policies/
Disallow: /search
Allow: /search/
Disallow: /search/?*
${sitemapUrl ? `Sitemap: ${sitemapUrl}` : ''}`;
}

export function getProductionRobotsTxt() {
  const sitemapUrl = getProductionUrl('/sitemap.xml');
  return `User-agent: *
${generalDisallowRules(sitemapUrl)}

# Google adsbot ignores robots.txt unless specifically named.
User-agent: adsbot-google
Disallow: /cart
Disallow: /account
Disallow: /search
Allow: /search/
Disallow: /search/?*

User-agent: Nutch
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10
${generalDisallowRules()}

User-agent: AhrefsSiteAudit
Crawl-delay: 10
${generalDisallowRules()}

User-agent: MJ12bot
Crawl-delay: 10

User-agent: Pinterest
Crawl-delay: 1`;
}

export function getRobotsTxt(requestUrl: string) {
  if (getStorefrontEnvironment(requestUrl) !== 'production') {
    return 'User-agent: *\nDisallow: /';
  }
  return getProductionRobotsTxt();
}
