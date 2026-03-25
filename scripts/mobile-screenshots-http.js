const puppeteer = require('puppeteer');

const pages = [{ path: 'admin.html', name: 'admin' }];

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });

    for (const page of pages) {
        const p = await browser.newPage();
        await p.setViewport({ width: 375, height: 812 }); // iPhone SE
        await p.goto('http://localhost:8888/' + page.path, { waitUntil: 'networkidle0', timeout: 30000 });
        await p.screenshot({
            path: `screenshots/user/mobile-${page.name}.png`,
            fullPage: true
        });
        console.log(`Captured: ${page.name}`);
        await p.close();
    }

    await browser.close();
    console.log('Done!');
})();
