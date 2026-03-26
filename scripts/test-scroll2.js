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

    // Check section visibility before switching
    const beforeInfo = await page.evaluate(() => {
        const section = document.getElementById('customers');
        const style = window.getComputedStyle(section);
        return {
            display: style.display,
            visibility: style.visibility,
            classList: section.className
        };
    });
    console.log('Before switch:', beforeInfo);

    // Go to customers section
    await page.evaluate(() => showSection('customers'));
    await new Promise((r) => setTimeout(r, 1500));

    // Check section visibility after switching
    const afterInfo = await page.evaluate(() => {
        const section = document.getElementById('customers');
        const style = window.getComputedStyle(section);
        const wrapper = section.querySelector('.table-wrapper');
        const table = section.querySelector('.data-table');

        return {
            sectionDisplay: style.display,
            sectionVisibility: style.visibility,
            classList: section.className,
            wrapperExists: !!wrapper,
            tableExists: !!table,
            wrapperDisplay: wrapper ? window.getComputedStyle(wrapper).display : null,
            tableDisplay: table ? window.getComputedStyle(table).display : null
        };
    });
    console.log('After switch:', afterInfo);

    // Now check dimensions
    const dimensions = await page.evaluate(() => {
        const section = document.getElementById('customers');
        const wrapper = section.querySelector('.table-wrapper');
        const table = section.querySelector('.data-table');

        return {
            sectionWidth: section.offsetWidth,
            wrapperWidth: wrapper ? wrapper.offsetWidth : 0,
            tableWidth: table ? table.offsetWidth : 0,
            wrapperScrollWidth: wrapper ? wrapper.scrollWidth : 0,
            wrapperClientWidth: wrapper ? wrapper.clientWidth : 0
        };
    });
    console.log('Dimensions:', dimensions);

    // Screenshot
    await page.screenshot({ path: 'screenshots/user/admin-customers-debug.png', fullPage: true });

    await browser.close();
}

testScroll().catch(console.error);
