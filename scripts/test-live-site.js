const puppeteer = require('puppeteer');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testLiveSite() {
    const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    console.log('Testing LIVE site: www.1hundredornothing.co.uk\n');

    // Capture console logs from the page
    page.on('console', (msg) => console.log('PAGE CONSOLE:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

    try {
        // Go to shop page
        console.log('1. Navigating to shop page...');
        await page.goto('https://www.1hundredornothing.co.uk/shop', { waitUntil: 'networkidle2', timeout: 60000 });
        await sleep(3000);

        // Check if products are loaded
        const productCount = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            return cards.length;
        });
        console.log(`   Products found: ${productCount}`);

        if (productCount === 0) {
            console.log('   ERROR: No products loaded!');
            await browser.close();
            return;
        }

        // Debug: Check if products array is populated
        const productsCheck = await page.evaluate(() => {
            return {
                productsDefined: typeof products !== 'undefined',
                productsLength: typeof products !== 'undefined' ? products.length : 0,
                allProductsDefined: typeof allProducts !== 'undefined',
                allProductsLength: typeof allProducts !== 'undefined' ? allProducts.length : 0,
                addToCartDefined: typeof addToCart !== 'undefined',
                addToCartFromQVDefined: typeof addToCartFromQV !== 'undefined'
            };
        });
        console.log('   Products status:', productsCheck);

        // Click on first product to open quick view
        console.log('\n2. Clicking first product for Quick View...');
        await page.click('.product-card:first-child .product-image-wrapper');
        await sleep(1500);

        // Check if modal is open
        const modalVisible = await page.evaluate(() => {
            const modal = document.getElementById('quick-view-modal');
            return modal && !modal.classList.contains('invisible') && !modal.classList.contains('opacity-0');
        });
        console.log(`   Quick view modal visible: ${modalVisible}`);

        // Check for size options
        const sizeButtons = await page.evaluate(() => {
            const buttons = document.querySelectorAll('#qv-sizes .size-option');
            return buttons.length;
        });
        console.log(`   Size options found: ${sizeButtons}`);

        // Select a size if available
        if (sizeButtons > 0) {
            console.log('\n3. Selecting size...');
            await page.click('#qv-sizes .size-option:first-child');
            await sleep(500);

            // Check if size is selected
            const sizeSelected = await page.evaluate(() => {
                const modal = document.getElementById('quick-view-modal');
                return modal && modal.dataset.selectedSize;
            });
            console.log(`   Selected size: ${sizeSelected || 'NONE'}`);
        }

        // Check cart count before adding
        const cartCountBefore = await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('1hundred_cart') || '[]');
            return cart.reduce((sum, item) => sum + item.quantity, 0);
        });
        console.log(`\n4. Cart count before: ${cartCountBefore}`);

        // Click Add to Bag button
        console.log('\n5. Clicking Add to Bag button...');
        const addButton = await page.$('#qv-add-to-bag-btn');
        if (!addButton) {
            console.log('   ERROR: Add to Bag button not found!');
            await browser.close();
            return;
        }

        await addButton.click();
        await sleep(2000);

        // Check cart count after
        const cartCountAfter = await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('1hundred_cart') || '[]');
            return cart.reduce((sum, item) => sum + item.quantity, 0);
        });
        console.log(`   Cart count after: ${cartCountAfter}`);

        if (cartCountAfter > cartCountBefore) {
            console.log('\n✅ SUCCESS: Product added to cart on LIVE site!');
        } else {
            console.log('\n❌ FAILED: Product NOT added to cart on LIVE site!');

            // Additional debug info
            const debugInfo = await page.evaluate(() => {
                const modal = document.getElementById('quick-view-modal');
                return {
                    modalProductId: modal ? modal.dataset.productId : 'N/A',
                    modalSelectedSize: modal ? modal.dataset.selectedSize : 'N/A',
                    productsArray:
                        typeof products !== 'undefined'
                            ? products.map((p) => ({ id: p.id, title: p.title }))
                            : 'undefined'
                };
            });
            console.log('   Debug info:', debugInfo);
        }

        await sleep(3000);
    } catch (err) {
        console.error('Test error:', err.message);
    } finally {
        await browser.close();
    }
}

testLiveSite().catch(console.error);
