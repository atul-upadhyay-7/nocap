import { chromium } from 'playwright';
import fs from 'node:fs';

// Live-deploy flow check against the real Render API. No stubs.
const OUT = '/downloads/audit-live';
fs.mkdirSync(OUT, { recursive: true });
const base = 'https://nocap-app-9dzx.onrender.com';
const BRIEF = 'Demo brief (synthetic example): build a two-page website for a bakery with a menu page listing all cakes and breads and a contact page with a working contact form. No online ordering.';
const browser = await chromium.launch({ channel: 'chrome' });
const notes = [];

for (const w of [390, 1440]) {
  const mobile = w < 720;
  const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? 780 : 900 }, deviceScaleFactor: 2, ...(mobile ? { isMobile: true, hasTouch: true } : {}) });
  const page = await ctx.newPage();
  const ov = async label => {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    if (o.sw > o.iw) notes.push(`OVERFLOW live ${label} @${w}: ${o.sw}>${o.iw}`);
  };
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/live-home-${w}.png` }); await ov('home');
  await page.goto(base + '/brief', { waitUntil: 'networkidle' });
  const prefill = await page.locator('#brief').inputValue();
  notes.push(`live prefill @${w}: "${prefill.slice(0, 60)}..." (${prefill.length} chars)`);
  await page.locator('#brief').fill(BRIEF);
  await page.getByRole('button', { name: 'Extract a draft' }).click();
  try {
    await page.getByRole('checkbox').waitFor({ timeout: 20000 });
    notes.push(`live extract @${w}: draft rendered`);
  } catch { notes.push(`live extract @${w}: NO DRAFT (check aiMessage)`); }
  await page.screenshot({ path: `${OUT}/live-review-${w}.png` }); await ov('review');
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Save my review' }).click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/live-payment-${w}.png` }); await ov('payment');
  const payMsg = await page.locator('p').filter({ hasText: /sandbox|PayPal|Setup/i }).last().textContent().catch(() => '?');
  notes.push(`live payment status @${w}: ${payMsg.trim().slice(0, 120)}`);
  await page.goto(base + '/receipts', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/live-receipts-${w}.png` }); await ov('receipts');
  await ctx.close();
}
console.log(notes.join('\n'));
process.exit(0);
