import { chromium } from 'playwright';
const base = 'http://localhost:4517';
const H = {'Content-Type':'application/json'};
const draftFixture = {scopeId:'9908358d-3f92-4fd1-a476-2df6fd720982',summary:'Bakery website redesign - FIXTURE DATA for UI screenshot, not a live AI result',state:'REVIEWED_FOR_SANDBOX',reviewedAt:'2026-10-23T09:11:19Z',deliverables:[{description:'Five-page responsive website',evidence:'we need a 5 page site with online ordering for our bakery'}],questions:['Which payment provider should the ordering flow use?'],conflicts:[]};
const ORDER = {requestId:'idempotency-0123456789',orderId:'ORDER12345',state:'COMPLETED',scopeId:draftFixture.scopeId,captureId:'CAPTURE123',createdAt:'2026-10-23T09:00:00Z',completedAt:'2026-10-23T09:01:00Z',timeline:[{type:'ORDER_CREATED',at:'2026-10-23T09:00:00Z',payload:{orderId:'ORDER12345',amount:'10.00',currency:'USD'}},{type:'ORDER_COMPLETED',at:'2026-10-23T09:01:00Z',payload:{captureId:'CAPTURE123',amount:'10.00',currency:'USD'}}],ledger:[{account:'paypal_sandbox_clearing',direction:'DEBIT',amount:'10.00',currency:'USD',memo:'Sandbox capture CAPTURE123'},{account:'demo_revenue',direction:'CREDIT',amount:'10.00',currency:'USD',memo:'Fixed sandbox demo item'}]};
const MOCK_SDK_OK = `window.paypal={createInstance:async()=>({findEligibleMethods:async()=>({isEligible:()=>true}),createPayPalOneTimePaymentSession:async(h)=>({start:async()=>{setTimeout(()=>h.onApprove({orderId:'MOCK-ORDER-LABELLED'}),300);}})})};`;
async function stubApi(page,{sdk=false}={}) {
  await page.addInitScript(()=>{try{sessionStorage.setItem('sp-intro-seen','1')}catch(e){}});
  await page.route('**/api/**', r => r.fulfill({status:200, headers:H, body:'{}'}));
  await page.route('**/api/scopes/extract', r => r.fulfill({status:200, headers:H, body:JSON.stringify(draftFixture)}));
  await page.route('**/api/scopes/*/review', r => r.fulfill({status:200, headers:H, body:JSON.stringify({scopeId:draftFixture.scopeId})}));
  await page.route('**/api/config', r => r.fulfill({status:200, headers:H, body: JSON.stringify(sdk?{clientId:'mock-labelled-fixture', sku:'sandbox-demo', demoTools:true, aiMode:'fixture', orderRecovery:true}:{sku:'sandbox-demo', demoTools:true, aiMode:'fixture', orderRecovery:true})}));
  await page.route('**/api/receipts', r => r.fulfill({status:200, headers:H, body:JSON.stringify({drafts:[draftFixture], orders:[ORDER], refundRequests:[]})}));
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
const overflow = p => p.evaluate(() => ({ok: document.documentElement.scrollWidth <= window.innerWidth}));
async function shot(name, w, h, mobile, fn, settle=400) {
  const ctx = await browser.newContext({viewport:{width:w,height:h}, deviceScaleFactor:2, ...(mobile?{isMobile:true,hasTouch:true}:{})});
  const page = await ctx.newPage();
  await fn(page);
  await page.waitForTimeout(settle);
  console.log(name, 'overflow-ok:', JSON.stringify(await overflow(page)));
  await page.screenshot({path:`/downloads/nocap-shots/${name}.png`});
  await ctx.close();
}
// 1. Custom cursor hot over the CTA (ring enlarged + dot)
await shot('cursor-hot-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'});
  const b = await p.getByRole('link', {name:'Start a brief'}).boundingBox();
  await p.mouse.move(b.x + b.width/2, b.y + b.height/2, {steps: 8});
  await p.waitForTimeout(700);
});
// 2. KPI tilt + spotlight: pointer at a KPI corner
await shot('kpi-tilt-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'});
  const b = await p.locator('.kpi.panel').first().boundingBox();
  await p.mouse.move(b.x + 30, b.y + 28, {steps: 8});
  await p.waitForTimeout(600);
});
// 3. Scroll progress bar mid-page
await shot('scroll-progress-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'});
  await p.evaluate(()=>window.scrollTo(0, document.documentElement.scrollHeight*0.55));
  await p.waitForTimeout(400);
});
// 4. Ember burst on successful capture (success-mock SDK, real hold-to-pay)
await shot('payment-burst-desktop', 1440, 900, false, async p => {
  await stubApi(p,{sdk:true});
  const pg = await driveToReview(p);
  await pg.getByRole('checkbox').click();
  await pg.getByRole('button', {name:'Save my review'}).click();
  const hold = p.locator('.hold-btn');
  await hold.waitFor();
  await p.waitForTimeout(1500);
  const hb = await hold.boundingBox();
  await p.mouse.move(hb.x + hb.width/2, hb.y + hb.height/2);
  await p.mouse.down();
  await p.waitForTimeout(1300);
  await p.mouse.up();
  await p.waitForTimeout(1400);
}, 300);
// 5. Copy chip in order dialog
await shot('receipts-copy-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/receipts', {waitUntil:'networkidle'});
  await p.getByRole('tab', {name:'Orders and captures'}).click();
  await p.locator('.ag-row').first().click();
  await p.getByText('Payment timeline').waitFor();
});
// 6. Home mobile sanity (cursor suite must not appear / no overflow)
await shot('home-wave4-mobile', 390, 844, true, async p => { await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'}); });
await browser.close();
console.log('WAVE4 DONE');
