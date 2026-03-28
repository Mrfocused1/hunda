const puppeteer = require('puppeteer');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testMobileSearch() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        defaultViewport: { width: 375, height: 812 } // iPhone X size
    });
    const page = await browser.newPage();

    console.log('Testing MOBILE search on LIVE site: www.1hundredornothing.co.uk\n');

    // Capture console logs from the page
    page.on('console', (msg) => console.log('PAGE CONSOLE:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

    try {
        // Go to homepage
        console.log('1. Navigating to homepage...');
        await page.goto('https://www.1hundredornothing.co.uk', { waitUntil: 'networkidle2', timeout: 60000 });
        await sleep(2000);

        // Open mobile menu
        console.log('\n2. Opening mobile menu...');
        await page.click('#menu-toggle');
        await sleep(1000);

        // Check if mobile search input exists
        const searchInputExists = await page.evaluate(() => {
            const input = document.getElementById('mobile-search-input');
            console.log('DEBUG: Mobile search input found:', !!input);
            return !!input;
        });
        console.log('   Mobile search input exists:', searchInputExists);

        if (!searchInputExists) {
            console.log('   ERROR: Mobile search input not found!');
            // Try to find any search input
            const allInputs = await page.evaluate(() => {
                const inputs = document.querySelectorAll('input[type="text"]');
                return Array.from(inputs).map((i) => ({ id: i.id, placeholder: i.placeholder, class: i.className }));
            });
            console.log('   All text inputs found:', allInputs);
            await browser.close();
            return;
        }

        // Type in mobile search
        console.log('\n3. Typing in mobile search...');
        await page.type('#mobile-search-input', 'hoodie');
        await sleep(500);

        // Press Enter
        console.log('\n4. Pressing Enter...');
        await page.keyboard.press('Enter');
        await sleep(3000);

        // Check current URL
        const currentUrl = page.url();
        console.log('\n5. Current URL:', currentUrl);

        if (currentUrl.includes('/shop?q=hoodie')) {
            console.log('\n✅ SUCCESS: Mobile search redirected correctly!');
        } else {
            console.log('\n❌ FAILED: Mobile search did NOT redirect to search results!');
            console.log('   Expected URL to contain: /shop?q=hoodie');
        }
    } catch (err) {
        console.error('Test error:', err.message);
    } finally {
        await browser.close();
    }
}

testMobileSearch().catch(console.error);
