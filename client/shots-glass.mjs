import { chromium } from 'playwright';
const base = 'http://localhost:4517';
const H = {'Content-Type':'application/json'};
const draftFixture = {
  scopeId: '9908358d-3f92-4fd1-a476-2df6fd720982',
  summary: 'Bakery website redesign - FIXTURE DATA for UI screenshot, not a live AI result',
  state: 'REVIEWED_FOR_SANDBOX',
  reviewedAt: '2026-10-23T09:11:19Z',
  deliverables: [
    {description: 'Five-page responsive website (home, menu, about, order, contact)', evidence: 'we need a 5 page site with online ordering for our bakery'},
    {description: 'Online ordering flow with pickup time selection', evidence: 'customers should pick a pickup time when they order'},
    {description: 'Photo gallery of products supplied by the client', evidence: 'we will send you our product photos'}
  ],
  questions: ['Which payment provider should the ordering flow use?', 'Is hosting included or billed separately?'],
  conflicts: [{description: 'Timeline conflict: brief asks for launch in 2 weeks but also requests a full custom design.', evidence: ['launch in 2 weeks', 'fully custom design, no templates']}]
};
const ORDER = {requestId:'idempotency-0123456789', orderId:'ORDER12345', state:'COMPLETED', scopeId:draftFixture.scopeId, captureId:'CAPTURE123', createdAt:'2026-10-23T09:00:00Z', completedAt:'2026-10-23T09:01:00Z', timeline:[{type:'ORDER_CREATED', at:'2026-10-23T09:00:00Z', payload:{orderId:'ORDER12345', amount:'10.00', currency:'USD'}},{type:'ORDER_COMPLETED', at:'2026-10-23T09:01:00Z', payload:{captureId:'CAPTURE123', amount:'10.00', currency:'USD'}}], ledger:[
 {account:'paypal_sandbox_clearing', direction:'DEBIT', amount:'10.00', currency:'USD', memo:'Sandbox capture CAPTURE123'},
 {account:'demo_revenue', direction:'CREDIT', amount:'10.00', currency:'USD', memo:'Fixed sandbox demo item'}]};
const MOCK_SDK = `window.paypal={createInstance:async()=>({findEligibleMethods:async()=>({isEligible:()=>true}),createPayPalOneTimePaymentSession:async(h)=>({start:async()=>{setTimeout(()=>h.onCancel(),400);}})})};`;
async function stubApi(page, {sdk=false, receipts=true}={}) {
  await page.route('**/api/**', r => r.fulfill({status:200, headers:H, body:'{}'}));
  await page.route('**/api/scopes/*/review', r => r.fulfill({status:200, headers:H, body:JSON.stringify({scopeId:draftFixture.scopeId})}));
  await page.route('**/api/scopes/extract', r => r.fulfill({status:200, headers:H, body:JSON.stringify(draftFixture)}));
  await page.route('**/api/config', r => r.fulfill({status:200, headers:H, body: JSON.stringify(sdk?{clientId:'mock-labelled-fixture', sku:'sandbox-demo', demoTools:true, aiMode:'fixture', orderRecovery:true}:{sku:'sandbox-demo', demoTools:true, aiMode:'fixture', orderRecovery:true})}));
  if (receipts) await page.route('**/api/receipts', r => r.fulfill({status:200, headers:H, body:JSON.stringify({drafts:[draftFixture], orders:[ORDER], refundRequests:[]})}));
  if (sdk) {
    await page.route('**/web-sdk/v6/core**', r => r.fulfill({status:200, headers:{'Content-Type':'application/javascript'}, body:MOCK_SDK}));
    await page.route('**/api/orders', r => r.fulfill({status:200, headers:H, body:JSON.stringify({orderId:'MOCK-ORDER-LABELLED', status:'CREATED'})}));
  }
}
async function driveToPayment(page) {
  await page.goto(base + '/brief', {waitUntil:'networkidle'});
  await page.locator('#brief').fill('We need a 5 page site with online ordering for our bakery, customers should pick a pickup time.');
  await page.getByRole('button', {name:'Extract a draft'}).click();
  await page.getByRole('checkbox').waitFor();
  return page;
}
const browser = await chromium.launch({channel:'chrome'});
const overflow = p => p.evaluate(() => ({ok: document.documentElement.scrollWidth <= window.innerWidth}));
async function shot(name, w, h, mobile, fn) {
  const ctx = await browser.newContext({viewport:{width:w,height:h}, deviceScaleFactor:2, ...(mobile?{isMobile:true,hasTouch:true}:{})});
  const page = await ctx.newPage();
  await fn(page);
  await page.waitForTimeout(900);
  console.log(name, 'overflow-ok:', JSON.stringify(await overflow(page)));
  await page.screenshot({path:`/downloads/nocap-shots/${name}.png`});
  await ctx.close();
}
// Home
await shot('home-desktop', 1440, 900, false, async p => { await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'}); });
await shot('home-mobile', 390, 844, true, async p => { await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'}); });
// Brief
await shot('brief-desktop', 1440, 900, false, async p => { await stubApi(p); await p.goto(base+'/brief', {waitUntil:'networkidle'}); });
// Review (driven)
await shot('review-desktop', 1440, 900, false, async p => { await stubApi(p); await driveToPayment(p); await p.waitForTimeout(600); });
await shot('review-mobile', 390, 844, true, async p => { await stubApi(p); await driveToPayment(p); await p.waitForTimeout(600); });
// Payment (driven, mock SDK)
await shot('payment-desktop', 1440, 900, false, async p => { await stubApi(p,{sdk:true}); const pg = await driveToPayment(p); await pg.getByRole('checkbox').click(); await pg.getByRole('button', {name:'Save my review'}).click(); await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(5200); });
await shot('payment-mobile', 390, 844, true, async p => { await stubApi(p,{sdk:true}); const pg = await driveToPayment(p); await pg.getByRole('checkbox').click(); await pg.getByRole('button', {name:'Save my review'}).click(); await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(5200); });
// Receipts + order dialog
await shot('receipts-desktop', 1440, 900, false, async p => { await stubApi(p); await p.goto(base+'/receipts', {waitUntil:'networkidle'}); });
await shot('receipts-order-desktop', 1440, 900, false, async p => { await stubApi(p); await p.goto(base+'/receipts', {waitUntil:'networkidle'}); await p.getByRole('tab', {name:'Orders and captures'}).click(); await p.locator('.ag-row').first().click(); await p.getByText('Payment timeline').waitFor(); await p.waitForTimeout(500); });
await shot('receipts-mobile', 390, 844, true, async p => { await stubApi(p); await p.goto(base+'/receipts', {waitUntil:'networkidle'}); });
await browser.close();
console.log('ALL DONE');
