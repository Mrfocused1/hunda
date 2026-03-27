const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        defaultViewport: { width: 1440, height: 900 }
    });

    const page = await browser.newPage();

    // Wait for network to be idle
    await page.goto('https://1hundred.shop', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    // Wait for products to load
    await page.waitForFunction(
        () => {
            return document.querySelector('section.relative.h-screen img') !== null;
        },
        { timeout: 20000 }
    );

    // Force hide loader
    await page.evaluate(() => {
        const loader = document.getElementById('page-loader');
        if (loader) loader.style.display = 'none';
    });

    // Wait a bit more for render
    await new Promise((r) => setTimeout(r, 2000));

    // Take screenshot
    await page.screenshot({
        path: 'hero-current.png',
        clip: { x: 0, y: 0, width: 1440, height: 800 }
    });
    console.log('✅ Screenshot saved: hero-current.png');

    await browser.close();
})();
