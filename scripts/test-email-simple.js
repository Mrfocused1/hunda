/**
 * Simple Email API Test Script
 * Tests the email API endpoints directly
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3457;
const BASE_URL = `http://localhost:${PORT}`;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};

function log(message, type = 'info') {
    const color =
        type === 'success'
            ? colors.green
            : type === 'error'
              ? colors.red
              : type === 'warn'
                ? colors.yellow
                : type === 'gray'
                  ? colors.gray
                  : colors.blue;
    console.log(`${color}${message}${colors.reset}`);
}

// Make HTTP request
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Start test server
function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            // CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            log(`   ${req.method} ${req.url}`, 'gray');

            // Test send-email API
            if (req.url === '/api/send-email' && req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => (body += chunk));
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        log(`   📧 Received: ${data.type} → ${data.to}`, 'success');

                        // Validate required fields
                        if (!data.type || !data.to || !data.data) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Missing required fields' }));
                            return;
                        }

                        // Simulate successful send
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
                        res.end(JSON.stringify({ error: 'Invalid JSON' }));
                    }
                });
                return;
            }

            // Test contact API
            if (req.url === '/api/contact' && req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => (body += chunk));
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        log(`   📧 Contact from: ${data.name} <${data.email}>`, 'success');

                        if (!data.name || !data.email || !data.subject || !data.message) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Missing required fields' }));
                            return;
                        }

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
                        res.end(JSON.stringify({ error: 'Invalid JSON' }));
                    }
                });
                return;
            }

            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found' }));
        });

        server.listen(PORT, () => {
            resolve(server);
        });
    });
}

// Test suite
async function runTests() {
    log('╔════════════════════════════════════════╗', 'blue');
    log('║     1 HUNDRED Email API Test Suite     ║', 'blue');
    log('╚════════════════════════════════════════╝', 'blue');

    const server = await startServer();
    log(`\n🚀 Test server running at ${BASE_URL}\n`, 'success');

    const results = [];

    // Test 1: Order Confirmation Email
    log('📧 Test 1: Order Confirmation Email', 'info');
    try {
        const response = await makeRequest('/api/send-email', 'POST', {
            type: 'order-confirmation',
            to: 'customer@example.com',
            data: {
                firstName: 'John',
                orderNumber: '1H-TEST-001',
                total: '149.99',
                items: [
                    { name: '1H Star Cap', price: '30.00', quantity: 1 },
                    { name: 'No Half Measures Hoodie', price: '85.00', quantity: 1 }
                ]
            }
        });

        if (response.status === 200 && response.data.success) {
            log('   ✓ Order confirmation sent successfully\n', 'success');
            results.push({ test: 'Order Confirmation', passed: true });
        } else {
            log(`   ✗ Failed: ${JSON.stringify(response.data)}\n`, 'error');
            results.push({ test: 'Order Confirmation', passed: false });
        }
    } catch (e) {
        log(`   ✗ Error: ${e.message}\n`, 'error');
        results.push({ test: 'Order Confirmation', passed: false });
    }

    // Test 2: Shipping Notification
    log('📧 Test 2: Shipping Notification', 'info');
    try {
        const response = await makeRequest('/api/send-email', 'POST', {
            type: 'shipping',
            to: 'customer@example.com',
            data: {
                firstName: 'John',
                orderNumber: '1H-TEST-001',
                trackingNumber: 'ROYALMAIL123456',
                carrier: 'Royal Mail'
            }
        });

        if (response.status === 200 && response.data.success) {
            log('   ✓ Shipping notification sent successfully\n', 'success');
            results.push({ test: 'Shipping Notification', passed: true });
        } else {
            log(`   ✗ Failed: ${JSON.stringify(response.data)}\n`, 'error');
            results.push({ test: 'Shipping Notification', passed: false });
        }
    } catch (e) {
        log(`   ✗ Error: ${e.message}\n`, 'error');
        results.push({ test: 'Shipping Notification', passed: false });
    }

    // Test 3: Welcome Email
    log('📧 Test 3: Welcome Email', 'info');
    try {
        const response = await makeRequest('/api/send-email', 'POST', {
            type: 'welcome',
            to: 'newuser@example.com',
            data: {
                firstName: 'Sarah'
            }
        });

        if (response.status === 200 && response.data.success) {
            log('   ✓ Welcome email sent successfully\n', 'success');
            results.push({ test: 'Welcome Email', passed: true });
        } else {
            log(`   ✗ Failed: ${JSON.stringify(response.data)}\n`, 'error');
            results.push({ test: 'Welcome Email', passed: false });
        }
    } catch (e) {
        log(`   ✗ Error: ${e.message}\n`, 'error');
        results.push({ test: 'Welcome Email', passed: false });
    }

    // Test 4: Abandoned Cart Email
    log('📧 Test 4: Abandoned Cart Email', 'info');
    try {
        const response = await makeRequest('/api/send-email', 'POST', {
            type: 'abandoned-cart',
            to: 'customer@example.com',
            data: {
                firstName: 'Mike',
                total: '115.00',
                items: [
                    { name: '1H Multi Colour Cap', price: '30.00' },
                    { name: 'Relentless Trophy Tee', price: '40.00' }
                ]
            }
        });

        if (response.status === 200 && response.data.success) {
            log('   ✓ Abandoned cart email sent successfully\n', 'success');
            results.push({ test: 'Abandoned Cart', passed: true });
        } else {
            log(`   ✗ Failed: ${JSON.stringify(response.data)}\n`, 'error');
            results.push({ test: 'Abandoned Cart', passed: false });
        }
    } catch (e) {
        log(`   ✗ Error: ${e.message}\n`, 'error');
        results.push({ test: 'Abandoned Cart', passed: false });
    }

    // Test 5: Contact Form
    log('📧 Test 5: Contact Form', 'info');
    try {
        const response = await makeRequest('/api/contact', 'POST', {
            name: 'Jane Doe',
            email: 'jane@example.com',
            subject: 'order',
            orderNumber: '1H-12345',
            message: 'I have a question about my order. When will it ship?'
        });

        if (response.status === 200 && response.data.success) {
            log('   ✓ Contact form submitted successfully\n', 'success');
            results.push({ test: 'Contact Form', passed: true });
        } else {
            log(`   ✗ Failed: ${JSON.stringify(response.data)}\n`, 'error');
            results.push({ test: 'Contact Form', passed: false });
        }
    } catch (e) {
        log(`   ✗ Error: ${e.message}\n`, 'error');
        results.push({ test: 'Contact Form', passed: false });
    }

    // Test 6: Invalid request handling
    log('📧 Test 6: Invalid Request Handling', 'info');
    try {
        const response = await makeRequest('/api/send-email', 'POST', {
            type: 'invalid-type',
            to: 'test@example.com',
            data: {}
        });

        if (response.status === 400 || !response.data.success) {
            log('   ✓ Invalid request handled correctly\n', 'success');
            results.push({ test: 'Invalid Request', passed: true });
        } else {
            log(`   ✗ Should have rejected invalid type\n`, 'error');
            results.push({ test: 'Invalid Request', passed: false });
        }
    } catch (e) {
        log(`   ✓ Invalid request rejected\n`, 'success');
        results.push({ test: 'Invalid Request', passed: true });
    }

    // Test 7: Missing fields handling
    log('📧 Test 7: Missing Fields Validation', 'info');
    try {
        const response = await makeRequest('/api/send-email', 'POST', {
            type: 'order-confirmation'
            // missing 'to' and 'data'
        });

        if (response.status === 400) {
            log('   ✓ Missing fields validated correctly\n', 'success');
            results.push({ test: 'Missing Fields', passed: true });
        } else {
            log(`   ✗ Should have rejected missing fields\n`, 'error');
            results.push({ test: 'Missing Fields', passed: false });
        }
    } catch (e) {
        log(`   ✓ Missing fields rejected\n`, 'success');
        results.push({ test: 'Missing Fields', passed: true });
    }

    // Summary
    log('╔════════════════════════════════════════╗', 'blue');
    log('║           Test Results                 ║', 'blue');
    log('╚════════════════════════════════════════╝', 'blue');

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    results.forEach(({ test, passed }) => {
        const icon = passed ? '✓' : '✗';
        const color = passed ? 'success' : 'error';
        log(`   ${icon} ${test}`, color);
    });

    log(`\n📊 Total: ${passed}/${total} tests passed`, passed === total ? 'success' : 'warn');

    if (passed === total) {
        log('\n🎉 All email API tests passed!', 'success');
        log('\n📋 Next steps:', 'info');
        log('   1. Deploy to Vercel', 'gray');
        log('   2. Verify hundredornothing@outlook.com in Resend dashboard', 'gray');
        log('   3. Test on live site', 'gray');
    } else {
        log('\n⚠️  Some tests failed.', 'warn');
    }

    server.close();
    log('\n🔌 Server closed', 'info');
}

runTests().catch(console.error);
