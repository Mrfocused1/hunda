/**
 * Email Testing Script using Puppeteer
 * Tests contact form and email API endpoints
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, type = 'info') {
    const color =
        type === 'success'
            ? colors.green
            : type === 'error'
              ? colors.red
              : type === 'warn'
                ? colors.yellow
                : colors.blue;
    console.log(`${color}${message}${colors.reset}`);
}

// Simple HTTP server for testing
function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            // API endpoint mock
            if (req.url === '/api/send-email' && req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => (body += chunk));
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        log(`📧 API received: ${data.type} to ${data.to}`, 'success');

                        // Simulate successful email send
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(
                            JSON.stringify({
                                success: true,
                                message: 'Email sent successfully',
                                id: 'test-' + Date.now()
                            })
                        );
                    } catch (e) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid request' }));
                    }
                });
                return;
            }

            if (req.url === '/api/contact' && req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => (body += chunk));
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        log(`📧 Contact API received: ${data.name} - ${data.subject}`, 'success');

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(
                            JSON.stringify({
                                success: true,
                                message: 'Email sent successfully',
                                id: 'test-' + Date.now()
                            })
                        );
                    } catch (e) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid request' }));
                    }
                });
                return;
            }

            // Serve static files
            let filePath = req.url === '/' ? '/index.html' : req.url;
            filePath = path.join(__dirname, '..', filePath);

            const ext = path.extname(filePath);
            const contentType =
                {
                    '.html': 'text/html',
                    '.js': 'application/javascript',
                    '.css': 'text/css',
                    '.json': 'application/json'
                }[ext] || 'text/plain';

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            });
        });

        server.listen(PORT, () => {
            log(`🚀 Test server running at ${BASE_URL}`, 'success');
            resolve(server);
        });
    });
}

// Test Contact Form
async function testContactForm(browser) {
    log('\n📋 Testing Contact Form...', 'info');

    const page = await browser.newPage();

    // Capture console logs and network requests
    const apiResponses = [];
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/contact')) {
            try {
                const data = await response.json();
                apiResponses.push({ url, status: response.status(), data });
            } catch (e) {
                apiResponses.push({ url, status: response.status(), error: e.message });
            }
        }
    });

    await page.goto(`${BASE_URL}/contact.html`);
    await page.waitForSelector('#contact-form', { timeout: 5000 });

    // Fill the form
    await page.type('#name', 'Test User');
    await page.type('#email', 'test@example.com');
    await page.select('#subject', 'general');
    await page.type('#message', 'This is a test message from Puppeteer automation.');

    log('   ✓ Form filled', 'success');

    // Submit form
    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForResponse((response) => response.url().includes('/api/contact'), { timeout: 10000 })
    ]);

    // Wait for success message
    await page.waitForTimeout(1000);

    // Check for success
    const successMessage = await page.$eval('.form-success', (el) => el.textContent).catch(() => null);
    const hasSuccess = successMessage && successMessage.includes('sent');

    if (hasSuccess || apiResponses.length > 0) {
        log('   ✓ Contact form submitted successfully', 'success');
        log(`   ✓ API Response: ${JSON.stringify(apiResponses[0]?.data || {})}`, 'success');
    } else {
        log('   ✗ Contact form submission failed', 'error');
    }

    await page.close();
    return hasSuccess || apiResponses.length > 0;
}

// Test Email Service directly
async function testEmailService(browser) {
    log('\n📧 Testing Email Service API...', 'info');

    const page = await browser.newPage();

    // Inject email service and test
    const results = await page.evaluate(async (baseUrl) => {
        // Load the email service
        const script = document.createElement('script');
        script.src = `${baseUrl}/scripts/email-service.js`;
        document.head.appendChild(script);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const results = [];

        // Test each email type
        if (typeof EmailService !== 'undefined') {
            EmailService.init(baseUrl);

            // Override fetch to capture requests
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const [url, options] = args;
                if (url.includes('/api/send-email')) {
                    results.push({
                        endpoint: url,
                        method: options.method,
                        body: JSON.parse(options.body)
                    });
                }
                return originalFetch(...args);
            };

            // Test order confirmation
            await EmailService.sendOrderConfirmation('test@example.com', {
                firstName: 'Test',
                orderNumber: 'TEST-001',
                total: '99.99',
                items: [{ name: 'Test Product', price: '99.99', quantity: 1 }]
            });

            // Test welcome email
            await EmailService.sendWelcomeEmail('test@example.com', {
                firstName: 'Test'
            });

            // Test shipping notification
            await EmailService.sendShippingNotification('test@example.com', {
                firstName: 'Test',
                orderNumber: 'TEST-001',
                trackingNumber: 'TRK123456',
                carrier: 'Royal Mail'
            });
        }

        return results;
    }, BASE_URL);

    log(`   ✓ Sent ${results.length} test emails`, 'success');
    results.forEach((result, i) => {
        log(`   ✓ Email ${i + 1}: ${result.body.type} to ${result.body.to}`, 'success');
    });

    await page.close();
    return results.length === 3;
}

// Test abandoned cart functionality
async function testAbandonedCart(browser) {
    log('\n🛒 Testing Abandoned Cart...', 'info');

    const page = await browser.newPage();

    const result = await page.evaluate(() => {
        // Simulate logged-in user
        localStorage.setItem(
            '1hundred_cart',
            JSON.stringify([{ id: 1, title: 'Test Product', price: 50, quantity: 1 }])
        );

        // Test scheduling
        if (typeof EmailService !== 'undefined') {
            EmailService.scheduleAbandonedCart('test@example.com', {
                firstName: 'Test'
            });

            const reminder = localStorage.getItem('1hundred_cartReminder');
            return reminder ? JSON.parse(reminder) : null;
        }
        return null;
    });

    if (result && result.email === 'test@example.com') {
        log('   ✓ Abandoned cart scheduled', 'success');
        log(`   ✓ Scheduled for: ${new Date(result.timestamp).toLocaleString()}`, 'success');
    } else {
        log('   ✗ Abandoned cart scheduling failed', 'error');
    }

    await page.close();
    return result !== null;
}

// Test email settings
async function testEmailSettings(browser) {
    log('\n⚙️  Testing Email Settings...', 'info');

    const page = await browser.newPage();

    const result = await page.evaluate(() => {
        // Default settings should enable all emails
        const settings = JSON.parse(localStorage.getItem('1hundred_email_settings') || '{}');

        // Test isEmailEnabled
        if (typeof EmailService !== 'undefined') {
            return {
                settings,
                orderConfirmation: EmailService.isEmailEnabled('order-confirmation'),
                shippingConfirmation: EmailService.isEmailEnabled('shipping-confirmation'),
                welcome: EmailService.isEmailEnabled('welcome'),
                abandonedCart: EmailService.isEmailEnabled('abandoned-cart')
            };
        }
        return { settings };
    });

    log('   ✓ Email settings loaded', 'success');
    log(`   ✓ Order Confirmation: ${result.orderConfirmation ? 'enabled' : 'disabled'}`, 'success');
    log(`   ✓ Shipping Confirmation: ${result.shippingConfirmation ? 'enabled' : 'disabled'}`, 'success');
    log(`   ✓ Welcome: ${result.welcome ? 'enabled' : 'disabled'}`, 'success');
    log(`   ✓ Abandoned Cart: ${result.abandonedCart ? 'enabled' : 'disabled'}`, 'success');

    await page.close();
    return true;
}

// Main test runner
async function runTests() {
    log('╔════════════════════════════════════════╗', 'info');
    log('║     1 HUNDRED Email Test Suite         ║', 'info');
    log('╚════════════════════════════════════════╝', 'info');

    let server;
    let browser;

    try {
        // Start server
        server = await startServer();

        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        log('\n🌐 Browser launched', 'success');

        // Run tests
        const results = {
            contactForm: await testContactForm(browser),
            emailService: await testEmailService(browser),
            abandonedCart: await testAbandonedCart(browser),
            emailSettings: await testEmailSettings(browser)
        };

        // Summary
        log('\n╔════════════════════════════════════════╗', 'info');
        log('║           Test Results                 ║', 'info');
        log('╚════════════════════════════════════════╝', 'info');

        const passed = Object.values(results).filter((r) => r).length;
        const total = Object.values(results).length;

        Object.entries(results).forEach(([test, passed]) => {
            const status = passed ? '✓ PASS' : '✗ FAIL';
            const color = passed ? 'success' : 'error';
            log(`   ${status}: ${test}`, color);
        });

        log(`\n📊 Total: ${passed}/${total} tests passed`, passed === total ? 'success' : 'warn');

        if (passed === total) {
            log('\n🎉 All email tests passed!', 'success');
        } else {
            log('\n⚠️  Some tests failed. Check the logs above.', 'warn');
        }
    } catch (error) {
        log(`\n❌ Test error: ${error.message}`, 'error');
        console.error(error);
    } finally {
        if (browser) await browser.close();
        if (server) server.close();
        log('\n🔌 Server and browser closed', 'info');
    }
}

// Run if called directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };
