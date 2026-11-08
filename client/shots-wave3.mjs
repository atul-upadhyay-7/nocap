import { chromium } from 'playwright';
const base = 'http://localhost:4517';
const H = {'Content-Type':'application/json'};
const draftFixture = {scopeId:'9908358d-3f92-4fd1-a476-2df6fd720982',summary:'Bakery website redesign - FIXTURE DATA for UI screenshot, not a live AI result',state:'REVIEWED_FOR_SANDBOX',reviewedAt:'2026-10-23T09:11:19Z',deliverables:[{description:'Five-page responsive website (home, menu, about, order, contact)',evidence:'we need a 5 page site with online ordering for our bakery'},{description:'Online ordering flow with pickup time selection',evidence:'customers should pick a pickup time when they order'},{description:'Photo gallery of products supplied by the client',evidence:'we will send you our product photos'}],questions:['Which payment provider should the ordering flow use?'],conflicts:[]};
const ORDER = {requestId:'idempotency-0123456789',orderId:'ORDER12345',state:'COMPLETED',scopeId:draftFixture.scopeId,captureId:'CAPTURE123',createdAt:'2026-10-23T09:00:00Z',completedAt:'2026-10-23T09:01:00Z',timeline:[{type:'ORDER_CREATED',at:'2026-10-23T09:00:00Z',payload:{orderId:'ORDER12345',amount:'10.00',currency:'USD'}},{type:'ORDER_APPROVED',at:'2026-10-23T09:00:30Z',payload:{}},{type:'ORDER_COMPLETED',at:'2026-10-23T09:01:00Z',payload:{captureId:'CAPTURE123',amount:'10.00',currency:'USD'}}],ledger:[{account:'paypal_sandbox_clearing',direction:'DEBIT',amount:'10.00',currency:'USD',memo:'Sandbox capture CAPTURE123'},{account:'demo_revenue',direction:'CREDIT',amount:'10.00',currency:'USD',memo:'Fixed sandbox demo item'}]};
async function stubApi(page,{skipIntro=true}={}) {
  if(skipIntro) await page.addInitScript(()=>{try{sessionStorage.setItem('sp-intro-seen','1')}catch(e){}});
  await page.route('**/api/**', r => r.fulfill({status:200, headers:H, body:'{}'}));
  await page.route('**/api/config', r => r.fulfill({status:200, headers:H, body:JSON.stringify({sku:'sandbox-demo', demoTools:true, aiMode:'fixture', orderRecovery:true})}));
  await page.route('**/api/receipts', r => r.fulfill({status:200, headers:H, body:JSON.stringify({drafts:[draftFixture], orders:[ORDER], refundRequests:[]})}));
}
const browser = await chromium.launch({channel:'chrome'});
const overflow = p => p.evaluate(() => ({ok: document.documentElement.scrollWidth <= window.innerWidth}));
async function shot(name, w, h, mobile, fn, settle=500) {
  const ctx = await browser.newContext({viewport:{width:w,height:h}, deviceScaleFactor:2, ...(mobile?{isMobile:true,hasTouch:true}:{})});
  const page = await ctx.newPage();
  await fn(page);
  await page.waitForTimeout(settle);
  console.log(name, 'overflow-ok:', JSON.stringify(await overflow(page)));
  await page.screenshot({path:`/downloads/nocap-shots/${name}.png`});
  await ctx.close();
}
// 1. Intro loader mid-form (no skip flag)
await shot('intro-loader-desktop', 1440, 900, false, async p => {
  await stubApi(p,{skipIntro:false});
  await p.goto(base+'/', {waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1150);
}, 0);
// 2. Gather field: pointer over hero right side
await shot('home-gather-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'});
  await p.mouse.move(760, 330, {steps: 6});
  await p.waitForTimeout(800);
});
// 3. Magnetic CTA + gradient button: pointer near the button edge
await shot('home-magnetic-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'});
  const btn = p.getByRole('link', {name:'Start a brief'});
  const b = await btn.boundingBox();
  await p.mouse.move(b.x + b.width - 6, b.y + b.height/2, {steps: 6});
  await p.waitForTimeout(500);
});
// 4. Ripple mid-bloom on the CTA
await shot('home-ripple-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'});
  const btn = p.getByRole('link', {name:'Start a brief'});
  const b = await btn.boundingBox();
  await p.mouse.move(b.x + b.width/2, b.y + b.height/2);
  await p.mouse.down();
  await p.waitForTimeout(260);
}, 0);
// 5. Receipts tabs glider
await shot('receipts-tabs-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/receipts', {waitUntil:'networkidle'});
  await p.getByRole('tab', {name:'Orders and captures'}).click();
  await p.waitForTimeout(400);
});
// 6. Order dialog: daisyUI steps + packet mid-run
await shot('receipts-order-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/receipts', {waitUntil:'networkidle'});
  await p.getByRole('tab', {name:'Orders and captures'}).click();
  await p.locator('.ag-row').first().click();
  await p.getByText('Payment timeline').waitFor();
  await p.waitForTimeout(950);
}, 0);
// 7. Order dialog mobile
await shot('receipts-order-mobile', 390, 844, true, async p => {
  await stubApi(p); await p.goto(base+'/receipts', {waitUntil:'networkidle'});
  await p.getByRole('tab', {name:'Orders and captures'}).click();
  await p.locator('.ag-row').first().click();
  await p.getByText('Payment timeline').waitFor();
  await p.waitForTimeout(950);
}, 0);
// 8. Home mobile (pulse chip, gradient CTA)
await shot('home-wave3-mobile', 390, 844, true, async p => { await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'}); });
await browser.close();
console.log('WAVE3 DONE');
