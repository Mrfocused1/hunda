const puppeteer = require('puppeteer');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testImageNavigation() {
    console.log('Testing Image Navigation on Product Cards...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--window-size=1200,800']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        // Capture console logs
        page.on('console', (msg) => console.log('PAGE:', msg.text()));
        page.on('pageerror', (err) => console.log('ERROR:', err.message));

        console.log('1. Navigating to shop page...');
        await page.goto('https://1hundred.shop/shop.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for products to load
        console.log('   Waiting for products to load...');
        await page.waitForFunction(
            () => {
                const grid = document.getElementById('product-grid');
                return grid && grid.children.length > 0;
            },
            { timeout: 10000 }
        );
        await sleep(2000);

        // Find a product with multiple images
        console.log('\n2. Looking for product with multiple images...');
        const productWithMultipleImages = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            for (const card of cards) {
                const wrapper = card.querySelector('.product-image-wrapper');
                const hasArrows = card.querySelector('.image-nav-arrow');
                const images = wrapper?.dataset.images;
                if (hasArrows && images) {
                    const imageArray = JSON.parse(images);
                    return {
                        id: card.dataset.productId,
                        title: card.querySelector('.product-title')?.textContent,
                        imageCount: imageArray.length,
                        images: imageArray,
                        hasArrows: !!hasArrows
                    };
                }
            }
            return null;
        });

        if (!productWithMultipleImages) {
            console.log('❌ No product with multiple images found');
            console.log('   (Need a product with more than 1 image)');
            return;
        }

        console.log('✓ Found product:', productWithMultipleImages.title);
        console.log('  Images:', productWithMultipleImages.imageCount);
        console.log('  Has arrows:', productWithMultipleImages.hasArrows);

        // Hover over the product to show arrows
        console.log('\n3. Hovering over product card...');
        const card = await page.$(`.product-card[data-product-id="${productWithMultipleImages.id}"]`);
        if (card) {
            await card.hover();
            await sleep(1000);

            // Force arrows to be visible (simulate hover state)
            await page.evaluate((productId) => {
                const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
                if (card) {
                    const arrows = card.querySelectorAll('.image-nav-arrow');
                    arrows.forEach((arrow) => (arrow.style.opacity = '1'));
                }
            }, productWithMultipleImages.id);
            await sleep(500);
        }

        // Check if arrows are visible
        const arrowsVisible = await page.evaluate((productId) => {
            const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            if (!card) return false;
            const prevArrow = card.querySelector('.image-nav-prev');
            const nextArrow = card.querySelector('.image-nav-next');
            return {
                prevVisible: prevArrow && prevArrow.offsetParent !== null,
                nextVisible: nextArrow && nextArrow.offsetParent !== null,
                prevOpacity: prevArrow ? window.getComputedStyle(prevArrow).opacity : 'N/A',
                nextOpacity: nextArrow ? window.getComputedStyle(nextArrow).opacity : 'N/A'
            };
        }, productWithMultipleImages.id);

        console.log('  Arrow visibility:', arrowsVisible);

        // Click the next arrow
        console.log('\n4. Clicking next arrow...');

        // Check if event listener is attached by looking for click handler
        const hasEventListener = await page.evaluate(() => {
            const grid = document.getElementById('product-grid');
            if (!grid) return 'No grid';
            // Check if our specific handler exists by testing click
            return 'Grid exists';
        });
        console.log('  Event listener check:', hasEventListener);

        // Directly test the navigation logic
        await page.evaluate((productId) => {
            const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            const wrapper = card?.querySelector('.product-image-wrapper');
            const arrow = card?.querySelector('.image-nav-next');

            console.log('Manual test - wrapper:', !!wrapper, 'arrow:', !!arrow);

            if (wrapper && arrow) {
                // Manually trigger the logic
                const images = JSON.parse(wrapper.dataset.images || '[]');
                console.log('Images:', images);

                if (images.length > 1) {
                    let currentIndex = parseInt(wrapper.dataset.currentIndex || '0');
                    currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                    wrapper.dataset.currentIndex = currentIndex;

                    const img = wrapper.querySelector('.product-image');
                    if (img) {
                        img.src = images[currentIndex];
                        console.log('Updated image to:', images[currentIndex]);
                    }
                }
            }
        }, productWithMultipleImages.id);

        await sleep(500);

        const nextArrow = await page.$(
            `.product-card[data-product-id="${productWithMultipleImages.id}"] .image-nav-next`
        );

        if (nextArrow) {
            // Get current image before click
            const imageBefore = await page.evaluate((productId) => {
                const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
                const img = card?.querySelector('.product-image');
                return img?.src;
            }, productWithMultipleImages.id);

            console.log('  Image before click:', imageBefore?.split('/').pop());

            await nextArrow.click();
            await sleep(1000);

            // Get debug logs
            const debugLogs = await page.evaluate(() => window.imageNavDebug);
            console.log('  Click debug logs:', debugLogs);

            // Get image after click
            const imageAfter = await page.evaluate((productId) => {
                const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
                const img = card?.querySelector('.product-image');
                const wrapper = card?.querySelector('.product-image-wrapper');
                return {
                    src: img?.src,
                    currentIndex: wrapper?.dataset.currentIndex
                };
            }, productWithMultipleImages.id);

            console.log('  Image after click:', imageAfter.src?.split('/').pop());
            console.log('  Current index:', imageAfter.currentIndex);

            if (imageBefore !== imageAfter.src) {
                console.log('\n✅ SUCCESS: Image changed after clicking arrow!');
            } else {
                console.log('\n❌ FAILED: Image did NOT change after clicking arrow');

                // Debug: Check event listener
                const debugInfo = await page.evaluate(() => {
                    const grid = document.getElementById('product-grid');
                    const wrapper = document.querySelector('.product-image-wrapper');
                    return {
                        gridFound: !!grid,
                        wrapperFound: !!wrapper,
                        imagesData: wrapper?.dataset.images,
                        currentIndex: wrapper?.dataset.currentIndex
                    };
                });
                console.log('  Debug:', debugInfo);
            }
        } else {
            console.log('❌ Next arrow not found');
        }

        await sleep(3000);
    } catch (err) {
        console.error('Test error:', err.message);
    } finally {
        await browser.close();
    }
}

testImageNavigation().catch(console.error);
