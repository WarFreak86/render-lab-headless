import {getDropConfigForProduct} from './drops';

export interface HomepageImage {
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
}

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
  featuredDropProduct?: HomepageProductInput | null;
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
}

export const HOMEPAGE_EDITORIAL_FALLBACK: HomepageEditorialConfig = {
  hero: {
    eyebrow: 'Art that hits different',
    headline: ['Vision. Chaos.', 'Mastered.'],
    accentLine: 1,
    description:
      'Premium metal, canvas, and poster art designed to transform your space and ignite your imagination.',
    primaryCta: {label: 'Explore Collections', to: '/collections/wall-art'},
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

const CATEGORY_PRIORITY = [
  'wall-art',
  'metal-wall-art',
  'canvas-art',
  'posters',
  'bundles',
] as const;

const FEATURED_COLLECTION_PRIORITY = [
  'nightmare-lab-halloween-2026',
  'botanical-anomalies',
  'neon-memento',
  'after-dark',
  'limited-editions',
  'neon-speed',
  'alt-history',
] as const;

const CATEGORY_META: Readonly<Record<string, string>> = {
  'wall-art': 'Curated series',
  'metal-wall-art': 'Gallery-grade finish',
  'canvas-art': 'Textured depth',
  posters: 'Accessible editions',
  bundles: 'Coordinated sets',
};

const HERO_COLLECTION_PRIORITY = [
  'nightmare-lab-halloween-2026',
  'neon-memento',
] as const;

const UUID_LIKE_ALT = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

function imageAlt(altText: string | null | undefined, fallback: string) {
  const normalized = altText?.trim();
  return normalized && !UUID_LIKE_ALT.test(normalized) ? normalized : fallback;
}

function normalizeImage(
  image: HomepageCollectionInput['image'] | HomepageProductInput['featuredImage'],
  fallbackAlt: string,
): HomepageImage | null {
  if (!image?.url) return null;
  return {
    url: image.url,
    altText: imageAlt(image.altText, fallbackAlt),
    width: image.width,
    height: image.height,
  };
}

function normalizeProduct(product: HomepageProductInput | undefined) {
  if (!product) return null;
  const image = normalizeImage(product.featuredImage, `${product.title} artwork`);
  if (!image) return null;
  const drop = getDropConfigForProduct(product.handle);
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    to: drop ? `/drops/${drop.handle}` : `/products/${product.handle}`,
    description: cleanProductDescription(
      product.descriptionHtml || product.description,
    ),
    productType: product.productType?.trim() || undefined,
    availableForSale: Boolean(product.availableForSale),
    image,
    price: product.priceRange?.minVariantPrice,
  } satisfies HomepageProductFeature;
}

function normalizeCollectionHero(collection: HomepageCollectionInput | undefined) {
  if (!collection) return null;
  const image = collectionImage(collection);
  if (!image) return null;
  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    to: `/collections/${collection.handle}`,
    description: cleanProductDescription(collection.description),
    productType: 'Collection',
    availableForSale: false,
    image,
  } satisfies HomepageProductFeature;
}

function cleanProductDescription(description?: string | null) {
  const value = description
    ?.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (!value) return undefined;
  return value.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || value.slice(0, 220);
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
      normalizeImage(product.featuredImage, `${collection.title} collection artwork`),
    ),
  ].filter((image): image is HomepageImage => Boolean(image));
  return candidates.find((image) => !usedUrls?.has(image.url)) ?? candidates[0] ?? null;
}

function shortCollectionTitle(title: string) {
  return title.split(' — ')[0]?.trim() || title;
}

export function normalizeHomepageData(
  commerce: HomepageCommerceInput,
  editorial: HomepageEditorialConfig = HOMEPAGE_EDITORIAL_FALLBACK,
): HomepageData {
  const merchandisableCollections = commerce.collections.filter(
    (collection) => collection.products.nodes.length > 0 && collectionImage(collection),
  );
  const categoryCollections = prioritizedCollections(
    merchandisableCollections,
    CATEGORY_PRIORITY,
  );
  const featuredCandidates = prioritizedCollections(
    merchandisableCollections,
    FEATURED_COLLECTION_PRIORITY,
  );
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
    prioritizedCollections(merchandisableCollections, HERO_COLLECTION_PRIORITY)[0] ??
    merchandisableCollections[0];
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

  const featuredCollections = featuredCandidates.flatMap((collection) => {
    const image = collectionImage(collection, usedFeatureImages);
    if (!image) return [];
    usedFeatureImages.add(image.url);
    return [
      {
        id: collection.id,
        title: collection.title,
        to: `/collections/${collection.handle}`,
        description: collection.description?.trim() || undefined,
        image,
      },
    ];
  });

  const normalizedProducts = commerce.products.flatMap((product) => {
    const normalized = normalizeProduct(product);
    return normalized ? [normalized] : [];
  });
  const heroCollection = prioritizedCollections(
    merchandisableCollections,
    HERO_COLLECTION_PRIORITY,
  )[0];
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
    (commerce.featuredDropProduct &&
    getDropConfigForProduct(commerce.featuredDropProduct.handle)
      ? normalizeProduct(commerce.featuredDropProduct)
      : null) ??
    normalizedProducts.find((product) =>
      Boolean(getDropConfigForProduct(product.handle)),
    ) ??
    normalizeProduct(featuredDropCollection?.products.nodes[0]) ??
    null;

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
    featuredDrop,
  };
}
