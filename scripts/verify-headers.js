#!/usr/bin/env node
/**
 * Header Consistency Verification
 *
 * Checks all HTML files for consistent header structure
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
    'index.html',
    'shop.html',
    'product.html',
    'cart.html',
    'checkout.html',
    'wishlist.html',
    'account.html',
    'about.html'
];

const CHECKS = {
    desktopNav: /Shop All.*New In.*About Us/s,
    mobileNav: /mobile-nav-link.*About Us/s,
    mobileMenuHeader: /mobile-menu-header/,
    cartTrigger: /id="cart-trigger"/,
    cartTriggerMobile: /id="cart-trigger-mobile"/,
    cartDrawer: /id="cart-drawer"/,
    menuToggle: /id="menu-toggle"/,
    loginLink: /href="\/login"/,
    authScript: /auth\.js/
};

function checkFile(filename) {
    const content = fs.readFileSync(filename, 'utf-8');
    const results = {};

    for (const [name, pattern] of Object.entries(CHECKS)) {
        results[name] = pattern.test(content);
    }

    return results;
}

function runVerification() {
    console.log('\n🔍 Header Consistency Check\n');

    let allPassed = true;
    const issues = [];

    for (const page of PAGES) {
        const filepath = path.join(process.cwd(), page);

        if (!fs.existsSync(filepath)) {
            console.log(`❌ ${page} - FILE NOT FOUND`);
            allPassed = false;
            continue;
        }

        const results = checkFile(filepath);
        const passed = Object.values(results).every((v) => v);

        if (passed) {
            console.log(`✅ ${page}`);
        } else {
            console.log(`❌ ${page}`);
            allPassed = false;

            for (const [check, passed] of Object.entries(results)) {
                if (!passed) {
                    issues.push(`${page}: Missing ${check}`);
                    console.log(`   - Missing: ${check}`);
                }
            }
        }
    }

    console.log('\n' + (allPassed ? '✅ All checks passed!' : '❌ Some checks failed'));

    if (issues.length > 0) {
        console.log('\nIssues found:');
        issues.forEach((issue) => console.log(`  - ${issue}`));
    }

    process.exit(allPassed ? 0 : 1);
}

runVerification();
