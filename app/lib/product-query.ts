export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      id
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

export const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    availableForSale
    id
    title
    vendor
    handle
    productType
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    media(first: 12) {
      nodes {
        ... on MediaImage {
          id
          image {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
    collections(first: 1) {
      nodes {
        handle
        title
      }
    }
    artworkStory: metafield(namespace: "custom", key: "artwork_story") { value }
    artistNote: metafield(namespace: "custom", key: "artist_note") { value }
    badge: metafield(namespace: "custom", key: "badge") { value }
    careInstructions: metafield(namespace: "custom", key: "care_instructions") { value }
    collectorInformation: metafield(namespace: "custom", key: "collector_information") { value }
    editionSize: metafield(namespace: "custom", key: "edition_size") { value }
    fabricDetails: metafield(namespace: "custom", key: "fabric_details") { value }
    fitNotes: metafield(namespace: "custom", key: "fit_notes") { value }
    materialDescription: metafield(namespace: "custom", key: "material_description") { value }
    productHighlights: metafield(namespace: "custom", key: "product_highlights") { value }
    roomMockups: metafield(namespace: "custom", key: "room_mockups") {
      references(first: 8) {
        nodes {
          ... on MediaImage {
            id
            image {
              id
              url
              altText
              width
              height
            }
          }
        }
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

export const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

export const DROP_PRODUCT_QUERY = `#graphql
  query DropProduct(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
