import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const items = [{"handle":"sunset-patrol-graphic-hoodie","title":"Army — Sunset Patrol Fleece Hoodie","variants":[{"size":"M","id":"gid://shopify/ProductVariant/49158024757409","sku":"SBHDF-663182-M","price":"79.00"},{"size":"L","id":"gid://shopify/ProductVariant/49158024790177","sku":"SBHDF-663182-L","price":"79.00"},{"size":"XL","id":"gid://shopify/ProductVariant/49158024822945","sku":"SBHDF-663182-XL","price":"79.00"},{"size":"2XL","id":"gid://shopify/ProductVariant/49158024855713","sku":"SBHDF-663182-2XL","price":"79.00"},{"size":"3XL","id":"gid://shopify/ProductVariant/49158024888481","sku":"SBHDF-663182-3XL","price":"79.00"},{"size":"4XL","id":"gid://shopify/ProductVariant/49158024921249","sku":"SBHDF-663182-4XL","price":"79.00"}]},{"handle":"deathwalkers-skull-hoodie","title":"Deathwalkers — Skull Crest Fleece Hoodie","variants":[{"size":"M","id":"gid://shopify/ProductVariant/49140635173025","sku":"SBHDF-663132-M","price":"79.00"},{"size":"L","id":"gid://shopify/ProductVariant/49140635205793","sku":"SBHDF-663132-L","price":"79.00"},{"size":"XL","id":"gid://shopify/ProductVariant/49140635238561","sku":"SBHDF-663132-XL","price":"79.00"},{"size":"2XL","id":"gid://shopify/ProductVariant/49140635271329","sku":"SBHDF-663132-2XL","price":"79.00"},{"size":"3XL","id":"gid://shopify/ProductVariant/49140635304097","sku":"SBHDF-663132-3XL","price":"79.00"},{"size":"4XL","id":"gid://shopify/ProductVariant/49140635336865","sku":"SBHDF-663132-4XL","price":"79.00"}]},{"handle":"flag-raising-fleece-hoodie","title":"Marines — Flag Raising Fleece Hoodie","variants":[{"size":"M","id":"gid://shopify/ProductVariant/49140556791969","sku":"SBHDF-663130-M","price":"79.00"},{"size":"L","id":"gid://shopify/ProductVariant/49140556824737","sku":"SBHDF-663130-L","price":"79.00"},{"size":"XL","id":"gid://shopify/ProductVariant/49140556857505","sku":"SBHDF-663130-XL","price":"79.00"},{"size":"2XL","id":"gid://shopify/ProductVariant/49140556890273","sku":"SBHDF-663130-2XL","price":"79.00"},{"size":"3XL","id":"gid://shopify/ProductVariant/49140556923041","sku":"SBHDF-663130-3XL","price":"79.00"},{"size":"4XL","id":"gid://shopify/ProductVariant/49140556955809","sku":"SBHDF-663130-4XL","price":"79.00"}]},{"handle":"ronin-samurai-fleece-hoodie","title":"Ronin — Samurai Fleece Hoodie","variants":[{"size":"M","id":"gid://shopify/ProductVariant/49132347556001","sku":"SBHDF-663120-M","price":"79.00"},{"size":"L","id":"gid://shopify/ProductVariant/49132347588769","sku":"SBHDF-663120-L","price":"79.00"},{"size":"XL","id":"gid://shopify/ProductVariant/49132347621537","sku":"SBHDF-663120-XL","price":"79.00"},{"size":"2XL","id":"gid://shopify/ProductVariant/49132347654305","sku":"SBHDF-663120-2XL","price":"79.00"},{"size":"3XL","id":"gid://shopify/ProductVariant/49132347687073","sku":"SBHDF-663120-3XL","price":"79.00"},{"size":"4XL","id":"gid://shopify/ProductVariant/49132347719841","sku":"SBHDF-663120-4XL","price":"79.00"}]},{"handle":"astro-skeleton-astronaut-hoodie","title":"Astro — Skeleton Astronaut Fleece Hoodie","variants":[{"size":"M","id":"gid://shopify/ProductVariant/49130553933985","sku":"SBHDF-662980-M","price":"79.00"},{"size":"L","id":"gid://shopify/ProductVariant/49130553966753","sku":"SBHDF-662980-L","price":"79.00"},{"size":"XL","id":"gid://shopify/ProductVariant/49130553999521","sku":"SBHDF-662980-XL","price":"79.00"},{"size":"2XL","id":"gid://shopify/ProductVariant/49130554032289","sku":"SBHDF-662980-2XL","price":"79.00"},{"size":"3XL","id":"gid://shopify/ProductVariant/49130554065057","sku":"SBHDF-662980-3XL","price":"79.00"},{"size":"4XL","id":"gid://shopify/ProductVariant/49130554097825","sku":"SBHDF-662980-4XL","price":"79.00"}]},{"handle":"fighter-jet-graphic-hoodie","title":"Fighter — Jet Sunset Fleece Hoodie","variants":[{"size":"M","id":"gid://shopify/ProductVariant/49128545353889","sku":"SBHDF-663066-M","price":"79.00"},{"size":"L","id":"gid://shopify/ProductVariant/49128545386657","sku":"SBHDF-663066-L","price":"79.00"},{"size":"XL","id":"gid://shopify/ProductVariant/49128545419425","sku":"SBHDF-663066-XL","price":"79.00"},{"size":"2XL","id":"gid://shopify/ProductVariant/49128545452193","sku":"SBHDF-663066-2XL","price":"79.00"},{"size":"3XL","id":"gid://shopify/ProductVariant/49128545484961","sku":"SBHDF-663066-3XL","price":"79.00"},{"size":"4XL","id":"gid://shopify/ProductVariant/49128545517729","sku":"SBHDF-663066-4XL","price":"79.00"}]}];
const deploymentUrl = process.env.DEPLOYMENT_URL;
const authBypassToken = process.env.AUTH_BYPASS_TOKEN;
assert.ok(deploymentUrl && authBypassToken, 'Expected a private Oxygen Preview URL and auth-bypass token');

const browser = await chromium.launch({headless:true});
const context = await browser.newContext({
  viewport: {width:430,height:900},
  extraHTTPHeaders: {'oxygen-auth-bypass-token':authBypassToken},
});
const page = await context.newPage();

async function load(path) {
  const response = await page.goto(new URL(path, deploymentUrl).toString(), {
    waitUntil: 'domcontentloaded', timeout: 45000,
  });
  assert.equal(response?.status(), 200, path + ' HTTP status');
  await page.locator('h1').first().waitFor({state:'visible'});
}

async function waitSelected(expected) {
  await page.waitForFunction((expectedId) => {
    const el = document.querySelector('input[name="analytics"]');
    if (!(el instanceof HTMLInputElement)) return false;
    try {
      const data = JSON.parse(el.value);
      return data.products?.[0]?.variantGid === expectedId;
    } catch {
      return false;
    }
  }, expected.id, {timeout:20000});
  const value = JSON.parse(await page.locator('input[name="analytics"]').inputValue());
  assert.equal(value.products[0].variantGid, expected.id);
  assert.equal(value.products[0].variantName, expected.size);
  assert.equal(Number(value.totalValue), Number(expected.price));
  assert.ok(await page.locator('.product-purchase__add').first().isEnabled(), 'Selected variant must be buyable');
}

try {
  for (const item of items) {
    await load('/products/' + item.handle);
    assert.equal(await page.locator('.product-purchase__add').first().isDisabled(), true,
      item.title + ': size must be chosen before purchase');
    for (const variant of item.variants) {
      await page.getByRole('button', {name: variant.size, exact: true}).click();
      await waitSelected(variant);
      assert.match(
        await page.locator('.product-option__value[aria-pressed="true"]').first().innerText(),
        new RegExp('^'+variant.size+'(?:\\s|$)'),
        item.title + ': selected size visually matches SKU'
      );
      console.log('PASS SKU '+item.handle+' '+variant.size+' '+variant.sku);
    }
    console.log('PASS all sizes '+item.title);
  }

  const army = items.find(x=>x.title.startsWith('Army'));
  await load('/products/' + army.handle);
  await page.getByRole('button',{name:'M',exact:true}).click();
  await waitSelected(army.variants.find(x=>x.size==='M'));
  await page.locator('.product-purchase__add').first().click();
  await page.getByRole('dialog', {name:/Your cart/i}).waitFor({state:'visible',timeout:30000});
  await page.getByRole('group',{name:/Quantity for Army/}).waitFor({state:'visible',timeout:30000});
  assert.match(await page.locator('.cart-summary__subtotal').first().innerText(),/79\.00/);
  console.log('PASS add to cart Army M, $79');

  await page.getByRole('button',{name:/Increase quantity of Army/}).click();
  await page.waitForFunction(() => {
    const el=document.querySelector('.cart-main--aside .cart-summary__subtotal');
    return el && /Subtotal\s*\(2 items\)/.test(el.textContent) && /\$158\.00/.test(el.textContent);
  }, undefined, {timeout:30000});
  console.log('PASS quantity 1 to 2: subtotal $158');

  await page.getByRole('button',{name:/Decrease quantity of Army/}).click();
  await page.waitForFunction(() => {
    const el=document.querySelector('.cart-main--aside .cart-summary__subtotal');
    return el && /Subtotal\s*\(1 item\)/.test(el.textContent) && /\$79\.00/.test(el.textContent);
  }, undefined, {timeout:30000});
  console.log('PASS quantity 2 to 1: subtotal $79');

  await page.getByRole('button',{name:/Remove Army .* from cart/}).click();
  await page.locator('.cart-main--aside .cart-empty').waitFor({state:'visible', timeout:30000});
  console.log('PASS remove hoodie: cart empty');

  // Test a second product and a high-size variant, without completing an order.
  const fighter=items.find(x=>x.title.startsWith('Fighter'));
  await load('/products/'+fighter.handle);
  await page.getByRole('button',{name:'4XL',exact:true}).click();
  await waitSelected(fighter.variants.find(x=>x.size==='4XL'));
  await page.locator('.product-purchase__add').first().click();
  await page.getByRole('dialog',{name:/Your cart/i}).waitFor({state:'visible',timeout:30000});
  await page.getByRole('group',{name:/Quantity for Fighter/}).waitFor({state:'visible',timeout:30000});
  const summary=page.locator('.cart-main--aside .cart-summary__subtotal');
  assert.match(await summary.innerText(),/\$79\.00/);
  const checkout=page.locator('.cart-main--aside a.cart-checkout');
  const destination=await checkout.getAttribute('href');
  assert.ok(destination,'Shopify checkout URL must be present');
  const target=new URL(destination, deploymentUrl);
  assert.equal(target.protocol, 'https:');
  assert.ok(['checkout.render-lab.org','kn0xfa-4t.myshopify.com'].includes(target.hostname),
    'Unexpected checkout domain '+target.hostname);
  console.log('PASS Fighter 4XL checkout link domain '+target.hostname);

  // Proceed only to the Shopify-hosted checkout landing page. No customer info
  // or payment input, no checkout submission and no order creation.
  const checkoutPage=await context.newPage();
  const response=await checkoutPage.goto(target.toString(),{
    waitUntil:'domcontentloaded',
    timeout:45000,
  });
  const status=response?.status();
  console.log('CHECKOUT_HTTP_STATUS '+status);
  if (!status || status >= 400) {
    throw new Error('Checkout handoff returned HTTP '+status);
  }
  const finalUrl=new URL(checkoutPage.url());
  assert.equal(finalUrl.protocol,'https:');
  assert.ok(
    ['checkout.render-lab.org','kn0xfa-4t.myshopify.com'].includes(finalUrl.hostname),
    'Unexpected final checkout host '+finalUrl.hostname
  );
  console.log('PASS Shopify checkout landing without submitting payment');
  await checkoutPage.close();
} finally {
  await context.close();
  await browser.close();
}
