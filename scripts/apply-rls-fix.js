const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function applyRLSFix() {
    console.log('🔧 Applying RLS Fix via Browser Automation\n');
    console.log('Step 1: Starting local server...');

    // Start local server
    const server = spawn('python3', ['-m', 'http.server', '3000'], {
        cwd: '/Users/paulbridges/Desktop/1hundred/hunda',
        detached: true,
        stdio: 'ignore'
    });

    await sleep(2000);
    console.log('✓ Server ready at http://localhost:3000\n');

    console.log('Step 2: Opening browser...');
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--window-size=900,800']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 900, height: 800 });

        // Capture all page logs
        page.on('console', (msg) => console.log('  📝', msg.text()));
        page.on('pageerror', (err) => console.log('  ⚠️ Page error:', err.message));

        console.log('Step 3: Navigating to fix page...');
        await page.goto('http://localhost:3000/admin-fix-rls.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await sleep(1500);

        // Check initial status
        const initialStatus = await page.evaluate(() => {
            return document.getElementById('status')?.textContent || '';
        });
        console.log(`  Status: ${initialStatus}\n`);

        console.log('Step 4: Clicking "Apply RLS Fixes" button...');
        await page.click('#fixBtn');
        await sleep(500);

        // Wait for processing with detailed progress
        console.log('Step 5: Waiting for RLS fixes to apply...\n');
        let lastLogCount = 0;
        let stuckCount = 0;

        for (let i = 0; i < 45; i++) {
            await sleep(1000);

            // Get current status and logs
            const { status, statusClass, logs, logCount } = await page.evaluate(() => {
                const statusEl = document.getElementById('status');
                const logEl = document.getElementById('log');
                return {
                    status: statusEl?.textContent || '',
                    statusClass: statusEl?.className || '',
                    logs: logEl?.innerText || '',
                    logCount: logEl?.children?.length || 0
                };
            });

            // Print new logs
            if (logCount > lastLogCount) {
                const allLogs = logs.split('\n').filter((l) => l.trim());
                const newLogs = allLogs.slice(lastLogCount);
                newLogs.forEach((log) => console.log('  📋', log));
                lastLogCount = logCount;
                stuckCount = 0;
            } else {
                stuckCount++;
            }

            // Check for completion
            if (statusClass.includes('success')) {
                console.log('\n✅ SUCCESS:', status);
                console.log('\nThe RLS policies have been updated!');
                console.log('You can now test the admin panel image upload.');
                await sleep(3000);
                return;
            }

            if (statusClass.includes('error')) {
                console.log('\n❌ ERROR:', status);
                break;
            }

            // Timeout if stuck
            if (stuckCount > 10) {
                console.log('\n⚠️ Process seems stuck. Checking final status...');
                break;
            }
        }

        // Get final status
        const finalStatus = await page.evaluate(() => {
            const statusEl = document.getElementById('status');
            const logEl = document.getElementById('log');
            return {
                text: statusEl?.textContent || 'Unknown',
                class: statusEl?.className || '',
                logs: logEl?.innerText || ''
            };
        });

        console.log('\n--- Final Status ---');
        console.log('Status:', finalStatus.text);
        if (finalStatus.logs) {
            console.log('\n--- Full Log ---');
            console.log(finalStatus.logs);
        }

        if (!finalStatus.class.includes('success')) {
            console.log('\n⚠️ The automatic fix may not have worked.');
            console.log('Please check the browser window or use the manual SQL method.');
        }

        await sleep(5000);
    } catch (err) {
        console.error('\n❌ Script error:', err.message);
    } finally {
        await browser.close();

        // Clean up server
        try {
            process.kill(-server.pid);
            console.log('\n✓ Server stopped');
        } catch (e) {}
    }
}

applyRLSFix().catch(console.error);
