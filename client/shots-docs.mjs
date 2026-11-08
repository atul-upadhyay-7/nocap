import { chromium } from 'playwright';
const base = 'http://localhost:4517';
const H = {'Content-Type':'application/json'};
const draftFixture = {scopeId:'9908358d-3f92-4fd1-a476-2df6fd720982',summary:'Bakery website redesign - FIXTURE DATA for UI screenshot, not a live AI result',state:'REVIEWED_FOR_SANDBOX',reviewedAt:'2026-10-23T09:11:19Z',deliverables:[{description:'Five-page responsive website',evidence:'we need a 5 page site with online ordering for our bakery'}],questions:['Which payment provider should the ordering flow use?'],conflicts:[]};
const MOCK_SDK_OK = `window.paypal={createInstance:async()=>({findEligibleMethods:async()=>({isEligible:()=>true}),createPayPalOneTimePaymentSession:async(h)=>({start:async()=>{setTimeout(()=>h.onApprove({orderId:'MOCK-ORDER-LABELLED'}),300);}})})};`;
async function stubApi(page,{sdk=false}={}) {
  await page.addInitScript(()=>{try{sessionStorage.setItem('sp-intro-seen','1')}catch(e){}});
  await page.route('**/api/**', r => r.fulfill({status:200, headers:H, body:'{}'}));
  await page.route('**/api/scopes/extract', r => r.fulfill({status:200, headers:H, body:JSON.stringify(draftFixture)}));
  await page.route('**/api/scopes/*/review', r => r.fulfill({status:200, headers:H, body:JSON.stringify({scopeId:draftFixture.scopeId})}));
  await page.route('**/api/config', r => r.fulfill({status:200, headers:H, body: JSON.stringify(sdk?{clientId:'mock-labelled-fixture', sku:'sandbox-demo', demoTools:true, aiMode:'fixture', orderRecovery:true}:{sku:'sandbox-demo', demoTools:true, aiMode:'fixture', orderRecovery:true})}));
  await page.route('**/api/receipts', r => r.fulfill({status:200, headers:H, body:JSON.stringify({drafts:[draftFixture], orders:[], refundRequests:[]})}));
  if (sdk) {
    await page.route('**/web-sdk/v6/core**', r => r.fulfill({status:200, headers:{'Content-Type':'application/javascript'}, body:MOCK_SDK_OK}));
    await page.route('**/api/orders', r => r.fulfill({status:200, headers:H, body:JSON.stringify({orderId:'MOCK-ORDER-LABELLED', status:'CREATED'})}));
    await page.route('**/api/orders/*/capture', r => r.fulfill({status:200, headers:H, body:JSON.stringify({status:'COMPLETED', captureId:'CAPTURE999'})}));
  }
}
async function driveToReview(page) {
  await page.goto(base + '/brief', {waitUntil:'networkidle'});
  await page.locator('#brief').fill('We need a 5 page site with online ordering for our bakery.');
  await page.getByRole('button', {name:'Extract a draft'}).click();
  await page.getByRole('checkbox').waitFor();
  return page;
}
const browser = await chromium.launch({channel:'chrome'});
async function shot(name, w, h, mobile, fn) {
  const ctx = await browser.newContext({viewport:{width:w,height:h}, deviceScaleFactor:2, ...(mobile?{isMobile:true,hasTouch:true}:{})});
  const page = await ctx.newPage();
  await fn(page);
  await page.waitForTimeout(500);
  await page.screenshot({path:`../docs/${name}.png`});
  console.log(name, 'ok');
  await ctx.close();
}
await shot('screenshot-review-desktop', 1440, 900, false, async p => { await stubApi(p); await driveToReview(p); });
await shot('screenshot-review-mobile', 390, 844, true, async p => { await stubApi(p); await driveToReview(p); });
await shot('screenshot-order-desktop', 1440, 900, false, async p => {
  await stubApi(p,{sdk:true});
  await driveToReview(p);
  await p.getByRole('checkbox').click();
  await p.getByRole('button', {name:'Save my review'}).click();
  await p.locator('.hold-btn').waitFor();
  await p.waitForTimeout(1200);
});
await shot('screenshot-order-mobile', 390, 844, true, async p => {
  await stubApi(p,{sdk:true});
  await driveToReview(p);
  await p.getByRole('checkbox').click();
  await p.getByRole('button', {name:'Save my review'}).click();
  await p.locator('.hold-btn').waitFor();
  await p.waitForTimeout(1200);
});
await browser.close();
console.log('DOCS SHOTS DONE');
