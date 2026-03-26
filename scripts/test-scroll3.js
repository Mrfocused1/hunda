const puppeteer = require('puppeteer');

async function testScroll() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('1hundred_admin_session', 'test');
    });

    await page.goto('http://localhost:9999/admin.html', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // Go to customers section
    await page.evaluate(() => showSection('customers'));
    await new Promise((r) => setTimeout(r, 1500));

    // Screenshot before scroll
    await page.screenshot({ path: 'screenshots/user/admin-customers-before-scroll.png', fullPage: true });

    // Try horizontal scroll using touch event
    const wrapper = await page.$('.table-wrapper');
    const box = await wrapper.boundingBox();
    console.log('Wrapper bounding box:', box);

    // Simulate touch drag to scroll
    await page.mouse.move(box.x + 100, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x - 100, box.y + 50, { steps: 10 });
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 500));

    // Check scroll position
    const scrollPos = await page.evaluate(() => {
        const wrapper = document.querySelector('.table-wrapper');
        return {
            scrollLeft: wrapper.scrollLeft,
            scrollWidth: wrapper.scrollWidth,
            clientWidth: wrapper.clientWidth
        };
    });
    console.log('Scroll position after drag:', scrollPos);

    // Screenshot after scroll
    await page.screenshot({ path: 'screenshots/user/admin-customers-after-scroll.png', fullPage: true });

    await browser.close();
}

testScroll().catch(console.error);
