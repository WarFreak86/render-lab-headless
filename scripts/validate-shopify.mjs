import {readFile} from 'node:fs/promises';

const API_VERSION = '2026-04';
const REQUIRED_ENV = [
  'SESSION_SECRET',
  'PUBLIC_STOREFRONT_ID',
  'PUBLIC_STOREFRONT_API_TOKEN',
  'PUBLIC_STORE_DOMAIN',
  'PRIVATE_STOREFRONT_API_TOKEN',
  'PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID',
  'PUBLIC_CUSTOMER_ACCOUNT_API_URL',
  'SHOP_ID',
];

function parseEnv(source) {
  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    values[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

const env = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'));
const missing = REQUIRED_ENV.filter((key) => !env[key]);
if (missing.length) {
  throw new Error(`Missing required environment keys: ${missing.join(', ')}`);
}

const storeDomain = env.PUBLIC_STORE_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
if (storeDomain === 'mock.shop') throw new Error('PUBLIC_STORE_DOMAIN still points to Mock.shop');

const endpoint = `https://${storeDomain}/api/${API_VERSION}/graphql.json`;
const headers = {
  'Content-Type': 'application/json',
  'X-Shopify-Storefront-Access-Token': env.PUBLIC_STOREFRONT_API_TOKEN,
};

async function storefront(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({query, variables}),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.map((error) => error.message).join('; ') || response.statusText;
    throw new Error(`Storefront API request failed: ${message}`);
  }
  return payload.data;
}

const catalog = await storefront(`#graphql
  query FoundationValidation {
    shop { id }
    products(first: 25) {
      nodes {
        id
        variants(first: 100) {
          nodes { id availableForSale }
        }
      }
    }
    collections(first: 10) { nodes { id } }
  }
`);

const product = catalog.products.nodes[0];
const collection = catalog.collections.nodes[0];
const availableVariant = catalog.products.nodes
  .flatMap((item) => item.variants.nodes)
  .find((variant) => variant.availableForSale);

if (!product) throw new Error('No products were returned by the real storefront');
if (!collection) throw new Error('No collections were returned by the real storefront');
if (!availableVariant) throw new Error('No available variant exists for a safe cart validation');

const created = await storefront(`#graphql
  mutation CreateValidationCart {
    cartCreate {
      cart { id checkoutUrl totalQuantity }
      userErrors { field message }
    }
  }
`);
if (created.cartCreate.userErrors.length) {
  throw new Error(created.cartCreate.userErrors.map((error) => error.message).join('; '));
}

const cartId = created.cartCreate.cart.id;
const added = await storefront(`#graphql
  mutation AddValidationLine($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        totalQuantity
        lines(first: 10) { nodes { id quantity } }
      }
      userErrors { field message }
    }
  }
`, {cartId, lines: [{merchandiseId: availableVariant.id, quantity: 1}]});
if (added.cartLinesAdd.userErrors.length) {
  throw new Error(added.cartLinesAdd.userErrors.map((error) => error.message).join('; '));
}

const line = added.cartLinesAdd.cart.lines.nodes[0];
const updated = await storefront(`#graphql
  mutation UpdateValidationLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl totalQuantity lines(first: 10) { nodes { id quantity } } }
      userErrors { field message }
    }
  }
`, {cartId, lines: [{id: line.id, quantity: 2}]});
if (updated.cartLinesUpdate.userErrors.length) {
  throw new Error(updated.cartLinesUpdate.userErrors.map((error) => error.message).join('; '));
}

const persisted = await storefront(`#graphql
  query PersistedValidationCart($cartId: ID!) {
    cart(id: $cartId) { id checkoutUrl totalQuantity lines(first: 10) { nodes { id quantity } } }
  }
`, {cartId});

const checkoutUrl = persisted.cart?.checkoutUrl;
const checkoutValid = Boolean(checkoutUrl && new URL(checkoutUrl).protocol === 'https:');
const checkoutHostMatchesStoreDomain =
  checkoutValid && new URL(checkoutUrl).hostname === storeDomain;

await storefront(`#graphql
  mutation RemoveValidationLine($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id }
      userErrors { field message }
    }
  }
`, {cartId, lineIds: [line.id]});

// eslint-disable-next-line no-console -- this CLI intentionally reports a sanitized result
console.log(JSON.stringify({
  environment: {
    requiredKeysPresent: true,
    customerAccountConfigured: Boolean(
      env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID &&
      env.PUBLIC_CUSTOMER_ACCOUNT_API_URL &&
      env.SHOP_ID,
    ),
    sessionSecretPresent: Boolean(env.SESSION_SECRET),
    checkoutDomainConfigured: Boolean(env.PUBLIC_CHECKOUT_DOMAIN),
    realStorefront: storeDomain !== 'mock.shop',
  },
  storefrontQuery: Boolean(catalog.shop?.id),
  productQuery: Boolean(product?.id),
  collectionQuery: Boolean(collection?.id),
  cartCreate: Boolean(cartId && created.cartCreate.cart.totalQuantity === 0),
  addToCart: added.cartLinesAdd.cart.totalQuantity === 1,
  quantityUpdate: updated.cartLinesUpdate.cart.lines.nodes[0]?.quantity === 2,
  persistence: persisted.cart?.id === cartId && persisted.cart?.totalQuantity === 2,
  checkoutUrl: checkoutValid,
  checkoutHostMatchesStoreDomain,
  checkoutDomain: checkoutValid ? new URL(checkoutUrl).hostname : null,
  cleanup: true,
}, null, 2));
