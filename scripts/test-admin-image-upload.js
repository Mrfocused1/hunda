const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testAdminImageUpload() {
    const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    console.log('Testing Admin Product Image Upload...\n');

    // Capture console logs from the page
    page.on('console', (msg) => console.log('PAGE CONSOLE:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

    try {
        // Go to admin login page first
        console.log('1. Navigating to admin login page...');
        await page.goto('https://1hundred.shop/admin-login.html', { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);

        // Check if login form exists
        const loginForm = await page.$('#admin-login-form');
        if (loginForm) {
            console.log('   Login form detected, logging in...');
            await page.type('#email', 'admin@1hundred.com');
            await page.type('#password', 'admin123');
            await page.click('#admin-login-form button[type="submit"]');
            await sleep(3000);
        }

        // Now navigate to admin page
        console.log('   Navigating to admin page...');
        await page.goto('https://1hundred.shop/admin.html', { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);

        // Wait for products to load
        console.log('2. Waiting for admin panel to load...');
        await page.waitForSelector('#products-grid', { timeout: 10000 });
        await sleep(1000);

        // Check initial product count
        const initialCount = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            return cards.length;
        });
        console.log(`   Current products: ${initialCount}`);

        // Click "Add Product" button
        console.log('\n3. Clicking Add Product button...');
        await page.evaluate(() => {
            openProductModal();
        });
        await sleep(1000);

        // Check if modal is open
        const modalOpen = await page.evaluate(() => {
            const modal = document.getElementById('product-modal');
            return modal && modal.classList.contains('active');
        });
        console.log(`   Modal open: ${modalOpen}`);

        if (!modalOpen) {
            console.log('   ERROR: Product modal did not open!');
            await browser.close();
            return;
        }

        // Fill in product details
        console.log('\n4. Filling product details...');
        const timestamp = Date.now();
        const productName = `Test Product ${timestamp}`;

        await page.type('#product-title', productName);
        await page.type('#product-price', '99.99');
        await page.select('#product-category', 'T-Shirts');
        await page.type('#product-stock', '10');
        await page.type('#product-description', 'Test description for image upload test');
        console.log(`   Product name: ${productName}`);

        // Check currentProductImages before upload
        const imagesBeforeUpload = await page.evaluate(() => {
            return {
                currentProductImagesLength:
                    typeof currentProductImages !== 'undefined' ? currentProductImages.length : 'undefined',
                currentProductImages:
                    typeof currentProductImages !== 'undefined'
                        ? currentProductImages.map((img) => img.substring(0, 50) + '...')
                        : 'undefined'
            };
        });
        console.log('\n5. Current state before upload:', imagesBeforeUpload);

        // Create a test image file
        console.log('\n6. Creating test image...');
        const testImagePath = path.join(__dirname, `test-image-${timestamp}.png`);

        // Create a simple 100x100 red PNG
        const redPngBase64 =
            'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5wQIFBEdv+5/sQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAVElEQVR42u3RAQ0AAAgDIN8/9GKXBwsYiZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZ+c0D+ZqOA8RFGzAAAAAASUVORK5CYII=';
        fs.writeFileSync(testImagePath, Buffer.from(redPngBase64, 'base64'));
        console.log(`   Created test image: ${testImagePath}`);

        // Upload image
        console.log('\n7. Uploading image...');
        const fileInput = await page.$('#product-image-file');
        if (!fileInput) {
            console.log('   ERROR: File input not found!');
            fs.unlinkSync(testImagePath);
            await browser.close();
            return;
        }

        await fileInput.uploadFile(testImagePath);
        await sleep(2000);

        // Check currentProductImages after upload
        const imagesAfterUpload = await page.evaluate(() => {
            return {
                currentProductImagesLength:
                    typeof currentProductImages !== 'undefined' ? currentProductImages.length : 'undefined',
                currentProductImages:
                    typeof currentProductImages !== 'undefined'
                        ? currentProductImages.map((img, i) => {
                              if (img.startsWith('data:')) {
                                  return `Image ${i}: base64 data (${img.length} chars)`;
                              }
                              return `Image ${i}: ${img}`;
                          })
                        : 'undefined'
            };
        });
        console.log('\n8. Current state after upload:', imagesAfterUpload);

        // Check if preview is shown
        const previewVisible = await page.evaluate(() => {
            const preview = document.getElementById('image-preview-container');
            return preview && preview.style.display !== 'none' && preview.innerHTML !== '';
        });
        console.log(`   Preview visible: ${previewVisible}`);

        // Click Save
        console.log('\n9. Saving product...');
        const saveBtn = await page.$('#product-form button[type="submit"]');
        if (!saveBtn) {
            console.log('   ERROR: Save button not found!');
            fs.unlinkSync(testImagePath);
            await browser.close();
            return;
        }

        // Monitor network requests and console during save
        let uploadPath = null;
        let savedProductData = null;

        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('supabase') && url.includes('storage')) {
                console.log('   STORAGE RESPONSE:', url);
                try {
                    const json = await response.json();
                    console.log('   Storage response data:', JSON.stringify(json, null, 2));
                } catch (e) {}
            }
            if (url.includes('supabase') && url.includes('products')) {
                console.log('   DB RESPONSE:', url);
                try {
                    const json = await response.json();
                    console.log('   DB response data:', JSON.stringify(json, null, 2));
                    if (json && json.length > 0 && json[0].title && json[0].title.includes('Test Product')) {
                        savedProductData = json[0];
                    }
                } catch (e) {}
            }
        });

        await saveBtn.click();
        await sleep(5000);

        // Check for toast message
        const toastText = await page.evaluate(() => {
            const toast = document.getElementById('toast');
            return toast ? toast.textContent : 'No toast';
        });
        console.log(`   Toast message: ${toastText}`);

        // Wait and refresh to check if product was saved correctly
        console.log('\n10. Refreshing to verify product was saved...');
        await page.reload({ waitUntil: 'networkidle2' });
        await sleep(3000);

        // Find the newly created product
        const newProduct = await page.evaluate((name) => {
            const cards = document.querySelectorAll('.product-card');
            for (const card of cards) {
                const titleEl = card.querySelector('.product-card-title');
                if (titleEl && titleEl.textContent.includes('Test Product')) {
                    const img = card.querySelector('.product-card-image img');
                    return {
                        title: titleEl.textContent,
                        imageSrc: img ? img.src : 'No image',
                        category: card.querySelector('.product-card-category')?.textContent || 'Unknown'
                    };
                }
            }
            return null;
        }, productName);

        if (newProduct) {
            console.log('\n✅ Product created:');
            console.log('   Title:', newProduct.title);
            console.log('   Image:', newProduct.imageSrc);
            console.log('   Category:', newProduct.category);

            // Check if it's the wrong image
            if (newProduct.imageSrc && newProduct.imageSrc.includes('relentless')) {
                console.log('\n❌ ERROR: Wrong image saved! Got Relentless Trophy Tee instead of uploaded image.');
            } else if (newProduct.imageSrc && newProduct.imageSrc.includes('product-1.png')) {
                console.log('\n❌ ERROR: Default placeholder image saved instead of uploaded image.');
            } else {
                console.log('\n✅ Image appears to be correct!');
            }
        } else {
            console.log('\n❌ ERROR: Product not found after refresh!');
        }

        // Clean up test image
        fs.unlinkSync(testImagePath);
        console.log('\n   Cleaned up test image file');

        await sleep(5000);
    } catch (err) {
        console.error('Test error:', err.message);
        console.error(err.stack);
    } finally {
        await browser.close();
    }
}

testAdminImageUpload().catch(console.error);
