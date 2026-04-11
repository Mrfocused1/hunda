// Headless probe for the live Apple Pay setup.
// We can't actually invoke the Apple Pay sheet from Chromium, but we can:
//  1. Confirm Stripe.js loads with the live publishable key
//  2. Confirm the Express Checkout Element mounts without a `loaderror`
//  3. Capture any Stripe warnings (e.g. "domain not registered" for Apple Pay)
//  4. Inspect availablePaymentMethods reported by the `ready` event
//  5. Watch network calls to r.stripe.com / m.stripe.network for 4xx/5xx
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Spoof Safari UA so Stripe.js takes the Apple Pay branch as far as it can.
    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    );

    const consoleMessages = [];
    page.on('console', (msg) => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => consoleMessages.push(`[pageerror] ${err.message}`));

    const networkIssues = [];
    page.on('response', async (resp) => {
        const url = resp.url();
        if (/stripe\.com|stripe\.network/.test(url) && resp.status() >= 400) {
            let body = '';
            try {
                body = await resp.text();
            } catch (e) {
                body = `(could not read body: ${e.message})`;
            }
            networkIssues.push(`${resp.status()} ${url}\nBODY: ${body.slice(0, 1500)}`);
        }
    });

    // Bypass site gate + seed cart before any page script runs
    await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('1hundred_gate_auth', 'granted');
        const cart = [
            {
                id: 'shirt-1',
                title: 'Test Shirt',
                price: 29.99,
                quantity: 1,
                size: 'M',
                color: 'Black',
                image: 'product-1.png'
            }
        ];
        localStorage.setItem('1hundred_cart', JSON.stringify(cart));
    });

    console.log('→ loading https://www.1hundredornothing.co.uk/checkout');
    await page.goto('https://www.1hundredornothing.co.uk/checkout', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    // Wait for Stripe to be ready (best-effort; we still report state even on timeout)
    try {
        await page.waitForFunction(() => window.StripeService && window.StripeService.stripe, {
            timeout: 20000
        });
        console.log('✓ StripeService.stripe initialized');
    } catch (e) {
        console.log('⚠ StripeService.stripe NOT initialized within 20s — continuing to dump state');
    }

    console.log('URL after load:', page.url());
    console.log('Title:', await page.title());
    await page.screenshot({ path: '/tmp/checkout-probe.png', fullPage: true });
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
    console.log('Body preview:', bodyText);

    const state = await page.evaluate(() => ({
        hasStripeService: !!window.StripeService,
        hasStripeInstance: !!(window.StripeService && window.StripeService.stripe),
        hasWindowStripe: !!window.Stripe,
        publishableKey: window.StripeService?.publishableKey || null
    }));
    console.log('STATE:', state);

    // The step-2 Apple Pay radio has been removed — the Express Checkout element is now
    // mounted at the top of step 1 on page load. Wait for it to log "ready" or "loaderror"
    // via the console messages we capture above.
    const result = await new Promise((resolve) => {
        const start = Date.now();
        const tick = () => {
            const ready = consoleMessages.find((m) => /\[Wallets:express-checkout-top\] ready/i.test(m));
            const available = consoleMessages.find((m) => /\[Wallets:express-checkout-top\] Available methods/i.test(m));
            const loaderror = consoleMessages.find((m) => /\[Wallets:express-checkout-top\] load error/i.test(m));
            if (available) return resolve({ event: 'ready', methods: available });
            if (loaderror) return resolve({ event: 'loaderror', error: loaderror });
            if (Date.now() - start > 15000) return resolve({ event: 'timeout' });
            setTimeout(tick, 250);
        };
        tick();
    });

    // Give the page another moment so any late Stripe warnings land
    await new Promise((r) => setTimeout(r, 2000));

    console.log('\n=== Express Checkout result ===');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n=== Stripe-related console messages ===');
    const stripeMsgs = consoleMessages.filter((m) =>
        /stripe|apple|express|payment/i.test(m)
    );
    stripeMsgs.forEach((m) => console.log(m));
    if (stripeMsgs.length === 0) console.log('(none)');

    console.log('\n=== Network 4xx/5xx to Stripe ===');
    if (networkIssues.length === 0) console.log('(none)');
    else networkIssues.forEach((n) => console.log(n));

    console.log('\n=== ALL console messages (last 40) ===');
    consoleMessages.slice(-40).forEach((m) => console.log(m));

    await browser.close();
})().catch((e) => {
    console.error('FATAL:', e);
    process.exit(1);
});
