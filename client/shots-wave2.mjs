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
async function stubApi(page) {
  await page.route('**/api/**', r => r.fulfill({status:200, headers:H, body:'{}'}));
  await page.route('**/api/scopes/extract', r => r.fulfill({status:200, headers:H, body:JSON.stringify(draftFixture)}));
  await page.route('**/api/config', r => r.fulfill({status:200, headers:H, body: JSON.stringify({sku:'sandbox-demo', demoTools:true, aiMode:'fixture', orderRecovery:true})}));
}
const browser = await chromium.launch({channel:'chrome'});
const overflow = p => p.evaluate(() => ({ok: document.documentElement.scrollWidth <= window.innerWidth}));
async function shot(name, w, h, mobile, fn) {
  const ctx = await browser.newContext({viewport:{width:w,height:h}, deviceScaleFactor:2, ...(mobile?{isMobile:true,hasTouch:true}:{})});
  const page = await ctx.newPage();
  await fn(page);
  await page.waitForTimeout(700);
  console.log(name, 'overflow-ok:', JSON.stringify(await overflow(page)));
  await page.screenshot({path:`/downloads/nocap-shots/${name}.png`});
  await ctx.close();
}
// Home with cursor spotlight over the middle KPI panel + marquee visible
await shot('home-spotlight-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'});
  const kpi = p.locator('.kpi.panel').nth(1);
  const b = await kpi.boundingBox();
  await p.mouse.move(b.x + b.width*0.6, b.y + b.height*0.45, {steps: 8});
  await p.waitForTimeout(500);
});
// Dock magnification: pointer over the middle dock icon
await shot('dock-mag-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'});
  const icon = p.locator('.dock a').nth(2);
  const b = await icon.boundingBox();
  await p.mouse.move(b.x + b.width/2, b.y + b.height/2, {steps: 10});
  await p.waitForTimeout(450);
});
// Home mobile: marquee + gradient word
await shot('home-wave2-mobile', 390, 844, true, async p => { await stubApi(p); await p.goto(base+'/', {waitUntil:'networkidle'}); });
// Review page: border beam on the acknowledge card
await shot('review-beam-desktop', 1440, 900, false, async p => {
  await stubApi(p); await p.goto(base+'/brief', {waitUntil:'networkidle'});
  await p.locator('#brief').fill('We need a 5 page site with online ordering for our bakery, customers should pick a pickup time.');
  await p.getByRole('button', {name:'Extract a draft'}).click();
  await p.getByRole('checkbox').waitFor();
  await p.locator('.beam').scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
});
await browser.close();
console.log('WAVE2 DONE');
