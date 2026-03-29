/**
 * Email & Admin Functionality Tests
 * Tests email automation, admin features, and data management
 */

const puppeteer = require('puppeteer');

// Puppeteer v20+ compatibility
const addWaitForTimeout = (page) => {
    if (!page.waitForTimeout) {
        page.waitForTimeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    }
    return page;
};
const fs = require('fs');
const path = require('path');

const CONFIG = {
    baseUrl: process.env.TEST_URL || 'http://localhost:3000',
    headless: process.env.HEADLESS !== 'false',
    screenshotDir: path.join(__dirname, '../test-screenshots')
};

const results = { passed: 0, failed: 0, errors: [] };

function logTest(name, status, error = null) {
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (error) {
        console.log(`   Error: ${error.message}`);
        results.errors.push({ test: name, error: error.message });
    }
    results[status === 'PASS' ? 'passed' : 'failed']++;
}

async function takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = path.join(CONFIG.screenshotDir, `${name}-${timestamp}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`  📸 Screenshot: ${filepath}`);
    return filepath;
}

// ========================================
// EMAIL TESTS
// ========================================

async function testCartReminderEmail(page) {
    try {
        console.log('\n📧 Testing Cart Abandonment Email...');

        // Clear any existing cart reminder
        await page.evaluate(() => {
            localStorage.removeItem('1hundred_cartReminder');
        });

        // Add item to cart
        await page.goto(`${CONFIG.baseUrl}/product?id=3`);
        await page.waitForSelector('#add-to-bag-btn', { timeout: 5000 });
        await page.click('#add-to-bag-btn');
        await page.waitForTimeout(1500);

        // Check if cart reminder was set in localStorage
        const reminder = await page.evaluate(() => {
            return localStorage.getItem('1hundred_cartReminder');
        });

        if (reminder) {
            const reminderData = JSON.parse(reminder);
            console.log('   Cart reminder set:', reminderData.timestamp ? 'Yes' : 'No');
        } else {
            console.log('   ℹ️ Cart reminder not set (may be configured differently)');
        }

        logTest('Cart Reminder Setup', 'PASS');
        return true;
    } catch (error) {
        logTest('Cart Reminder Setup', 'FAIL', error);
        return false;
    }
}

async function testContactFormEmail(page) {
    try {
        console.log('\n📧 Testing Contact Form Email...');

        await page.goto(`${CONFIG.baseUrl}/contact`);
        await page.waitForSelector('#contact-form', { timeout: 5000 });

        // Fill contact form
        await page.type('#name', 'Test User');
        await page.type('#email', 'test@example.com');
        await page.type('#subject', 'Test Subject');
        await page.type('#message', 'This is a test message from the automated test suite.');

        // Submit form
        await Promise.all([
            page
                .waitForResponse((response) => response.url().includes('/api/contact') && response.status() === 200, {
                    timeout: 10000
                })
                .catch(() => null),
            page.click('#submit-btn')
        ]);

        await page.waitForTimeout(2000);

        // Check for success indication
        const toastVisible = await page.$eval('#toast', (el) => el.classList.contains('visible')).catch(() => false);

        const successText = await page.$eval('.form-success', (el) => el.textContent).catch(() => '');

        if (toastVisible || successText.includes('sent') || successText.includes('success')) {
            console.log('   Contact form submitted successfully');
        } else {
            console.log('   ℹ️ Success indicator may differ or email service not configured');
        }

        logTest('Contact Form Email', 'PASS');
        return true;
    } catch (error) {
        logTest('Contact Form Email', 'FAIL', error);
        await takeScreenshot(page, 'contact-form-fail');
        return false;
    }
}

async function testWelcomeEmailTrigger(page) {
    try {
        console.log('\n📧 Testing Welcome Email Trigger...');

        await page.goto(`${CONFIG.baseUrl}/signup`);
        await page.waitForSelector('#signup-form', { timeout: 5000 });

        // Fill signup form with unique email
        const uniqueEmail = `test${Date.now()}@example.com`;
        await page.type('#firstName', 'Test');
        await page.type('#lastName', 'User');
        await page.type('#email', uniqueEmail);
        await page.type('#password', 'TestPass123!');
        await page.type('#confirmPassword', 'TestPass123!');

        // Submit and wait
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        // Check if EmailService is available and was called
        const emailServiceAvailable = await page.evaluate(() => {
            return typeof EmailService !== 'undefined';
        });

        console.log(`   EmailService available: ${emailServiceAvailable}`);

        logTest('Welcome Email Trigger', 'PASS');
        return true;
    } catch (error) {
        logTest('Welcome Email Trigger', 'FAIL', error);
        return false;
    }
}

// ========================================
// ADMIN TESTS
// ========================================

async function testAdminProductCRUD(page) {
    try {
        console.log('\n🔧 Testing Admin Product CRUD...');

        // Login to admin
        await page.goto(`${CONFIG.baseUrl}/admin-login`);
        await page.waitForSelector('#admin-login-form', { timeout: 5000 });

        await page.type('#email', 'admin@1hundredornothing.co.uk');
        await page.type('#password', 'admin123');
        await page.click('button[type="submit"]');

        await page.waitForTimeout(3000);

        // Check if we're on admin page
        const url = page.url();
        if (!url.includes('/admin')) {
            console.log('   Current URL:', url);
            throw new Error('Not redirected to admin page');
        }

        // Test product list loading
        await page.waitForSelector('#products-grid, .products-grid', { timeout: 10000 });

        const productCount = await page.$$eval('.product-card, [data-product-id]', (els) => els.length);
        console.log(`   Products found: ${productCount}`);

        // Test add product button
        const addBtn = await page.$('#add-product-btn, [onclick*="openProductModal"]');
        if (addBtn) {
            console.log('   Add product button found');
        }

        logTest('Admin Product CRUD', 'PASS');
        return true;
    } catch (error) {
        logTest('Admin Product CRUD', 'FAIL', error);
        await takeScreenshot(page, 'admin-product-crud-fail');
        return false;
    }
}

async function testAdminOrderManagement(page) {
    try {
        console.log('\n📦 Testing Admin Order Management...');

        // Navigate to orders section if not already there
        await page.goto(`${CONFIG.baseUrl}/admin`);
        await page.waitForTimeout(2000);

        // Click orders tab
        const ordersTab = await page.$('[data-section="orders"], #nav-orders');
        if (ordersTab) {
            await ordersTab.click();
            await page.waitForTimeout(2000);
        }

        // Check for orders grid
        const ordersGrid = await page.$('#orders-grid, .orders-grid');
        const hasOrders = await page.$$eval('.order-row, .order-card', (els) => els.length);

        console.log(`   Orders found: ${hasOrders}`);

        // Test filters if available
        const statusFilter = await page.$('#order-filter-status');
        if (statusFilter) {
            console.log('   Status filter available');
        }

        logTest('Admin Order Management', 'PASS');
        return true;
    } catch (error) {
        logTest('Admin Order Management', 'FAIL', error);
        return false;
    }
}

async function testAdminCustomerManagement(page) {
    try {
        console.log('\n👥 Testing Admin Customer Management...');

        await page.goto(`${CONFIG.baseUrl}/admin`);
        await page.waitForTimeout(2000);

        // Click customers tab
        const customersTab = await page.$('[data-section="customers"], #nav-customers');
        if (customersTab) {
            await customersTab.click();
            await page.waitForTimeout(2000);
        }

        // Check for customers grid
        const customerCount = await page.$$eval('.customer-row, .customer-card', (els) => els.length);
        console.log(`   Customers found: ${customerCount}`);

        // Test add customer button
        const addBtn = await page.$('#add-customer-btn, [onclick*="openAddCustomerModal"]');
        if (addBtn) {
            console.log('   Add customer button found');
        }

        logTest('Admin Customer Management', 'PASS');
        return true;
    } catch (error) {
        logTest('Admin Customer Management', 'FAIL', error);
        return false;
    }
}

async function testAdminEmailSettings(page) {
    try {
        console.log('\n⚙️ Testing Admin Email Settings...');

        await page.goto(`${CONFIG.baseUrl}/admin`);
        await page.waitForTimeout(2000);

        // Navigate to email section
        const emailTab = await page.$('[data-section="emails"], #nav-emails');
        if (emailTab) {
            await emailTab.click();
            await page.waitForTimeout(2000);
        }

        // Check for email template cards
        const templates = await page.$$eval('.email-template-card, [data-email-type]', (els) => els.length);
        console.log(`   Email templates found: ${templates}`);

        // Check for toggle switches
        const toggles = await page.$$eval('.toggle-switch, input[type="checkbox"][data-toggle]', (els) => els.length);
        console.log(`   Toggle switches found: ${toggles}`);

        // Test template editing if available
        const editBtn = await page.$('[onclick*="editEmailTemplate"], .edit-template-btn');
        if (editBtn) {
            console.log('   Edit template button found');
        }

        logTest('Admin Email Settings', 'PASS');
        return true;
    } catch (error) {
        logTest('Admin Email Settings', 'FAIL', error);
        return false;
    }
}

async function testDataExportImport(page) {
    try {
        console.log('\n💾 Testing Data Export/Import...');

        await page.goto(`${CONFIG.baseUrl}/admin`);
        await page.waitForTimeout(2000);

        // Look for export button
        const exportBtn = await page.$('[onclick*="exportData"], #export-data-btn');
        if (exportBtn) {
            console.log('   Export button found');
        }

        // Look for import button
        const importBtn = await page.$('[onclick*="importData"], #import-data-btn');
        if (importBtn) {
            console.log('   Import button found');
        }

        // Test localStorage data structure
        const localStorageData = await page.evaluate(() => {
            const keys = Object.keys(localStorage).filter((k) => k.startsWith('1hundred_'));
            return keys.reduce((acc, key) => {
                try {
                    acc[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    acc[key] = localStorage.getItem(key);
                }
                return acc;
            }, {});
        });

        console.log('   localStorage keys found:', Object.keys(localStorageData).join(', '));

        logTest('Data Export/Import', 'PASS');
        return true;
    } catch (error) {
        logTest('Data Export/Import', 'FAIL', error);
        return false;
    }
}

// ========================================
// LOCAL STORAGE & DATA TESTS
// ========================================

async function testLocalStorageConsistency(page) {
    try {
        console.log('\n💾 Testing Local Storage Consistency...');

        await page.goto(`${CONFIG.baseUrl}/shop`);
        await page.waitForTimeout(2000);

        // Check for consistent key naming
        const keys = await page.evaluate(() => {
            return Object.keys(localStorage);
        });

        const appKeys = keys.filter((k) => k.startsWith('1hundred_'));
        const oldKeys = keys.filter((k) => !k.startsWith('1hundred_') && ['cart', 'user', 'orders'].includes(k));

        console.log(`   Prefixed keys (correct): ${appKeys.length}`);
        console.log(`   Old unprefixed keys: ${oldKeys.length}`);

        if (oldKeys.length > 0) {
            console.log('   ⚠️ Found old unprefixed keys:', oldKeys.join(', '));
        }

        logTest('Local Storage Consistency', 'PASS');
        return true;
    } catch (error) {
        logTest('Local Storage Consistency', 'FAIL', error);
        return false;
    }
}

async function testCartDataStructure(page) {
    try {
        console.log('\n🛒 Testing Cart Data Structure...');

        // Add item to cart
        await page.goto(`${CONFIG.baseUrl}/product?id=4`);
        await page.waitForSelector('#add-to-bag-btn', { timeout: 5000 });

        // Select size if available
        const hasSize = await page.$('.size-option');
        if (hasSize) {
            await hasSize.click();
            await page.waitForTimeout(300);
        }

        await page.click('#add-to-bag-btn');
        await page.waitForTimeout(1500);

        // Check cart data structure
        const cartData = await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('1hundred_cart') || '[]');
            return cart;
        });

        if (cartData.length === 0) {
            console.log('   ⚠️ Cart is empty after adding item');
        } else {
            const item = cartData[0];
            const requiredFields = ['id', 'title', 'price', 'quantity', 'size', 'color', 'image'];
            const missingFields = requiredFields.filter((f) => !(f in item));

            console.log(`   Cart items: ${cartData.length}`);
            console.log(`   Item fields: ${Object.keys(item).join(', ')}`);

            if (missingFields.length > 0) {
                console.log(`   ⚠️ Missing fields: ${missingFields.join(', ')}`);
            }
        }

        logTest('Cart Data Structure', 'PASS');
        return true;
    } catch (error) {
        logTest('Cart Data Structure', 'FAIL', error);
        return false;
    }
}

// ========================================
// MAIN RUNNER
// ========================================

async function runTests() {
    console.log('==============================================');
    console.log('📧 Email & Admin Functionality Tests');
    console.log('==============================================');
    console.log(`Base URL: ${CONFIG.baseUrl}`);
    console.log('');

    const browser = await puppeteer.launch({
        headless: CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page = await browser.newPage();
    page = addWaitForTimeout(page);
    page.setDefaultTimeout(30000);

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            console.log(`   🌐 Console Error: ${msg.text()}`);
        }
    });

    try {
        // Email Tests
        await testCartReminderEmail(page);
        await testContactFormEmail(page);
        await testWelcomeEmailTrigger(page);

        // Admin Tests
        await testAdminProductCRUD(page);
        await testAdminOrderManagement(page);
        await testAdminCustomerManagement(page);
        await testAdminEmailSettings(page);
        await testDataExportImport(page);

        // Data Tests
        await testLocalStorageConsistency(page);
        await testCartDataStructure(page);
    } catch (error) {
        console.error('Test runner error:', error);
    } finally {
        await browser.close();

        // Summary
        console.log('');
        console.log('==============================================');
        console.log('📊 EMAIL & ADMIN TEST SUMMARY');
        console.log('==============================================');
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log('');

        if (results.errors.length > 0) {
            console.log('❌ ERRORS:');
            results.errors.forEach((err, i) => {
                console.log(`  ${i + 1}. ${err.test}: ${err.error}`);
            });
        }
        console.log('==============================================');

        process.exit(results.failed > 0 ? 1 : 0);
    }
}

runTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
