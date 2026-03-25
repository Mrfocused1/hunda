const puppeteer = require('puppeteer');
const path = require('path');

const pages = [
    'index.html',
    'shop.html',
    'product.html',
    'cart.html',
    'checkout.html',
    'wishlist.html',
    'account.html',
    'about.html',
    'login.html',
    'signup.html',
    'admin.html'
];

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });

    for (const page of pages) {
        const p = await browser.newPage();
        await p.setViewport({ width: 375, height: 812 }); // iPhone SE
        const filePath = 'file://' + path.resolve(page);
        await p.goto(filePath, { waitUntil: 'networkidle0' });
        await p.screenshot({
            path: `screenshots/user/mobile-${page.replace('.html', '')}.png`,
            fullPage: true
        });
        console.log(`Captured: ${page}`);
        await p.close();
    }

    await browser.close();
    console.log('All mobile screenshots captured!');
})();
