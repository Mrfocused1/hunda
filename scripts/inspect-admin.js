const puppeteer = require('puppeteer');

async function inspectAdminPage() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    // Disable auth check by injecting before page load
    await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('1hundred_admin_session', 'test');
    });

    await page.goto('http://localhost:9999/admin.html', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // Check all sections for duplicate titles
    const sections = ['dashboard', 'products', 'orders', 'customers', 'emails'];
    const issues = [];

    for (const section of sections) {
        // Navigate to section
        await page.evaluate((s) => showSection(s), section);
        await new Promise((r) => setTimeout(r, 800));

        // Take screenshot
        await page.screenshot({ path: `screenshots/user/admin-${section}.png`, fullPage: true });

        // Check for duplicate titles
        const titleInfo = await page.evaluate(() => {
            const h3Titles = document.querySelectorAll('h3.section-title');
            const visibleTitles = Array.from(h3Titles).filter((h) => {
                const style = window.getComputedStyle(h);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });

            // Check header title
            const headerTitle = document.querySelector('.admin-header h1');
            const headerText = headerTitle ? headerTitle.textContent.trim() : '';

            // Check section titles
            const sectionTitles = visibleTitles.map((h) => h.textContent.trim());

            // Check if any titles are duplicated
            const duplicates = sectionTitles.filter((item, index) => sectionTitles.indexOf(item) !== index);

            return {
                headerTitle: headerText,
                sectionTitles: sectionTitles,
                duplicates: duplicates,
                count: visibleTitles.length
            };
        });

        console.log(`\n=== ${section.toUpperCase()} ===`);
        console.log('Header title:', titleInfo.headerTitle);
        console.log('Section titles:', titleInfo.sectionTitles);
        console.log('Visible count:', titleInfo.count);

        if (titleInfo.sectionTitles.length > 1 || titleInfo.duplicates.length > 0) {
            issues.push({
                section: section,
                problem: 'Duplicate titles detected',
                details: titleInfo
            });
        }

        // Check table scroll
        if (['products', 'orders', 'customers'].includes(section)) {
            const tableInfo = await page.evaluate(() => {
                const wrapper = document.querySelector('.table-wrapper');
                const table = document.querySelector('.data-table');
                if (!wrapper || !table) return null;

                return {
                    wrapperOverflow: window.getComputedStyle(wrapper).overflowX,
                    wrapperWidth: wrapper.offsetWidth,
                    tableWidth: table.offsetWidth,
                    wrapperScrollWidth: wrapper.scrollWidth,
                    wrapperClientWidth: wrapper.clientWidth,
                    canScroll: wrapper.scrollWidth > wrapper.clientWidth
                };
            });

            console.log('Table scroll info:', tableInfo);

            if (tableInfo && !tableInfo.canScroll && tableInfo.tableWidth > tableInfo.wrapperWidth) {
                issues.push({
                    section: section,
                    problem: 'Table should scroll but cannot',
                    details: tableInfo
                });
            }
        }
    }

    await browser.close();

    console.log('\n=== ISSUES FOUND ===');
    if (issues.length === 0) {
        console.log('No issues found!');
    } else {
        issues.forEach((i) => {
            console.log(`- ${i.section}: ${i.problem}`);
        });
    }

    return issues;
}

inspectAdminPage().catch(console.error);
