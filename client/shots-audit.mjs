import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

// Full UI audit: every page and state at phone widths + desktop.
// API is stubbed with the backend's own bakery fixture so states are deterministic;
// this never runs against the live API and never appears in the demo video.
const OUT = '/downloads/audit';
fs.mkdirSync(OUT, { recursive: true });

const preview = spawn('npx', ['vite', 'preview', '--port', '4517', '--host', '127.0.0.1'], { cwd: process.cwd(), stdio: 'ignore' });
const base = 'http://127.0.0.1:4517';
for (let i = 0; i < 50; i++) {
  try { const r = await fetch(base + '/'); if (r.ok) break; } catch {}
  await new Promise(r => setTimeout(r, 300));
}

const H = { 'Content-Type': 'application/json' };
const BRIEF = 'Demo brief (synthetic example): build a two-page website for a bakery with a menu page listing all cakes and breads and a contact page with a working contact form. No online ordering.';
const DRAFT = {
  scopeId: '9908358d-3f92-4fd1-a476-2df6fd720982',
  summary: 'Two-page bakery website: a menu page plus a contact page with a working form; online ordering is explicitly excluded.',
  state: 'EXTRACTED', reviewedAt: null,
  deliverables: [
    { description: 'Menu page listing all cakes and breads', evidence: 'a menu page listing all cakes and breads' },
    { description: 'Contact page with a working contact form', evidence: 'a contact page with a working contact form' },
    { description: 'No online ordering', evidence: 'No online ordering' },
  ],
  questions: ['Which cakes and breads must appear on the menu at launch?'],
  conflicts: [],
};
const ORDER = {
  requestId: 'idempotency-0123456789', orderId: '9AB12345CD678901E', state: 'COMPLETED', scopeId: DRAFT.scopeId,
  captureId: '1AB23456CD789012E', createdAt: '2026-11-08T09:00:00Z', completedAt: '2026-11-08T09:01:00Z',
  timeline: [
    { type: 'ORDER_CREATED', at: '2026-11-08T09:00:00Z', payload: { orderId: '9AB12345CD678901E', amount: '10.00', currency: 'USD' } },
    { type: 'ORDER_COMPLETED', at: '2026-11-08T09:01:00Z', payload: { captureId: '1AB23456CD789012E', amount: '10.00', currency: 'USD' } },
  ],
  ledger: [
    { account: 'paypal_sandbox_clearing', direction: 'DEBIT', amount: '10.00', currency: 'USD', memo: 'Sandbox capture 1AB23456CD789012E' },
    { account: 'demo_revenue', direction: 'CREDIT', amount: '10.00', currency: 'USD', memo: 'Fixed sandbox demo item' },
  ],
};
const MOCK_SDK = `window.paypal={createInstance:async()=>({findEligibleMethods:async()=>({isEligible:()=>true}),createPayPalOneTimePaymentSession:async(h)=>({start:async()=>{}})})};`;

async function stubApi(page, { sdk = false, refuse = false, receipts = 'full' } = {}) {
  await page.addInitScript(() => { try { localStorage.setItem('sp-intro-seen', '1'); sessionStorage.setItem('sp-intro-seen', '1'); } catch (e) {} });
  await page.route('**/api/config', r => r.fulfill({ status: 200, headers: H, body: JSON.stringify({ clientId: sdk ? 'fixture-client-id' : null, sku: 'sandbox-demo', demoTools: false, aiMode: 'fixture', orderRecovery: true, syntheticOnly: true }) }));
  await page.route('**/api/scopes/extract', r => refuse
    ? r.fulfill({ status: 422, headers: H, body: JSON.stringify({ error: 'AI_REFUSED' }) })
    : r.fulfill({ status: 200, headers: H, body: JSON.stringify(DRAFT) }));
  await page.route('**/api/scopes/*/review', r => r.fulfill({ status: 200, headers: H, body: JSON.stringify({ scopeId: DRAFT.scopeId }) }));
  await page.route('**/api/receipts', r => r.fulfill({ status: 200, headers: H, body: JSON.stringify(receipts === 'full' ? { drafts: [DRAFT], orders: [ORDER], refundRequests: [] } : { drafts: [], orders: [], refundRequests: [] }) }));
  if (sdk) await page.route('**/web-sdk/v6/core**', r => r.fulfill({ status: 200, headers: { 'Content-Type': 'application/javascript' }, body: MOCK_SDK }));
}

const results = [];
const browser = await chromium.launch({ channel: 'chrome' });
const MOBILE_WIDTHS = [320, 360, 390, 430];

async function audit(name, w, opts, fn) {
  const mobile = w < 720;
  const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? 780 : 900 }, deviceScaleFactor: 2, ...(mobile ? { isMobile: true, hasTouch: true } : {}) });
  const page = await ctx.newPage();
  await stubApi(page, opts);
  try {
    await fn(page);
    const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    if (ov.sw > ov.iw) results.push(`OVERFLOW ${name} @${w}: scrollWidth ${ov.sw} > ${ov.iw}`);
  } catch (e) { results.push(`ERROR ${name} @${w}: ${e.message.split('\n')[0]}`); }
  await page.screenshot({ path: `${OUT}/${name}-${w}.png` });
  await ctx.close();
}

async function driveToReview(page) {
  await page.goto(base + '/brief', { waitUntil: 'networkidle' });
  await page.locator('#brief').fill(BRIEF);
  await page.getByRole('button', { name: 'Extract a draft' }).click();
  await page.getByRole('checkbox').waitFor();
}

const GROUP = process.argv[2] || 'all';
const widths = GROUP === 'states' ? [] : GROUP === 'all' ? [...MOBILE_WIDTHS, 1440] : GROUP.split(',').map(Number);
for (const w of widths) {
  await audit('home-top', w, {}, async p => { await p.goto(base + '/', { waitUntil: 'networkidle' }); });
  await audit('home-scrolled', w, {}, async p => { await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(350); });
  await audit('brief', w, {}, async p => { await p.goto(base + '/brief', { waitUntil: 'networkidle' }); });
  await audit('review-filled', w, {}, driveToReview);
}
// focused states at 390 (+ desktop where useful)
for (const w of (GROUP === 'all' || GROUP === 'states' ? [390, 1440] : [])) {
  await audit('brief-error', w, { refuse: true }, async p => {
    await p.goto(base + '/brief', { waitUntil: 'networkidle' });
    await p.locator('#brief').fill('Anything the fixture does not know, typed by the user here.');
    await p.getByRole('button', { name: 'Extract a draft' }).click();
    await p.waitForTimeout(900);
  });
  await audit('review-empty', w, {}, async p => { await p.goto(base + '/review', { waitUntil: 'networkidle' }); });
  await audit('payment-gated', w, { sdk: true }, async p => { await p.goto(base + '/payment', { waitUntil: 'networkidle' }); await p.waitForTimeout(400); });
  await audit('payment-ready', w, { sdk: true }, async p => {
    await driveToReview(p);
    await p.getByRole('checkbox').click();
    await p.getByRole('button', { name: 'Save my review' }).click();
    await p.waitForTimeout(1200);
  });
  await audit('receipts-full', w, {}, async p => { await p.goto(base + '/receipts', { waitUntil: 'networkidle' }); await p.waitForTimeout(400); });
  await audit('receipts-dialog', w, {}, async p => {
    await p.goto(base + '/receipts', { waitUntil: 'networkidle' });
    await p.getByRole('tab', { name: 'Orders and captures' }).click();
    await p.waitForTimeout(600);
    await p.getByText('9AB12345CD678901E').first().click();
    await p.waitForTimeout(500);
  });
  await audit('receipts-empty', w, { receipts: 'empty' }, async p => { await p.goto(base + '/receipts', { waitUntil: 'networkidle' }); await p.waitForTimeout(300); });
}
// phone-only interaction states at 320/390
for (const w of (GROUP === 'all' || GROUP === 'states' ? [320, 390] : [])) {
  await audit('brief-keyboard', w, {}, async p => {
    await p.goto(base + '/brief', { waitUntil: 'networkidle' });
    await p.locator('#brief').click();
    await p.setViewportSize({ width: w, height: 430 }); // approximates an open on-screen keyboard
    await p.waitForTimeout(350);
  });
  await audit('reload-midflow', w, {}, async p => {
    await driveToReview(p);
    await p.reload({ waitUntil: 'networkidle' }); // in-memory draft is gone; expect the "no draft yet" guidance
  });
  await audit('back-midflow', w, {}, async p => {
    await driveToReview(p);
    await p.goBack();
    await p.waitForTimeout(500); // SPA back to /brief with the brief text intact
  });
}
console.log(results.length ? results.join('\n') : 'NO ISSUES FROM CHECKS');
preview.kill();
process.exit(0);
