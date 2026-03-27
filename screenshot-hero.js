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

    // Wait for the hero image to load
    await page.waitForSelector('section.relative.h-screen img', { timeout: 10000 });

    // Take screenshot of the hero section
    const heroElement = await page.$('section.relative.h-screen');
    if (heroElement) {
        await heroElement.screenshot({
            path: 'hero-current.png',
            type: 'png'
        });
        console.log('✅ Hero screenshot saved: hero-current.png');
    }

    // Also take full page screenshot
    await page.screenshot({
        path: 'fullpage-current.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 1440, height: 800 }
    });
    console.log('✅ Full page screenshot saved: fullpage-current.png');

    await browser.close();
})();
