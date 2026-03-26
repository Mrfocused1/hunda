#!/usr/bin/env node
/**
 * Puppeteer script to capture admin dashboard screenshot
 * Usage: node scripts/screenshot-admin.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('🚀 Launching browser...');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files', '--disable-web-security']
    });

    const page = await browser.newPage();

    // Set viewport to mobile size
    await page.setViewport({
        width: 1028,
        height: 1538,
        deviceScaleFactor: 2
    });

    // Navigate to admin page
    const adminUrl = 'file://' + path.resolve(__dirname, '../admin.html');
    console.log(`📄 Navigating to: ${adminUrl}`);

    // Inject auth bypass before navigation
    await page.evaluateOnNewDocument(() => {
        // Override the checkAuth function to do nothing
        window.checkAuth = function () {};
        // Also set session storage
        try {
            sessionStorage.setItem(
                '1hundred_admin_session',
                JSON.stringify({
                    timestamp: Date.now(),
                    expires: Date.now() + 3600000
                })
            );
        } catch (e) {}
    });

    await page.goto(adminUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    // Wait for page to render
    await new Promise((r) => setTimeout(r, 2000));

    // Take screenshot of dashboard
    const dashboardPath = path.resolve(__dirname, '../screenshots/admin-dashboard.png');
    await page.screenshot({
        path: dashboardPath,
        fullPage: false
    });
    console.log(`✅ Dashboard screenshot saved: ${dashboardPath}`);

    // Check localStorage data
    const storageData = await page.evaluate(() => {
        try {
            return {
                products: JSON.parse(localStorage.getItem('1hundred_products') || '[]'),
                orders: JSON.parse(localStorage.getItem('1hundred_orders') || '[]'),
                customers: JSON.parse(localStorage.getItem('1hundred_customers') || '[]')
            };
        } catch (e) {
            return { products: [], orders: [], customers: [] };
        }
    });

    console.log('\n📊 Current Data in localStorage:');
    console.log(`  Products: ${storageData.products.length}`);
    console.log(`  Orders: ${storageData.orders.length}`);
    console.log(`  Customers: ${storageData.customers.length}`);

    // Show first few items if data exists
    if (storageData.products.length > 0) {
        console.log('\n📝 Sample Products:');
        storageData.products.slice(0, 3).forEach((p) => {
            console.log(`  - ${p.title} (${p.stock} in stock)`);
        });
    }

    if (storageData.orders.length > 0) {
        console.log('\n📝 Sample Orders:');
        storageData.orders.slice(0, 3).forEach((o) => {
            console.log(`  - ${o.id}: ${o.customer} - £${o.total}`);
        });
    }

    if (storageData.customers.length > 0) {
        console.log('\n📝 Sample Customers:');
        storageData.customers.slice(0, 3).forEach((c) => {
            console.log(`  - ${c.firstName} ${c.lastName}: ${c.email}`);
        });
    }

    // Navigate to Products section
    console.log('\n📸 Taking Products page screenshot...');
    try {
        await page.click('.admin-nav-item[data-section="products"]');
        await new Promise((r) => setTimeout(r, 1500));

        const productsPath = path.resolve(__dirname, '../screenshots/admin-products.png');
        await page.screenshot({
            path: productsPath,
            fullPage: false
        });
        console.log(`✅ Products screenshot saved: ${productsPath}`);
    } catch (e) {
        console.log('⚠️ Could not navigate to Products:', e.message);
    }

    // Navigate to Orders section
    console.log('\n📸 Taking Orders page screenshot...');
    try {
        await page.click('.admin-nav-item[data-section="orders"]');
        await new Promise((r) => setTimeout(r, 1500));

        const ordersPath = path.resolve(__dirname, '../screenshots/admin-orders.png');
        await page.screenshot({
            path: ordersPath,
            fullPage: false
        });
        console.log(`✅ Orders screenshot saved: ${ordersPath}`);
    } catch (e) {
        console.log('⚠️ Could not navigate to Orders:', e.message);
    }

    // Navigate to Customers section
    console.log('\n📸 Taking Customers page screenshot...');
    try {
        await page.click('.admin-nav-item[data-section="customers"]');
        await new Promise((r) => setTimeout(r, 1500));

        const customersPath = path.resolve(__dirname, '../screenshots/admin-customers.png');
        await page.screenshot({
            path: customersPath,
            fullPage: false
        });
        console.log(`✅ Customers screenshot saved: ${customersPath}`);
    } catch (e) {
        console.log('⚠️ Could not navigate to Customers:', e.message);
    }

    await browser.close();
    console.log('\n🎉 All screenshots captured!');
    console.log('\nView screenshots in: /screenshots/');
})().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
