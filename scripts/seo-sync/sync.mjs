import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import {setTimeout as sleep} from 'node:timers/promises';
import {parseArgs} from 'node:util';

const mutation = `mutation SetProductSeo($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { namespace key type jsonValue }
    userErrors { field message code }
  }
}`;

const types = {
  title_override: 'single_line_text_field',
  description_override: 'multi_line_text_field',
  product_highlight: 'list.single_line_text_field',
};
const maxAttempts = 5;
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isLine = (value) => isText(value) && !/[\r\n]/.test(value);

function toMetafields(product, seen) {
  const id = product?.productGid;
  if (typeof id !== 'string' || !/^gid:\/\/shopify\/Product\/[1-9]\d*$/.test(id)) {
    throw new Error('Expected a Shopify Product GID.');
  }
  if (seen.has(id)) throw new Error('Duplicate Product GID.');
  seen.add(id);
  if (!isLine(product.title_override)) throw new Error('Expected a single-line title_override.');
  if (!isText(product.description_override)) throw new Error('Expected a non-empty description_override.');
  const highlights = product.product_highlight;
  if (!Array.isArray(highlights) || !highlights.length || !highlights.every(isLine)) {
    throw new Error('Expected product_highlight to be a non-empty array of single-line strings.');
  }
  const metafields = Object.entries(types).map(([key, type]) => ({
    ownerId: id,
    namespace: 'seo',
    key,
    type,
    value: key === 'product_highlight' ? JSON.stringify(highlights) : product[key],
  }));
  const body = JSON.stringify({query: mutation, variables: {metafields}});
  if (Buffer.byteLength(body) > 10_000_000) throw new Error('Mutation exceeds Shopify’s 10 MB limit.');
  return {id, body};
}

function refillDelay(cost) {
  const status = cost?.throttleStatus;
  if (!(status?.restoreRate > 0)) return 0;
  return Math.max(0, Math.ceil(
    (cost.requestedQueryCost - status.currentlyAvailable) / status.restoreRate * 1000,
  )) || 0;
}

function retryAfterDelay(header) {
  if (!header) return 0;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  return Math.max(0, Date.parse(header) - Date.now()) || 0;
}

async function upsert(endpoint, token, {id, body}) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    const rateLimited = response.status === 429;
    if (!response.ok && !rateLimited) throw new Error(`Admin API HTTP ${response.status}`);
    const payload = await response.json().catch((error) => {
      if (rateLimited) return null;
      throw error;
    });
    const errors = payload?.errors;
    const delay = refillDelay(payload?.extensions?.cost);
    if (rateLimited || (errors?.length && errors.every(({extensions}) => extensions?.code === 'THROTTLED'))) {
      if (attempt + 1 === maxAttempts) throw new Error('Admin API throttle retry limit reached.');
      const wait = Math.max(delay, retryAfterDelay(response.headers.get('retry-after')), 1000 * 2 ** attempt);
      console.warn(`RETRY ${id} | throttled | waiting ${wait} ms`);
      await sleep(wait);
      continue;
    }

    if (delay) await sleep(delay);
    if (errors?.length) throw new Error(errors.map(({message}) => message).join(' | '));
    const result = payload?.data?.metafieldsSet;
    if (result?.userErrors?.length) {
      throw new Error(result.userErrors.map(({code, field, message}) =>
        [code, field?.join('.'), message].filter(Boolean).join(' '),
      ).join(' | '));
    }
    if (result?.metafields?.length !== Object.keys(types).length) {
      throw new Error('Shopify did not confirm all three metafields.');
    }
    return;
  }
}

async function main() {
  const {values, positionals} = parseArgs({
    options: {apply: {type: 'boolean', default: false}},
    allowPositionals: true,
  });
  if (positionals.length > 1) throw new Error('Usage: node sync.mjs [seo-payload.json] [--apply]');
  const products = JSON.parse((await readFile(positionals[0] ?? 'seo-payload.json', 'utf8')).replace(/^\uFEFF/, ''));
  if (!Array.isArray(products) || !products.length) throw new Error('Expected a non-empty JSON array of products.');

  const seen = new Set();
  const valid = [];
  let failures = 0;
  for (const [index, product] of products.entries()) {
    try {
      valid.push(toMetafields(product, seen));
    } catch (error) {
      failures++;
      const id = typeof product?.productGid === 'string' ? JSON.stringify(product.productGid) : '(missing GID)';
      console.error(`FAIL row ${index + 1} ${id} | ${error.message}`);
    }
  }

  if (failures) {
    for (const {id} of valid) process.stdout.write(`SKIP ${id} | payload validation failed\n`);
    process.exitCode = 1;
    return;
  }

  let endpoint;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (values.apply) {
    const shop = process.env.SHOPIFY_ADMIN_SHOP?.trim().replace(/^https:\/\//i, '').replace(/\/$/, '');
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shop ?? '') || !token) {
      throw new Error('Set SHOPIFY_ADMIN_SHOP to your myshopify.com store and SHOPIFY_ADMIN_ACCESS_TOKEN to an Admin API token.');
    }
    endpoint = `https://${shop}/admin/api/2026-10/graphql.json`;
  }

  for (const product of valid) {
    const {id} = product;
    if (!values.apply) {
      process.stdout.write(`VALID ${id} | 3 metafields ready\n`);
      continue;
    }
    try {
      await upsert(endpoint, token, product);
      process.stdout.write(`OK ${id} | 3 metafields upserted\n`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${id} | ${error.message}`);
    }
  }

  const action = values.apply ? 'upserted' : 'validated';
  process.stdout.write(`Summary | ${products.length - failures} ${action} | ${failures} failed\n`);
  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`ERROR | ${error.message}`);
  process.exitCode = 1;
});
