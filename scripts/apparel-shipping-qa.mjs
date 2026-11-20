import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=process.env.DEPLOYMENT_URL;
const bypass=process.env.AUTH_BYPASS_TOKEN;
assert.ok(base && bypass,'Private Oxygen preview credentials are required');

const quoteResponse=await fetch(new URL('/qa-shipping',base),{
  method:'POST',
  headers:{'oxygen-auth-bypass-token':bypass,'Content-Type':'application/json'},
  body:'{}',
});
assert.equal(quoteResponse.status,200,'Shopify quote endpoint HTTP status');
const quote=await quoteResponse.json();
for(const result of quote.results??[]) {
  // Cart identifiers, tokens and full addresses are never printed.
  console.log('SHIPPING_QUOTE',JSON.stringify(result));
}
const PA=quote.results?.find(x=>x.region==='PA mainland');
const AK=quote.results?.find(x=>x.region==='AK remote');
const HI=quote.results?.find(x=>x.region==='HI remote');
for(const region of [PA,AK,HI]) {
  assert.ok(region,'Missing shipping region result');
  assert.equal(region.phase,'rates',region.region+' did not calculate');
  assert.deepEqual(region.userErrors,[],region.region+' Shopify cart error');
  assert.ok(region.groups?.length,region.region+' has no delivery groups');
  assert.ok(region.groups.every(g=>g.options.length>0),region.region+' has no delivery options');
}
function availableCosts(region) {
  return region.groups.flatMap(g=>g.options.map(o=>Number(o.cost)));
}
assert.ok(availableCosts(PA).includes(0),'Mainland shipping does not quote $0');
assert.ok(availableCosts(AK).includes(16.5),'Alaska shipping does not quote $16.50');
assert.ok(availableCosts(HI).includes(16.5),'Hawaii shipping does not quote $16.50');
console.log('PASS PA $0, AK $16.50, HI $16.50 Shopify Storefront cart delivery quotes');

const browser=await chromium.launch({headless:true});
try {
  for(const width of [390,430]) {
    const context=await browser.newContext({
      viewport:{width,height:850},
      extraHTTPHeaders:{'oxygen-auth-bypass-token':bypass},
    });
    const page=await context.newPage();
    const res=await page.goto(new URL('/apparel',base).toString(),{
      waitUntil:'domcontentloaded',timeout:45000,
    });
    assert.equal(res?.status(),200);
    await page.waitForLoadState('load',{timeout:30000});
    await page.waitForTimeout(1400);
    const trigger=page.getByRole('button',{name:'Open menu'});
    await trigger.waitFor({state:'visible'});
    await trigger.click();
    await page.getByRole('dialog',{name:'MENU'}).waitFor({state:'visible',timeout:10000});
    const menu=page.getByRole('navigation',{name:'Mobile navigation'});
    await menu.waitFor({state:'visible',timeout:10000});
    const link=menu.getByRole('link',{name:'Apparel'});
    assert.equal(await link.isVisible(),true,width+'px apparel link visible');
    await link.click();
    await page.waitForURL(url=>url.pathname==='/apparel');
    await page.getByRole('dialog',{name:'MENU'}).waitFor({state:'hidden',timeout:10000});
    console.log('PASS mobile nav Apparel link '+width+'px');
    await context.close();
  }
}finally{await browser.close();}
