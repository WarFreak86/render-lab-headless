import {normalizeCreatorCredit} from './navigation';
import {isSuppressedMerchandisingAssetUrl} from './merchandising';
import {
  isLiveCollectionHandle,
  storefrontSeriesCollections,
} from './catalog-collections';

export interface HomepageImage {
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
}

export const HOMEPAGE_HERO_IMAGE = {
  url: 'https://cdn.shopify.com/s/files/1/0748/7701/0081/files/render-lab-home-volcanic-gallery.png?v=1789594138',
  altText:
    'Large-scale volcanic landscape metal wall art print displayed in a dark modern gallery living room',
  width: 1672,
  height: 941,
} satisfies HomepageImage;

export interface HomepageMoney {
  amount: string;
  currencyCode: string;
}

export interface HomepageProductInput {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  descriptionHtml?: string | null;
  productType?: string | null;
  availableForSale?: boolean | null;
  options?: ReadonlyArray<{
    name: string;
    optionValues: ReadonlyArray<{name: string}>;
  }>;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  priceRange?: {
    minVariantPrice: HomepageMoney;
  } | null;
}

export interface HomepageCollectionInput {
  descriptionHtml?: string | null;
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  products: {nodes: ReadonlyArray<HomepageProductInput>};
}

export interface HomepageCommerceInput {
  collections: ReadonlyArray<HomepageCollectionInput>;
  products: ReadonlyArray<HomepageProductInput>;
}

export interface HomepageEditorialConfig {
  hero: {
    eyebrow?: string;
    headline: ReadonlyArray<string>;
    accentLine?: number;
    description?: string;
    primaryCta: {label: string; to: string};
  };
  categories: {eyebrow?: string; title: string};
  featuredCollections: {eyebrow?: string; title: string};
  benefits: ReadonlyArray<{
    icon: 'material' | 'edition' | 'checkout' | 'details' | 'collection';
    title: string;
    description: string;
  }>;
  featuredDrop: {
    eyebrow?: string;
    ctaLabel: string;
  };
}

export interface HomepageCategory {
  id: string;
  title: string;
  to: string;
  image: HomepageImage;
  meta?: string;
}

export interface HomepageCollectionFeature extends HomepageCategory {
  description?: string;
}

export interface HomepageProductFeature {
  id: string;
  handle: string;
  title: string;
  to: string;
  description?: string;
  productType?: string;
  availableForSale: boolean;
  image: HomepageImage;
  price?: HomepageMoney;
}

export interface HomepageData {
  editorial: HomepageEditorialConfig;
  hero: HomepageProductFeature | null;
  heroPrimaryCta: {label: string; to: string} | null;
  heroSecondaryCta: {label: string; to: string} | null;
  categories: HomepageCategory[];
  featuredCollections: HomepageCollectionFeature[];
  featuredDrop: HomepageProductFeature | null;
  featuredProducts: Array<
    HomepageProductFeature & {series: string; materials: string[]}
  >;
}

export const HOMEPAGE_EDITORIAL_FALLBACK: HomepageEditorialConfig = {
  hero: {
    eyebrow: 'Featured series',
    headline: ['Echoes', 'of War'],
    accentLine: 1,
    description:
      'History carried in the silhouette. A cross-era military art collection built around soldiers, memory and the landscapes of conflict.',
    primaryCta: {
      label: 'Explore Echoes of War',
      to: '/collections/echoes-of-war',
    },
  },
  categories: {
    title: 'Explore by category',
  },
  featuredCollections: {
    title: 'Featured collections',
  },
  benefits: [
    {
      icon: 'material',
      title: 'Premium quality',
      description: 'Gallery-grade material options.',
    },
    {
      icon: 'edition',
      title: 'Curated editions',
      description: 'Distinct visual stories for collectors.',
    },
    {
      icon: 'collection',
      title: 'Multiple formats',
      description: 'Metal, canvas, and poster options.',
    },
    {
      icon: 'checkout',
      title: 'Secure checkout',
      description: 'Checkout powered securely by Shopify.',
    },
    {
      icon: 'details',
      title: 'Clear details',
      description: 'Materials and sizing listed with each work.',
    },
  ],
  featuredDrop: {
    eyebrow: 'Limited drop',
    ctaLabel: 'View release',
  },
};

const FEATURED_COLLECTION_PRIORITY: ReadonlyArray<string> = ['chrome-thunder'];

const CATEGORY_PRIORITY = [
  'wall-art',
  'metal-wall-art',
  'canvas-art',
  'posters',
  'bundles',
] as const;

const CATEGORY_META: Readonly<Record<string, string>> = {
  'wall-art': 'Curated series',
  'metal-wall-art': 'Gallery-grade finish',
  'canvas-art': 'Textured depth',
  posters: 'Accessible editions',
  bundles: 'Coordinated sets',
};

const UUID_LIKE_ALT = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

function imageAlt(altText: string | null | undefined, fallback: string) {
  const normalized = altText?.trim();
  return normalizeCreatorCredit(
    normalized && !UUID_LIKE_ALT.test(normalized) ? normalized : fallback,
  );
}

function normalizeImage(
  image:
    HomepageCollectionInput['image'] | HomepageProductInput['featuredImage'],
  fallbackAlt: string,
): HomepageImage | null {
  if (!image?.url || isSuppressedMerchandisingAssetUrl(image.url)) return null;
  return {
    url: image.url,
    altText: imageAlt(image.altText, fallbackAlt),
    width: image.width,
    height: image.height,
  };
}

function normalizeProduct(product: HomepageProductInput | undefined) {
  if (!product) return null;
  const image = normalizeImage(
    product.featuredImage,
    `${product.title} artwork`,
  );
  if (!image) return null;
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    to: `/products/${product.handle}`,
    description: cleanProductDescription(
      product.descriptionHtml || product.description,
    ),
    productType: product.productType?.trim() || undefined,
    availableForSale: Boolean(product.availableForSale),
    image,
    price: product.priceRange?.minVariantPrice,
  } satisfies HomepageProductFeature;
}

function normalizeCollectionHero(
  collection: HomepageCollectionInput | undefined,
) {
  if (!collection) return null;
  const image = collectionImage(collection);
  if (!image) return null;
  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    to: `/collections/${collection.handle}`,
    description: cleanProductDescription(
      collection.descriptionHtml || collection.description,
    ),
    productType: 'Collection',
    availableForSale: false,
    image,
  } satisfies HomepageProductFeature;
}

export function cleanProductDescription(description?: string | null) {
  const value = description
    ?.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
  if (!value) return undefined;
  // Keep initials such as J.B. Render intact and preserve whole sentences.
  const protectedText = value.replace(/\b(?:[A-Z]\.){1,}/g, (initials) =>
    initials.replaceAll('.', '\u2024'),
  );
  const sentences = protectedText.split(/(?<=[.!?])\s+/);
  let start = 0;
  // Skip a pair of short opening taglines when substantive copy follows.
  while (
    start + 2 < sentences.length &&
    sentences.slice(start, start + 2).join(' ').length < 80
  )
    start++;
  return sentences
    .slice(start, start + 2)
    .join(' ')
    .replaceAll('\u2024', '.');
}

function prioritizedCollections(
  collections: ReadonlyArray<HomepageCollectionInput>,
  handles: ReadonlyArray<string>,
) {
  const rank = new Map(handles.map((handle, index) => [handle, index]));
  return [...collections]
    .filter((collection) => rank.has(collection.handle))
    .sort(
      (left, right) =>
        (rank.get(left.handle) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(right.handle) ?? Number.MAX_SAFE_INTEGER),
    );
}

function collectionImage(
  collection: HomepageCollectionInput,
  usedUrls?: Set<string>,
) {
  const candidates = [
    normalizeImage(collection.image, `${collection.title} collection`),
    ...collection.products.nodes.map((product) =>
      normalizeImage(
        product.featuredImage,
        `${collection.title} collection artwork`,
      ),
    ),
  ].filter((image): image is HomepageImage => Boolean(image));
  return (
    candidates.find((image) => !usedUrls?.has(image.url)) ??
    candidates[0] ??
    null
  );
}

function shortCollectionTitle(title: string) {
  return title.split(' — ')[0]?.trim() || title;
}

export function normalizeHomepageData(
  commerce: HomepageCommerceInput,
  editorial: HomepageEditorialConfig = HOMEPAGE_EDITORIAL_FALLBACK,
): HomepageData {
  const merchandisableCollections = commerce.collections.filter(
    (collection) =>
      isLiveCollectionHandle(collection.handle) &&
      collection.products.nodes.length > 0 &&
      collectionImage(collection),
  );
  const categoryCollections = prioritizedCollections(
    merchandisableCollections,
    CATEGORY_PRIORITY,
  );
  // The Storefront query arrives newest-updated first. Only approved, non-empty
  // series flow into the homepage in that order.
  const featuredCandidates = storefrontSeriesCollections(
    merchandisableCollections,
  );
  // Pin one priority series on the homepage while retaining the dynamic
  // newest-updated order for all remaining published series.
  const featuredDisplayOrder = [
    ...prioritizedCollections(featuredCandidates, FEATURED_COLLECTION_PRIORITY),
    ...featuredCandidates.filter(
      (collection) => !FEATURED_COLLECTION_PRIORITY.includes(collection.handle),
    ),
  ];
  const usedFeatureImages = new Set<string>();

  const categories = categoryCollections.flatMap((collection) => {
    const image = collectionImage(collection);
    return image
      ? [
          {
            id: collection.id,
            title: collection.title,
            to: `/collections/${collection.handle}`,
            image,
            meta: CATEGORY_META[collection.handle] ?? 'Explore artwork',
          },
        ]
      : [];
  });

  const allCollectionsSource =
    featuredCandidates[0] ?? merchandisableCollections[0];
  const allCollectionsImage = allCollectionsSource
    ? collectionImage(allCollectionsSource)
    : null;
  if (allCollectionsImage) {
    categories.push({
      id: 'homepage-all-collections',
      title: 'All Collections',
      to: '/collections',
      image: allCollectionsImage,
      meta: 'Browse every series',
    });
  }

  const featuredCollections = featuredDisplayOrder.flatMap((collection) => {
    const image = collectionImage(collection, usedFeatureImages);
    if (!image) return [];
    usedFeatureImages.add(image.url);
    return [
      {
        id: collection.id,
        title: collection.title,
        to: `/collections/${collection.handle}`,
        description: cleanProductDescription(
          collection.descriptionHtml || collection.description,
        ),
        image,
      },
    ];
  });

  const normalizedProducts = commerce.products.flatMap((product) => {
    const normalized = normalizeProduct(product);
    return normalized ? [normalized] : [];
  });
  // Round-robin across live series so the selection represents the gallery,
  // deduplicating products that Shopify places in more than one collection.
  const featuredProducts: HomepageData['featuredProducts'] = [];
  const seenProducts = new Set<string>();
  for (let index = 0; index < 6 && featuredProducts.length < 12; index++) {
    for (const collection of featuredDisplayOrder) {
      const product = collection.products.nodes[index];
      if (!product || seenProducts.has(product.id)) continue;
      const normalized = normalizeProduct(product);
      if (!normalized?.price || !normalized.availableForSale) continue;
      seenProducts.add(product.id);
      const materialValues =
        product.options
          ?.filter(({name}) => /^(material|finish)$/i.test(name))
          .flatMap(({optionValues}) =>
            optionValues.map(({name}) => name.toLowerCase()),
          ) ?? [];
      featuredProducts.push({
        ...normalized,
        series: collection.title,
        materials: ['Metal', 'Canvas', 'Poster'].filter((name) =>
          materialValues.includes(name.toLowerCase()),
        ),
      });
      if (featuredProducts.length === 12) break;
    }
  }
  const heroCollection = featuredCandidates[0];
  const hero =
    normalizeCollectionHero(heroCollection) ??
    normalizedProducts.find(
      (product) =>
        product.image.width &&
        product.image.height &&
        product.image.width / product.image.height >= 1.35,
    ) ??
    normalizedProducts[0] ??
    null;

  const featuredDropCollection = merchandisableCollections.find(
    (collection) => collection.handle === 'limited-editions',
  );
  const featuredDrop =
    normalizeProduct(featuredDropCollection?.products.nodes[0]) ?? null;

  const heroPrimaryCta = heroCollection
    ? {
        label: `Explore ${shortCollectionTitle(heroCollection.title)}`,
        to: `/collections/${heroCollection.handle}`,
      }
    : null;
  const heroSecondaryCta = heroCollection
    ? {label: 'Shop All Wall Art', to: '/collections/wall-art'}
    : merchandisableCollections.some(
          (collection) => collection.handle === 'metal-wall-art',
        )
      ? {label: 'Explore Metal Art', to: '/collections/metal-wall-art'}
      : null;

  return {
    editorial,
    hero,
    heroPrimaryCta,
    heroSecondaryCta,
    categories,
    featuredCollections,
    featuredProducts,
    featuredDrop,
  };
}
