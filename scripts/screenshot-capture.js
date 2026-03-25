#!/usr/bin/env node
/**
 * Screenshot Capture Tool
 *
 * This script helps capture screenshots and save them directly to the project folder
 * so Claude can access them.
 *
 * Usage:
 *   npm run screenshot         # Capture and save to screenshots/ folder
 *   npm run screenshot:view    # List recent screenshots with paths
 *
 * The screenshot will be saved to: ./screenshots/user/YYYY-MM-DD_HH-MM-SS.png
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots', 'user');

// Ensure screenshots directory exists
function ensureDir() {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
}

// Get timestamp for filename
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Platform-specific screenshot capture
function captureScreenshot() {
    ensureDir();

    const timestamp = getTimestamp();
    const filename = `screenshot_${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    const platform = process.platform;
    let command;

    if (platform === 'darwin') {
        // macOS - use screencapture
        command = `screencapture -i "${filepath}"`;
    } else if (platform === 'linux') {
        // Linux - try gnome-screenshot or import (ImageMagick)
        command = `gnome-screenshot -a -f "${filepath}" 2>/dev/null || import "${filepath}"`;
    } else if (platform === 'win32') {
        // Windows - use PowerShell
        console.log('Windows: Please manually save screenshot to:', filepath);
        console.log('Tip: Use Win+Shift+S, then paste into Paint and save to the path above.');
        return;
    }

    console.log('\n📸 Screenshot Capture');
    console.log('=====================\n');
    console.log('Instructions:');
    console.log('1. After pressing Enter, select the area you want to capture');
    console.log('2. The screenshot will be saved automatically\n');
    console.log(`Save location: screenshots/user/${filename}\n`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Press Enter to start capture (or Ctrl+C to cancel)...', () => {
        rl.close();

        console.log('\n🎯 Select area to capture...');

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('\n❌ Error capturing screenshot:', error.message);
                console.log('\nAlternative: Manually save your screenshot to:');
                console.log(`  ${filepath}`);
                return;
            }

            if (fs.existsSync(filepath)) {
                console.log('\n✅ Screenshot saved successfully!');
                console.log(`\n📁 File: screenshots/user/${filename}`);
                console.log('\n💡 You can now tell Claude:');
                console.log(`   "Look at screenshots/user/${filename}"`);
                console.log("\n   Or simply paste the screenshot into chat now that it's in the project folder.\n");

                // Create a symlink or shortcut for easy access
                const latestPath = path.join(SCREENSHOTS_DIR, 'latest.png');
                try {
                    if (fs.existsSync(latestPath)) {
                        fs.unlinkSync(latestPath);
                    }
                    fs.copyFileSync(filepath, latestPath);
                    console.log('Also saved as: screenshots/user/latest.png (quick access)\n');
                } catch (e) {
                    // Ignore symlink errors
                }
            } else {
                console.log('\n⚠️  Screenshot may not have been saved.');
                console.log('Try manually saving to the screenshots/user/ folder.\n');
            }
        });
    });
}

// List recent screenshots
function listScreenshots() {
    ensureDir();

    const files = fs
        .readdirSync(SCREENSHOTS_DIR)
        .filter((f) => f.endsWith('.png') && f !== 'latest.png')
        .map((f) => {
            const stat = fs.statSync(path.join(SCREENSHOTS_DIR, f));
            return {
                name: f,
                path: `screenshots/user/${f}`,
                time: stat.mtime,
                size: (stat.size / 1024).toFixed(1) + ' KB'
            };
        })
        .sort((a, b) => b.time - a.time)
        .slice(0, 10);

    console.log('\n📁 Recent Screenshots');
    console.log('====================\n');

    if (files.length === 0) {
        console.log('No screenshots found.');
        console.log('Run: npm run screenshot\n');
        return;
    }

    files.forEach((file, i) => {
        const time = file.time.toLocaleString();
        console.log(`${i + 1}. ${file.name}`);
        console.log(`   Path: ${file.path}`);
        console.log(`   Size: ${file.size}`);
        console.log(`   Time: ${time}\n`);
    });

    console.log('💡 To reference in chat:');
    console.log('   "Check screenshots/user/latest.png"');
    console.log('   "Look at the screenshot in screenshots/user/"\n');
}

// Main
const command = process.argv[2];

if (command === 'list' || command === 'view') {
    listScreenshots();
} else {
    captureScreenshot();
}
