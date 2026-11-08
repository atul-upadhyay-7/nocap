import { chromium } from 'playwright';
const base = 'http://localhost:4517';
const H = {'Content-Type':'application/json'};
async function stubApi(page) {
  await page.route('**/api/**', r => r.fulfill({status:200, headers:H, body:'{}'}));
  await page.route('**/api/config', r => r.fulfill({status:200, headers:H, body: JSON.stringify({sku:'sandbox-demo', demoTools:true, aiMode:'fixture', orderRecovery:true})}));
  await page.route('**/api/receipts', r => r.fulfill({status:200, headers:H, body:JSON.stringify({drafts:[], orders:[], refundRequests:[]})}));
}
const browser = await chromium.launch({channel:'chrome'});
// 1. Intro loader wordmark (fresh session, no sp-intro-seen)
{
  const ctx = await browser.newContext({viewport:{width:1440,height:900}, deviceScaleFactor:2});
  const page = await ctx.newPage();
  await stubApi(page);
  await page.goto(base+'/', {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2400);
  await page.screenshot({path:'/downloads/nocap-shots/rebrand-intro-desktop.png'});
  await ctx.close();
}
// 2. Home topbar brand, desktop
{
  const ctx = await browser.newContext({viewport:{width:1440,height:900}, deviceScaleFactor:2});
  const page = await ctx.newPage();
  await page.addInitScript(()=>{try{sessionStorage.setItem('sp-intro-seen','1')}catch(e){}});
  await stubApi(page);
  await page.goto(base+'/', {waitUntil:'networkidle'});
  await page.waitForTimeout(600);
  console.log('overflow-ok:', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({path:'/downloads/nocap-shots/rebrand-home-desktop.png'});
  await ctx.close();
}
// 3. Mobile home brand
{
  const ctx = await browser.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true});
  const page = await ctx.newPage();
  await page.addInitScript(()=>{try{sessionStorage.setItem('sp-intro-seen','1')}catch(e){}});
  await stubApi(page);
  await page.goto(base+'/', {waitUntil:'networkidle'});
  await page.waitForTimeout(600);
  console.log('mobile overflow-ok:', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({path:'/downloads/nocap-shots/rebrand-home-mobile.png'});
  await ctx.close();
}
await browser.close();
