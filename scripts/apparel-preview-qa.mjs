import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const deploymentUrl = process.env.DEPLOYMENT_URL;
const authBypassToken = process.env.AUTH_BYPASS_TOKEN;
assert.ok(deploymentUrl && authBypassToken, 'Oxygen Preview URL and temporary authentication token are required');

const widths = [390, 430, 768, 1024, 1280, 1440, 1920];
const products = [
  ['sunset-patrol-graphic-hoodie', 'Army'],
  ['deathwalkers-skull-hoodie', 'Deathwalkers'],
  ['flag-raising-fleece-hoodie', 'Marines'],
  ['ronin-samurai-fleece-hoodie', 'Ronin'],
  ['astro-skeleton-astronaut-hoodie', 'Astro'],
  ['fighter-jet-graphic-hoodie', 'Fighter'],
];
const output = 'apparel-qa-screenshots';
await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true});

async function openPage(path, width = 390) {
  const context = await browser.newContext({
    viewport: {width, height: 900},
    extraHTTPHeaders: {'oxygen-auth-bypass-token': authBypassToken},
  });
  const page = await context.newPage();
  const response = await page.goto(new URL(path, deploymentUrl).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  assert.equal(response?.status(), 200, path + ' must return HTTP 200');
  return {page, context};
}

try {
  for (const width of widths) {
    const {page, context} = await openPage('/apparel', width);
    const heading = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ');
    assert.match(heading, /Art you wear\./i, width + 'px hero heading');

    const hrefs = await page.locator('.apparel-card > a').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    );
    assert.equal(hrefs.length, products.length, width + 'px apparel card count');
    assert.equal(new Set(hrefs).size, products.length, width + 'px unique PDP links');
    for (const [handle] of products) {
      assert.ok(hrefs.includes('/products/' + handle), width + 'px missing ' + handle);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert.ok(overflow <= 2, width + 'px document overflows by ' + overflow + 'px');

    assert.equal(
      await page.locator('.apparel-card__media img').count(),
      products.length,
      width + 'px garment images',
    );
    await page.screenshot({
      path: output + '/apparel-' + width + '.png',
      fullPage: true,
      animations: 'disabled',
      timeout: 45000,
    });
    console.log('PASS apparel ' + width + 'px: six unique images and links; no horizontal overflow');
    await context.close();
  }

  const {page, context} = await openPage('/products/sunset-patrol-graphic-hoodie', 390);
  for (const [handle, name] of products) {
    if (handle !== products[0][0]) {
      const result = await page.goto(new URL('/products/' + handle, deploymentUrl).toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      assert.equal(result?.status(), 200, name + ' PDP HTTP status');
    }
    assert.match(
      (await page.locator('h1#product-title').innerText()).replace(/\s+/g, ' '),
      new RegExp(name, 'i'),
      name + ' full product title',
    );
    assert.equal(await page.locator('#garment-size-guide').count(), 1, name + ' size chart');
    assert.equal(
      await page.locator('.product-purchase__add').first().isDisabled(),
      true,
      name + ' should require a deliberate size selection',
    );
    assert.equal(
      await page.getByRole('link', {name: /View size chart and measurements/}).count(),
      1,
      name + ' visible measurement link',
    );
    console.log('PASS ' + name + ' PDP: HTTP 200, size guide and size-selection gate');
  }

  await page.goto(new URL('/products/sunset-patrol-graphic-hoodie', deploymentUrl).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await page.getByRole('link', {name: /View size chart and measurements/}).click();
  assert.equal(
    await page.locator('#garment-size-guide').evaluate((element) => element.open),
    true,
    'Supplier size chart should open on measurement-link click',
  );

  await page.getByRole('button', {name: 'M', exact: true}).click();
  await page.waitForFunction(() => {
    const button = document.querySelector('.product-purchase__add');
    return button && !button.disabled;
  }, undefined, {timeout: 15000});

  await page.screenshot({
    path: output + '/army-pdp-size-guide-390.png',
    fullPage: true,
    animations: 'disabled',
    timeout: 45000,
  });

  await page.locator('.product-purchase__add').first().click();
  await page.getByRole('dialog', {name: /Your cart/i}).waitFor({
    state: 'visible',
    timeout: 30000,
  });
  console.log('PASS Army M: selection enables cart, Shopify add opens cart drawer');
  await context.close();
} finally {
  await browser.close();
}
