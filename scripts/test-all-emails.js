#!/usr/bin/env node
/**
 * Complete Email Test Suite
 * Combines API tests and visual integration tests
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, type = 'info') {
    const color =
        type === 'success'
            ? colors.green
            : type === 'error'
              ? colors.red
              : type === 'warn'
                ? colors.yellow
                : type === 'cyan'
                  ? colors.cyan
                  : colors.blue;
    console.log(`${color}${message}${colors.reset}`);
}

function runTest(name, command) {
    log(`\n${'='.repeat(50)}`, 'cyan');
    log(`Running: ${name}`, 'cyan');
    log('='.repeat(50), 'cyan');

    try {
        execSync(command, {
            stdio: 'inherit',
            cwd: path.dirname(__dirname)
        });
        return true;
    } catch (e) {
        // Test failed but we continue
        return false;
    }
}

log('╔══════════════════════════════════════════════════╗', 'blue');
log('║         1 HUNDRED Complete Email Test Suite      ║', 'blue');
log('╚══════════════════════════════════════════════════╝', 'blue');

const results = {
    api: runTest('API Endpoint Tests', 'node scripts/test-email-simple.js'),
    visual: runTest('Visual Integration Tests', 'node scripts/test-email-visual.js')
};

log('\n' + '='.repeat(50), 'cyan');
log('FINAL SUMMARY', 'cyan');
log('='.repeat(50), 'cyan');

Object.entries(results).forEach(([name, passed]) => {
    const icon = passed ? '✓' : '✗';
    const color = passed ? 'success' : 'error';
    log(`${icon} ${name}: ${passed ? 'PASSED' : 'FAILED'}`, color);
});

const allPassed = Object.values(results).every((r) => r);

if (allPassed) {
    log('\n🎉 All email tests passed!', 'success');
    log('\n📧 Email automation is ready to deploy!', 'success');
    log('\nNext steps:', 'info');
    log('   1. Deploy to Vercel: git push', 'gray');
    log('   2. Verify sender email in Resend dashboard', 'gray');
    log('   3. Test on live site', 'gray');
} else {
    log('\n⚠️  Some tests failed. Review the output above.', 'warn');
    process.exit(1);
}
