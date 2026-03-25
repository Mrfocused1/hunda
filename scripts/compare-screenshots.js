#!/usr/bin/env node
/**
 * Visual Regression Testing
 *
 * Compares screenshots between two folders to detect visual changes.
 *
 * Usage:
 *   npm run test:compare -- ./screenshots/baseline ./screenshots/current
 */

const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

const args = process.argv.slice(2);
const baselineDir = args[0] || './screenshots/baseline';
const currentDir = args[1] || './screenshots/current';
const diffDir = path.join(currentDir, 'diffs');

const THRESHOLD = 0.1; // 0.1% pixel difference threshold

function loadImage(filePath) {
    return PNG.sync.read(fs.readFileSync(filePath));
}

function compareImages(baselinePath, currentPath, diffPath) {
    const baseline = loadImage(baselinePath);
    const current = loadImage(currentPath);

    if (baseline.width !== current.width || baseline.height !== current.height) {
        return {
            match: false,
            diffPercentage: 100,
            message: `Size mismatch: ${baseline.width}x${baseline.height} vs ${current.width}x${current.height}`
        };
    }

    const diff = new PNG({ width: baseline.width, height: baseline.height });
    const diffPixels = pixelmatch(baseline.data, current.data, diff.data, baseline.width, baseline.height, {
        threshold: 0.1
    });

    const totalPixels = baseline.width * baseline.height;
    const diffPercentage = (diffPixels / totalPixels) * 100;

    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    return {
        match: diffPercentage <= THRESHOLD,
        diffPercentage,
        diffPixels
    };
}

async function runComparison() {
    console.log('\n🔍 Visual Regression Testing\n');
    console.log(`Baseline: ${baselineDir}`);
    console.log(`Current:  ${currentDir}\n`);

    if (!fs.existsSync(baselineDir)) {
        console.error(`❌ Baseline directory not found: ${baselineDir}`);
        process.exit(1);
    }

    if (!fs.existsSync(currentDir)) {
        console.error(`❌ Current directory not found: ${currentDir}`);
        process.exit(1);
    }

    fs.mkdirSync(diffDir, { recursive: true });

    const baselineFiles = fs.readdirSync(baselineDir).filter((f) => f.endsWith('.png'));
    const currentFiles = fs.readdirSync(currentDir).filter((f) => f.endsWith('.png'));

    const results = [];

    for (const file of baselineFiles) {
        const baselinePath = path.join(baselineDir, file);
        const currentPath = path.join(currentDir, file);
        const diffPath = path.join(diffDir, file);

        if (!fs.existsSync(currentPath)) {
            results.push({ file, status: 'missing', message: 'File not found in current' });
            continue;
        }

        try {
            const result = compareImages(baselinePath, currentPath, diffPath);
            results.push({ file, status: result.match ? 'pass' : 'fail', ...result });
        } catch (err) {
            results.push({ file, status: 'error', message: err.message });
        }
    }

    // Check for new files in current
    for (const file of currentFiles) {
        if (!baselineFiles.includes(file)) {
            results.push({ file, status: 'new', message: 'New file in current' });
        }
    }

    // Print results
    const pass = results.filter((r) => r.status === 'pass');
    const fail = results.filter((r) => r.status === 'fail');
    const missing = results.filter((r) => r.status === 'missing');
    const errors = results.filter((r) => r.status === 'error');
    const newFiles = results.filter((r) => r.status === 'new');

    console.log(
        `Results: ${pass.length} passed, ${fail.length} failed, ${missing.length} missing, ${errors.length} errors, ${newFiles.length} new\n`
    );

    if (fail.length > 0) {
        console.log('❌ Differences detected:');
        fail.forEach((r) => {
            console.log(`  - ${r.file}: ${r.diffPercentage.toFixed(2)}% (${r.diffPixels} pixels)`);
        });
        console.log('');
    }

    if (missing.length > 0) {
        console.log('⚠️  Missing files:');
        missing.forEach((r) => console.log(`  - ${r.file}`));
        console.log('');
    }

    // Generate report
    const reportPath = path.join(diffDir, 'report.html');
    const html = generateReport(results);
    fs.writeFileSync(reportPath, html);
    console.log(`📄 Report: ${reportPath}\n`);

    process.exit(fail.length > 0 ? 1 : 0);
}

function generateReport(results) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Visual Regression Report</title>
  <style>
    body { font-family: system-ui; padding: 2rem; }
    .pass { color: green; }
    .fail { color: red; }
    .missing { color: orange; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Visual Regression Report</h1>
  <table>
    <tr><th>File</th><th>Status</th><th>Diff %</th><th>Details</th></tr>
    ${results
        .map(
            (r) => `
      <tr>
        <td>${r.file}</td>
        <td class="${r.status}">${r.status.toUpperCase()}</td>
        <td>${r.diffPercentage ? r.diffPercentage.toFixed(2) + '%' : '-'}</td>
        <td>${r.message || ''}</td>
      </tr>
    `
        )
        .join('')}
  </table>
</body>
</html>`;
}

runComparison().catch(console.error);
