// Full site smoke test — validates every major page and feature against the live site.
// Run: node scripts/test-full-site.js

const puppeteer = require('puppeteer');
const BASE = 'https://www.1hundredornothing.co.uk';
let passed = 0;
let failed = 0;
const results = [];

function ok(name) {
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
}
function fail(name, reason) {
    failed++;
    results.push({ name, status: 'FAIL', reason });
    console.log(`  ❌ ${name}: ${reason}`);
}

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });

    async function newPage() {
        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
        );
        await page.evaluateOnNewDocument(() => {
            sessionStorage.setItem('1hundred_gate_auth', 'granted');
            localStorage.setItem('1hundred_intro_popup_seen', '1');
        });
        return page;
    }

    // ========================================
    console.log('\n1. PAGE LOADING');
    // ========================================
    const pages = [
        ['/', 'Homepage'],
        ['/shop', 'Shop'],
        ['/about', 'About'],
        ['/contact', 'Contact'],
        ['/cart', 'Cart'],
        ['/checkout', 'Checkout'],
        ['/media', 'Media'],
        ['/login', 'Login'],
        ['/signup', 'Signup'],
        ['/delivery', 'Delivery'],
        ['/help', 'Help'],
        ['/privacy', 'Privacy'],
        ['/terms', 'Terms'],
        ['/relentless-trophy-tee', 'Product: Relentless Trophy Tee'],
        ['/100mph-tee', 'Product: 100MPH Tee'],
        ['/1h-star-cap', 'Product: 1H Star Cap'],
        ['/1h-multi-colour-cap', 'Product: 1H Multi Colour Cap'],
    ];

    for (const [path, label] of pages) {
        const page = await newPage();
        try {
            const resp = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
            if (resp.status() >= 200 && resp.status() < 400) ok(`${label} (${path}) loads ${resp.status()}`);
            else fail(`${label} (${path})`, `status ${resp.status()}`);
        } catch (e) {
            fail(`${label} (${path})`, e.message);
        }
        await page.close();
    }

    // ========================================
    console.log('\n2. PRODUCTS LOAD FROM SUPABASE');
    // ========================================
    {
        const page = await newPage();
        await page.goto(BASE + '/shop', { waitUntil: 'networkidle2', timeout: 45000 });
        const titles = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.product-title')).map((e) => e.textContent.trim())
        );
        // Retry up to 3 times — Supabase free tier can cold-start slowly
        let finalTitles = titles;
        if (titles.length < 4) {
            for (let retry = 0; retry < 2; retry++) {
                await new Promise((r) => setTimeout(r, 3000));
                finalTitles = await page.evaluate(() =>
                    Array.from(document.querySelectorAll('.product-title')).map((e) => e.textContent.trim())
                );
                if (finalTitles.length >= 4) break;
                await page.reload({ waitUntil: 'networkidle2', timeout: 45000 });
                finalTitles = await page.evaluate(() =>
                    Array.from(document.querySelectorAll('.product-title')).map((e) => e.textContent.trim())
                );
                if (finalTitles.length >= 4) break;
            }
        }
        if (finalTitles.length >= 4) ok(`Shop renders ${finalTitles.length} products: ${finalTitles.join(', ')}`);
        else fail('Shop products', `Only ${finalTitles.length} products found`);
        await page.close();
    }

    // ========================================
    console.log('\n3. CART FUNCTIONALITY');
    // ========================================
    {
        const page = await newPage();
        await page.goto(BASE + '/1h-star-cap', { waitUntil: 'networkidle2', timeout: 45000 });

        // Select size and add to bag
        const added = await page.evaluate(() => {
            const sizeBtn = document.querySelector('.size-option[data-size="One Size"], .size-option');
            if (sizeBtn) sizeBtn.click();
            const addBtn = document.getElementById('add-to-bag-btn');
            if (addBtn) { addBtn.click(); return true; }
            return false;
        });
        if (added) ok('Add to bag button clicked');
        else fail('Add to bag', 'Button not found');

        await new Promise((r) => setTimeout(r, 1000));

        const cartCount = await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('1hundred_cart') || '[]');
            return cart.length;
        });
        if (cartCount > 0) ok(`Cart has ${cartCount} item(s) in localStorage`);
        else fail('Cart localStorage', 'Cart is empty after add');

        await page.close();
    }

    // ========================================
    console.log('\n4. CHECKOUT — STRIPE INIT + EXPRESS CHECKOUT');
    // ========================================
    {
        const page = await newPage();
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem(
                '1hundred_cart',
                JSON.stringify([
                    { id: 3, title: '1H Star Cap', price: 30, quantity: 1, size: 'One Size', color: 'Black', image: 'product-1.png' }
                ])
            );
        });

        const consoleMessages = [];
        page.on('console', (msg) => consoleMessages.push(msg.text()));

        await page.goto(BASE + '/checkout', { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for Stripe
        try {
            await page.waitForFunction(() => window.StripeService && window.StripeService.stripe, { timeout: 20000 });
            ok('StripeService initialized');
        } catch (e) {
            fail('StripeService init', 'Timed out');
        }

        // Wait for Express Checkout ready
        await new Promise((r) => setTimeout(r, 8000));
        const walletReady = consoleMessages.some((m) => /Wallets:express-checkout-top.*ready/i.test(m));
        const walletMethods = consoleMessages.find((m) => /Available methods/i.test(m));
        if (walletReady) ok(`Express Checkout ready: ${walletMethods || '(methods not captured)'}`);
        else fail('Express Checkout', 'ready event not seen in console');

        // Check no integration errors
        const integrationError = consoleMessages.find((m) => /IntegrationError/i.test(m));
        if (!integrationError) ok('No Stripe IntegrationError');
        else fail('Stripe IntegrationError', integrationError);

        // Check no network error toast
        const networkToast = consoleMessages.find((m) => /Network error/i.test(m));
        if (!networkToast) ok('No network error toast');
        else fail('Network error toast', networkToast);

        // Order summary renders
        const total = await page.evaluate(() => document.getElementById('checkout-total')?.textContent || '');
        if (total && total.includes('£')) ok(`Order total rendered: ${total}`);
        else fail('Order total', `Got: "${total}"`);

        await page.close();
    }

    // ========================================
    console.log('\n5. SUPABASE SETTINGS (media_nav_visible)');
    // ========================================
    {
        const page = await newPage();
        await page.goto(BASE + '/shop', { waitUntil: 'networkidle2', timeout: 45000 });

        // Check if SettingsAPI resolves without error
        const result = await page.evaluate(async () => {
            if (typeof SettingsAPI === 'undefined') return { error: 'SettingsAPI not defined' };
            try {
                const val = await SettingsAPI.get('media_nav_visible', null);
                return { value: val };
            } catch (e) {
                return { error: e.message };
            }
        });
        if (result.error) fail('SettingsAPI.get', result.error);
        else ok(`SettingsAPI.get('media_nav_visible') = ${JSON.stringify(result.value)}`);

        await page.close();
    }

    // ========================================
    console.log('\n6. STATIC ASSETS');
    // ========================================
    const assets = [
        '/tailwind.css',
        '/styles.css',
        '/main.js',
        '/supabase.js',
        '/auth.js',
        '/scripts/stripe-service.js',
        '/scripts/email-service.js',
        '/logo.svg',
        '/robots.txt',
        '/sitemap.xml',
        '/.well-known/apple-developer-merchantid-domain-association',
    ];
    for (const asset of assets) {
        try {
            const p = await newPage();
            const resp = await p.goto(BASE + asset, { timeout: 15000 });
            const s = resp.status();
            if (s >= 200 && s < 400) ok(`${asset} → ${s}`);
            else fail(asset, `status ${s}`);
            await p.close();
        } catch (e) {
            // Binary files like .well-known/* can cause navigation errors — verify with fetch
            try {
                const p2 = await newPage();
                await p2.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 10000 });
                const status = await p2.evaluate(async (url) => {
                    const r = await fetch(url, { method: 'HEAD' });
                    return r.status;
                }, BASE + asset);
                if (status >= 200 && status < 400) ok(`${asset} → ${status} (via fetch)`);
                else fail(asset, `status ${status}`);
                await p2.close();
            } catch (e2) {
                fail(asset, e.message);
            }
        }
    }

    // ========================================
    console.log('\n7. API ENDPOINTS');
    // ========================================
    // Test APIs via fetch from page context
    {
        const page = await newPage();
        await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded', timeout: 30000 });

        const apiResults = await page.evaluate(async () => {
            const results = {};

            // stripe-config
            try {
                const r = await fetch('/api/stripe-config');
                const d = await r.json();
                results.stripeConfig = d.success && d.data?.publishableKey ? 'ok' : 'fail: ' + JSON.stringify(d);
            } catch (e) { results.stripeConfig = 'error: ' + e.message; }

            // Admin gate (should reject)
            try {
                const r = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"title":"test","price":1}' });
                const d = await r.json();
                results.adminGate = r.status === 401 ? 'ok (401)' : 'fail: ' + r.status + ' ' + JSON.stringify(d);
            } catch (e) { results.adminGate = 'error: ' + e.message; }

            // send-email (should work)
            try {
                const r = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'welcome', to: 'test@test.com', data: { firstName: 'Test' } }) });
                const d = await r.json();
                results.sendEmail = d.success ? 'ok' : 'fail: ' + (d.error || JSON.stringify(d));
            } catch (e) { results.sendEmail = 'error: ' + e.message; }

            return results;
        });

        if (apiResults.stripeConfig === 'ok') ok('GET /api/stripe-config returns publishable key');
        else fail('/api/stripe-config', apiResults.stripeConfig);

        if (apiResults.adminGate?.includes('401')) ok('POST /api/admin/products gates unauthenticated (401)');
        else fail('/api/admin/products gate', apiResults.adminGate);

        if (apiResults.sendEmail === 'ok') ok('POST /api/send-email sends successfully');
        else fail('/api/send-email', apiResults.sendEmail);

        await page.close();
    }

    // ========================================
    console.log('\n8. SECURITY HEADERS');
    // ========================================
    {
        // Use fetch from within the page to get response headers (more reliable than Puppeteer navigation headers)
        const page = await newPage();
        await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        const headerResults = await page.evaluate(async (url) => {
            const r = await fetch(url, { method: 'HEAD' });
            return {
                'x-frame-options': r.headers.get('x-frame-options') || '',
                'x-content-type-options': r.headers.get('x-content-type-options') || '',
                'referrer-policy': r.headers.get('referrer-policy') || '',
                'strict-transport-security': r.headers.get('strict-transport-security') || '',
                'content-security-policy': r.headers.get('content-security-policy') || '',
            };
        }, BASE + '/');

        const checks = [
            ['x-frame-options', 'DENY'],
            ['x-content-type-options', 'nosniff'],
            ['referrer-policy', 'strict-origin-when-cross-origin'],
            // HSTS is not exposed to JS fetch() in most browsers — skip; verified separately via curl
            ['content-security-policy', 'default-src'],
        ];
        for (const [header, expected] of checks) {
            const val = headerResults[header] || '';
            if (val.includes(expected)) ok(`${header} contains "${expected}"`);
            else fail(header, `Got: "${val.slice(0, 80)}"`);
        }

        await page.close();
    }

    // ========================================
    console.log('\n9. MOBILE RESPONSIVENESS');
    // ========================================
    {
        const page = await newPage();
        await page.setViewport({ width: 375, height: 812 });
        await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 45000 });

        const hasHamburger = await page.evaluate(() => {
            const btn = document.getElementById('menu-toggle');
            return btn && window.getComputedStyle(btn).display !== 'none';
        });
        if (hasHamburger) ok('Hamburger menu visible on mobile');
        else fail('Hamburger menu', 'Not visible at 375px');

        const desktopNavHidden = await page.evaluate(() => {
            const nav = document.querySelector('header nav.flex.items-center.gap-8');
            return !nav || window.getComputedStyle(nav.parentElement).display === 'none';
        });
        if (desktopNavHidden) ok('Desktop nav hidden on mobile');
        else fail('Desktop nav', 'Still visible at 375px');

        await page.close();
    }

    // ========================================
    console.log('\n10. INTRO POPUP (fresh visitor)');
    // ========================================
    {
        const page = await browser.newPage();
        await page.evaluateOnNewDocument(() => {
            sessionStorage.setItem('1hundred_gate_auth', 'granted');
            localStorage.removeItem('1hundred_intro_popup_seen');
        });
        await page.goto(BASE + '/shop', { waitUntil: 'networkidle2', timeout: 45000 });
        await new Promise((r) => setTimeout(r, 6000)); // wait for page load + 1.5s popup delay + render

        const popupVisible = await page.evaluate(() => {
            const overlay = document.getElementById('intro-popup-overlay');
            return overlay && overlay.classList.contains('is-visible');
        });
        if (popupVisible) ok('Intro popup appears for fresh visitor');
        else fail('Intro popup', 'Not visible after 2.5s');

        // Can close with X
        if (popupVisible) {
            await page.click('.intro-popup-close');
            await new Promise((r) => setTimeout(r, 500));
            const closed = await page.evaluate(() => {
                return !document.getElementById('intro-popup-overlay');
            });
            if (closed) ok('Popup dismisses on X click');
            else fail('Popup dismiss', 'Still present after clicking X');
        }

        await page.close();
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('════════════════════════════════');
    if (failed > 0) {
        console.log('\nFailed tests:');
        results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  ❌ ${r.name}: ${r.reason}`));
    }
    console.log('');

    await browser.close();
    process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
    console.error('FATAL:', e);
    process.exit(1);
});
