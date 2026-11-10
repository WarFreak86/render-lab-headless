import {readFile} from 'node:fs/promises';

const xmlEntities = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};
const escapeXml = (text) => text.replace(/[&<>]/g, (char) => xmlEntities[char]);

async function main() {
  const [path, productGid, ...offerIds] = process.argv.slice(2);
  const productId = /^gid:\/\/shopify\/Product\/([1-9]\d*)$/.exec(productGid)?.[1];
  if (!path || !productId || !offerIds.length) {
    throw new Error('Usage: node export-merchant-highlights.mjs <payload.json> <product GID> <offer ID> [...]');
  }
  const offerPattern = new RegExp(`^shopify_[A-Z]{2}_${productId}_[1-9]\\d*$`);
  if (new Set(offerIds).size !== offerIds.length || !offerIds.every((id) => offerPattern.test(id))) {
    throw new Error('Supply distinct Shopify App API offer IDs belonging to the selected product.');
  }

  const payload = JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
  if (!Array.isArray(payload)) throw new Error('Expected a JSON array of products.');
  const products = payload.filter((product) => product?.productGid === productGid);
  if (products.length !== 1) throw new Error('Expected exactly one matching product in the payload.');
  const highlights = products[0].product_highlight;
  const isValidHighlight = (value) =>
    typeof value === 'string' && value.trim().length > 0 &&
    [...value.trim()].length <= 150 &&
    !/[^\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u.test(value);
  if (!Array.isArray(highlights) || highlights.length < 2 || highlights.length > 100 ||
      !highlights.every(isValidHighlight)) {
    throw new Error('Google requires 2–100 highlights of 1–150 characters each.');
  }
  const values = highlights.map((value) => value.trim());
  if (new Set(values).size !== values.length) throw new Error('Remove duplicate highlights.');
  const fields = values.map((value) => `      <g:product_highlight>${escapeXml(value)}</g:product_highlight>`);
  const items = offerIds.map((id) =>
    ['    <item>', `      <g:id>${id}</g:id>`, ...fields, '    </item>'].join('\n'),
  );

  process.stdout.write([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    '    <title>Render-Lab product highlights</title>',
    '    <link>https://render-lab.org</link>',
    '    <description>Supplemental product highlights</description>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n'));
}

main().catch((error) => {
  console.error(`ERROR | ${error.message}`);
  process.exitCode = 1;
});
