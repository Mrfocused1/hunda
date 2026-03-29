#!/usr/bin/env node
/**
 * Screenshot Testing with Puppeteer
 *
 * Captures mobile and desktop screenshots of all site pages.
 * Useful for visual regression testing and catching layout issues.
 *
 * Usage:
 *   npm run test:screenshots       # Capture all pages
 *   npm run test:screenshots:mobile # Mobile only
 *   npm run test:screenshots:desktop # Desktop only
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    outputDir: process.env.OUTPUT_DIR || './screenshots',
    pages: [
        { path: '/', name: 'home' },
        { path: '/shop', name: 'shop' },
        { path: '/shop?new=true', name: 'shop-new-in' },
        { path: '/product?id=1', name: 'product-detail' },
        { path: '/cart', name: 'cart' },
        { path: '/checkout', name: 'checkout' },

        { path: '/account', name: 'account' },
        { path: '/about', name: 'about' }
    ],
    viewports: {
        mobile: {
            iphoneSE: { width: 375, height: 667, deviceScaleFactor: 2 },
            iphone12: { width: 390, height: 844, deviceScaleFactor: 3 },
            pixel5: { width: 393, height: 851, deviceScaleFactor: 2.75 }
        },
        desktop: {
            laptop: { width: 1440, height: 900, deviceScaleFactor: 1 },
            desktop: { width: 1920, height: 1080, deviceScaleFactor: 1 }
        }
    }
};

// Parse command line args
const args = process.argv.slice(2);
const testMobile = args.includes('--mobile') || args.includes('-m') || !args.includes('--desktop');
const testDesktop = args.includes('--desktop') || args.includes('-d') || !args.includes('--mobile');

async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreenshot(page, url, viewport, filename) {
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for fonts and images to load
    await delay(1000);

    // Take full page screenshot
    await page.screenshot({
        path: filename,
        fullPage: true
    });

    console.log(`  ✓ ${path.basename(filename)}`);
}

async function testMobileMenu(page, url, outputDir, pageName) {
    const viewport = CONFIG.viewports.mobile.iphoneSE;
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await delay(500);

    // Click hamburger to open mobile menu
    const menuToggle = await page.$('#menu-toggle');
    if (menuToggle) {
        await menuToggle.click();
        await delay(300); // Wait for animation

        const menuFilename = path.join(outputDir, `${pageName}-mobile-menu-open.png`);
        await page.screenshot({
            path: menuFilename,
            fullPage: false, // Viewport only for menu
            clip: { x: 0, y: 0, width: viewport.width, height: viewport.height }
        });
        console.log(`  ✓ ${path.basename(menuFilename)} (menu open)`);
    }
}

async function testCartDrawer(page, url, outputDir, pageName) {
    const viewport = CONFIG.viewports.mobile.iphoneSE;
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await delay(500);

    // Try to open cart drawer
    const cartTrigger = await page.$('#cart-trigger-mobile, #cart-trigger');
    if (cartTrigger) {
        await cartTrigger.click();
        await delay(300);

        const cartFilename = path.join(outputDir, `${pageName}-mobile-cart-open.png`);
        await page.screenshot({
            path: cartFilename,
            fullPage: false,
            clip: { x: 0, y: 0, width: viewport.width, height: viewport.height }
        });
        console.log(`  ✓ ${path.basename(cartFilename)} (cart open)`);
    }
}

async function runTests() {
    console.log('\n📸 Screenshot Testing\n');
    console.log(`Base URL: ${CONFIG.baseUrl}\n`);

    // Create output directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(CONFIG.outputDir, timestamp);
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Output: ${outputDir}\n`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        for (const pageConfig of CONFIG.pages) {
            console.log(`Testing: ${pageConfig.name}`);
            const page = await browser.newPage();
            const url = `${CONFIG.baseUrl}${pageConfig.path}`;

            try {
                // Mobile screenshots
                if (testMobile) {
                    // iPhone SE (most common small screen)
                    await captureScreenshot(
                        page,
                        url,
                        CONFIG.viewports.mobile.iphoneSE,
                        path.join(outputDir, `${pageConfig.name}-mobile.png`)
                    );

                    // Test mobile menu open
                    await testMobileMenu(page, url, outputDir, pageConfig.name);

                    // Test cart drawer
                    await testCartDrawer(page, url, outputDir, pageConfig.name);
                }

                // Desktop screenshots
                if (testDesktop) {
                    await captureScreenshot(
                        page,
                        url,
                        CONFIG.viewports.desktop.laptop,
                        path.join(outputDir, `${pageConfig.name}-desktop.png`)
                    );
                }
            } catch (err) {
                console.error(`  ✗ Error: ${err.message}`);
            } finally {
                await page.close();
            }

            console.log('');
        }

        console.log('\n✅ Screenshots captured successfully!\n');
        console.log(`View them at: ${outputDir}\n`);

        // Generate HTML report
        generateReport(outputDir, timestamp);
    } finally {
        await browser.close();
    }
}

function generateReport(outputDir, timestamp) {
    const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.png'));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Screenshot Report - ${timestamp}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 2rem; background: #f5f5f5; }
    h1 { margin-bottom: 2rem; }
    .page-group { margin-bottom: 3rem; background: white; padding: 1.5rem; border-radius: 8px; }
    .page-group h2 { margin-top: 0; text-transform: capitalize; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
    .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .screenshot { }
    .screenshot h3 { font-size: 0.875rem; color: #666; margin-bottom: 0.5rem; }
    .screenshot img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>📸 Screenshot Report - ${timestamp}</h1>
  ${groupScreenshotsByPage(files)}
</body>
</html>`;

    fs.writeFileSync(path.join(outputDir, 'index.html'), html);
    console.log(`📄 Report generated: ${path.join(outputDir, 'index.html')}\n`);
}

function groupScreenshotsByPage(files) {
    const pages = {};
    files.forEach((file) => {
        const pageName = file.split('-')[0];
        if (!pages[pageName]) pages[pageName] = [];
        pages[pageName].push(file);
    });

    return Object.entries(pages)
        .map(
            ([page, screenshots]) => `
      <div class="page-group">
        <h2>${page}</h2>
        <div class="screenshots">
          ${screenshots
              .map(
                  (s) => `
            <div class="screenshot">
              <h3>${s.replace('.png', '').replace(page + '-', '')}</h3>
              <img src="${s}" alt="${s}">
            </div>
          `
              )
              .join('')}
        </div>
      </div>
    `
        )
        .join('');
}

runTests().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
