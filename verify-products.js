const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        defaultViewport: { width: 1440, height: 900 }
    });

    const page = await browser.newPage();

    page.on('console', (msg) => console.log('CONSOLE:', msg.text()));

    await page.goto('https://1hundred.shop/shop', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    // Wait for products to load
    await page.waitForFunction(
        () => {
            return document.querySelectorAll('.product-card').length > 0;
        },
        { timeout: 20000 }
    );

    await new Promise((r) => setTimeout(r, 3000));

    // Get all product images
    const productImages = await page.evaluate(() => {
        const cards = document.querySelectorAll('.product-card');
        return Array.from(cards).map((card) => {
            const img = card.querySelector('img');
            const title = card.querySelector('.product-title');
            return {
                title: title ? title.textContent : 'Unknown',
                src: img ? img.src : 'No image'
            };
        });
    });

    console.log('\n=== Product Images ===');
    productImages.forEach((p, i) => {
        console.log(`${i + 1}. ${p.title}: ${p.src}`);
    });

    // Take screenshot
    await page.screenshot({
        path: 'shop-products.png',
        clip: { x: 0, y: 100, width: 1440, height: 700 }
    });
    console.log('\n✅ Screenshot saved: shop-products.png');

    await browser.close();
})();
