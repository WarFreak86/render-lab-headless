import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const base=process.env.DEPLOYMENT_URL;
const bypass=process.env.AUTH_BYPASS_TOKEN;
assert.ok(base && bypass, 'Private Oxygen Preview credentials required');
const folder='apparel-category-preview-shots';
await mkdir(folder,{recursive:true});

const browser=await chromium.launch({headless:true});
try {
  for(const width of [390,1440]){
    const context=await browser.newContext({
      viewport:{width,height:900},
      extraHTTPHeaders:{'oxygen-auth-bypass-token':bypass},
    });
    const page=await context.newPage();
    const visit=async(path)=>{
      const response=await page.goto(new URL(path,base).toString(),{
        waitUntil:'domcontentloaded',
        timeout:45000,
      });
      assert.equal(response?.status(),200,path+' must return 200');
      await page.locator('h1').waitFor({state:'visible'});
      await page.waitForTimeout(350);
    };
    await visit('/apparel');
    assert.match(await page.locator('h1').innerText(),/Art you\s+wear/i);
    const categories=page.locator('.apparel-category-card > a');
    assert.equal(await categories.count(),1,'Only currently published Hoodies category should appear');
    assert.equal(await categories.first().getAttribute('href'),'/apparel/hoodies');
    assert.equal(await page.getByText('T-Shirts',{exact:true}).count(),0,'No unpublished category cards');
    const categoryImage=page.locator('.apparel-category-card__media img');
    await categoryImage.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{
      const image=document.querySelector('.apparel-category-card__media img');
      return image && image.complete && image.naturalWidth>0;
    },undefined,{timeout:20000});
    await page.evaluate(()=>window.scrollTo(0,0));
    const over=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(over<=2,'Department overflows viewport at '+width+': '+over);
    await page.screenshot({path:folder+'/apparel-hub-'+width+'.png',fullPage:true,animations:'disabled'});
    console.log('PASS hub '+width+': one Hoodies category card, published image, no overflow');

    await visit('/apparel/hoodies');
    assert.match(await page.locator('h1').innerText(),/Graphic\s+hoodies/i);
    assert.equal(await page.locator('.apparel-card > a').count(),6,'All six hoodies appear separately');
    const hoodiesOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(hoodiesOverflow<=2,'Hoodie category overflow at '+width);
    await page.screenshot({path:folder+'/hoodies-'+width+'.png',fullPage:true,animations:'disabled'});
    console.log('PASS category '+width+': six Hoodies products and correct heading');

    await visit('/products/sunset-patrol-graphic-hoodie');
    const hoodiesBreadcrumb=page.locator('nav[aria-label="Breadcrumb"] a[href="/apparel/hoodies"]');
    assert.equal(await hoodiesBreadcrumb.count(),1,'Hoodies product breadcrumb required');
    console.log('PASS PDP breadcrumb '+width+': Apparel / Hoodies');
    if(width===390){
      await page.screenshot({path:folder+'/hoodies-pdp-390.png',fullPage:true,animations:'disabled'});
    }
    await context.close();
  }
  const request=await browser.newContext({
    extraHTTPHeaders:{'oxygen-auth-bypass-token':bypass},
  });
  const response=await request.request.get(new URL('/collections/hoodies',base).toString(),{
    maxRedirects:0,timeout:30000,
  });
  assert.equal(response.status(),301,'Shopify collection must redirect');
  assert.equal(new URL(response.headers()['location'],base).pathname,'/apparel/hoodies');
  console.log('PASS /collections/hoodies permanent redirect to /apparel/hoodies');
  await request.close();
}finally{await browser.close();}
