import {
  getProductionUrl,
  getStorefrontEnvironment,
  PRODUCTION_ORIGIN,
} from '~/lib/config';

export const PREVIEW_ROBOTS_DIRECTIVE = 'noindex, nofollow, noarchive';
export const SEARCH_ROBOTS_DIRECTIVE = 'noindex, follow';
export const MAX_META_DESCRIPTION_LENGTH = 160;

const BRAND_SUFFIX = 'Render-Lab';
const PRODUCT_TITLE_BRAND_PATTERN = /\|\s*render-lab\s*$/i;
const COLLECTION_PAGINATION_PARAMS = new Set(['cursor', 'direction']);

export function getEnvironmentRobotsDirective(requestUrl: string) {
  return getStorefrontEnvironment(requestUrl) === 'production'
    ? undefined
    : PREVIEW_ROBOTS_DIRECTIVE;
}

export function getProductionRequest(request: Request) {
  const source = new URL(request.url);
  const production = new URL(
    source.pathname + source.search,
    PRODUCTION_ORIGIN,
  );
  return new Request(production, request);
}

export function getBrandedTitle(title?: string | null, fallback = 'Product') {
  const normalized = title?.trim() || fallback;
  return PRODUCT_TITLE_BRAND_PATTERN.test(normalized)
    ? normalized
    : `${normalized} | ${BRAND_SUFFIX}`;
}

export function getMetaDescription(
  ...candidates: Array<string | null | undefined>
) {
  const description = candidates
    .map((candidate) =>
      candidate
        ?.replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .find(Boolean);

  if (!description || description.length <= MAX_META_DESCRIPTION_LENGTH) {
    return description;
  }

  const availableLength = MAX_META_DESCRIPTION_LENGTH - 1;
  const candidate = description.slice(0, availableLength + 1);
  const wordBoundary = candidate.lastIndexOf(' ');
  const cutoff =
    wordBoundary >= Math.floor(availableLength * 0.75)
      ? wordBoundary
      : availableLength;

  return `${description.slice(0, cutoff).trimEnd()}…`;
}

export function getCollectionCanonicalUrl(handle: string, search = '') {
  const canonical = new URL(getProductionUrl(`/collections/${handle}`));
  const searchParams = new URLSearchParams(search);
  const cursor = searchParams.get('cursor')?.trim();
  const direction = searchParams.get('direction');
  const hasNonPaginationParams = [...searchParams.keys()].some(
    (key) => !COLLECTION_PAGINATION_PARAMS.has(key),
  );
  const hasValidDirection =
    direction === null || direction === 'next' || direction === 'previous';

  if (!cursor || hasNonPaginationParams || !hasValidDirection) {
    return canonical.toString();
  }

  if (direction) canonical.searchParams.set('direction', direction);
  canonical.searchParams.set('cursor', cursor);
  return canonical.toString();
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

interface ProductGroupVariantInput {
  availableForSale: boolean;
  id: string;
  image?: {url?: string | null} | null;
  price?: {amount?: string | null; currencyCode?: string | null} | null;
  selectedOptions?: Array<{
    name?: string | null;
    value?: string | null;
  }> | null;
  sku?: string | null;
}

interface ProductGroupJsonLdInput {
  canonical: string;
  productId: string;
  title: string;
  description?: string | null;
  images: string[];
  vendor?: string | null;
  variants: ProductGroupVariantInput[];
  breadcrumb?: {name: string; url: string}[];
}

function productVariantSchemaId(canonical: string, shopifyId: string) {
  const resourceId = shopifyId.match(
    /^gid:\/\/shopify\/ProductVariant\/([^/?#]+)$/,
  )?.[1];

  return `${canonical}#variant-${encodeURIComponent(resourceId || shopifyId)}`;
}

function getVariantOptions(variant: ProductGroupVariantInput) {
  return (variant.selectedOptions ?? []).flatMap(({name, value}) => {
    const normalizedName = name?.trim();
    const normalizedValue = value?.trim();
    return normalizedName && normalizedValue
      ? [{name: normalizedName, value: normalizedValue}]
      : [];
  });
}

function getVariantUrl(canonical: string, variant: ProductGroupVariantInput) {
  const url = new URL(canonical);
  for (const option of getVariantOptions(variant)) {
    url.searchParams.append(option.name, option.value);
  }
  return url.toString();
}

function getVariantDimensions(variant: ProductGroupVariantInput) {
  const additionalProperty: Array<{
    '@type': 'PropertyValue';
    name: string;
    value: string;
  }> = [];
  let material: string | undefined;
  let size: string | undefined;

  for (const option of getVariantOptions(variant)) {
    if (/^material$/i.test(option.name)) {
      material = option.value;
    } else if (/^size$/i.test(option.name)) {
      size = option.value;
    } else {
      additionalProperty.push({
        '@type': 'PropertyValue',
        name: option.name,
        value: option.value,
      });
    }
  }

  return {
    ...(material ? {material} : {}),
    ...(size ? {size} : {}),
    ...(additionalProperty.length ? {additionalProperty} : {}),
  };
}

function getVariesBy(variants: ProductGroupVariantInput[]) {
  const options = new Map<string, {name: string; values: Set<string>}>();

  for (const variant of variants) {
    for (const option of getVariantOptions(variant)) {
      const key = option.name.toLowerCase();
      const current = options.get(key) ?? {
        name: option.name,
        values: new Set<string>(),
      };
      current.values.add(option.value);
      options.set(key, current);
    }
  }

  return [...options.values()].map(({name, values}) => {
    if (/^material$/i.test(name)) return 'https://schema.org/material';
    if (/^size$/i.test(name)) return 'https://schema.org/size';

    return {
      '@type': 'PropertyValue',
      name,
      value: [...values],
    };
  });
}

function assertUniqueProductVariants(variants: ProductGroupVariantInput[]) {
  const ids = new Set<string>();
  const skus = new Set<string>();

  for (const variant of variants) {
    if (!variant.id?.trim()) {
      throw new Error('ProductGroup variants require a Shopify variant ID');
    }
    if (ids.has(variant.id)) {
      throw new Error(`Duplicate Shopify variant ID: ${variant.id}`);
    }
    ids.add(variant.id);

    const sku = variant.sku?.trim();
    if (sku && skus.has(sku)) {
      throw new Error(`Duplicate Shopify variant SKU: ${sku}`);
    }
    if (sku) skus.add(sku);
  }
}

export function getProductGroupStructuredData({
  canonical,
  productId,
  title,
  description,
  images,
  vendor,
  variants,
  breadcrumb,
}: ProductGroupJsonLdInput) {
  assertUniqueProductVariants(variants);
  const productGroupId = `${canonical}#product-group`;
  const hasVariant = variants.map((variant) => {
    const variantUrl = getVariantUrl(canonical, variant);
    const image = variant.image?.url || images[0];
    const price = variant.price?.amount?.trim();
    const priceCurrency = variant.price?.currencyCode?.trim();

    if (!price || !priceCurrency) {
      throw new Error(`ProductGroup variant ${variant.id} requires a price`);
    }

    return {
      '@type': 'Product' as const,
      '@id': productVariantSchemaId(canonical, variant.id),
      name: title,
      url: variantUrl,
      ...(variant.sku?.trim() ? {sku: variant.sku.trim()} : {}),
      ...(image ? {image} : {}),
      ...getVariantDimensions(variant),
      isVariantOf: {'@id': productGroupId},
      offers: {
        '@type': 'Offer' as const,
        availability: variant.availableForSale
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        price,
        priceCurrency,
        url: variantUrl,
      },
    };
  });
  const productGroup = {
    '@type': 'ProductGroup' as const,
    '@id': productGroupId,
    name: title,
    url: canonical,
    productGroupID: productId,
    ...(description ? {description} : {}),
    ...(images.length ? {image: images} : {}),
    ...(vendor ? {brand: {'@type': 'Brand' as const, name: vendor}} : {}),
    ...(variants.length ? {variesBy: getVariesBy(variants)} : {}),
    hasVariant,
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      productGroup,
      ...(breadcrumb?.length
        ? [
            {
              '@type': 'BreadcrumbList' as const,
              itemListElement: breadcrumb.map((item, index) => ({
                '@type': 'ListItem' as const,
                position: index + 1,
                name: item.name,
                item: item.url,
              })),
            },
          ]
        : []),
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
