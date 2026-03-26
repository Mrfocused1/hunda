const puppeteer = require('puppeteer');

async function testScroll() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    // Disable auth check
    await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('1hundred_admin_session', 'test');
    });

    await page.goto('http://localhost:9999/admin.html', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // Go to customers section
    await page.evaluate(() => showSection('customers'));
    await new Promise((r) => setTimeout(r, 1000));

    // Get initial scroll position
    const wrapper = await page.$('.table-wrapper');
    const initialScroll = await page.evaluate((el) => el.scrollLeft, wrapper);
    console.log('Initial scrollLeft:', initialScroll);

    // Try to scroll the table wrapper
    await page.evaluate(() => {
        const wrapper = document.querySelector('.table-wrapper');
        wrapper.scrollLeft = 200;
    });
    await new Promise((r) => setTimeout(r, 500));

    const afterScroll = await page.evaluate((el) => el.scrollLeft, wrapper);
    console.log('After scroll scrollLeft:', afterScroll);

    // Check computed styles
    const styles = await page.evaluate(() => {
        const wrapper = document.querySelector('.table-wrapper');
        const table = document.querySelector('.data-table');
        const computed = window.getComputedStyle(wrapper);
        const tableComputed = window.getComputedStyle(table);

        return {
            wrapperOverflowX: computed.overflowX,
            wrapperWidth: wrapper.offsetWidth,
            tableWidth: table.offsetWidth,
            wrapperScrollWidth: wrapper.scrollWidth,
            tableMinWidth: tableComputed.minWidth,
            tableDisplay: tableComputed.display
        };
    });
    console.log('Styles:', styles);

    // Screenshot after scroll attempt
    await page.screenshot({ path: 'screenshots/user/admin-customers-scrolled.png', fullPage: true });

    await browser.close();
}

testScroll().catch(console.error);
