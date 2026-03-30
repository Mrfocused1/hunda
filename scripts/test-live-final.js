const puppeteer = require('puppeteer');

const BASE = 'https://www.1hundredornothing.co.uk';
const TIMEOUT = 30000;

let passed = 0;
let failed = 0;

function log(status, test, detail) {
    const tag = status === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`[${tag}] ${test}: ${detail}`);
    if (status === 'PASS') passed++;
    else failed++;
}

async function goto(page, path) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
}

/**
 * Analyse all .product-card elements on the current page.
 * Returns an array of objects, one per card, with:
 *   title, isHoodie, hasComingSoonText, hasComingSoonBadge,
 *   pointerEventsNone (inline style), hasLink
 */
async function getProductCards(page) {
    return page.evaluate(() => {
        const cards = document.querySelectorAll('.product-card');
        return Array.from(cards).map((card) => {
            const titleEl = card.querySelector('h3, h4, .product-name, .card-title');
            const title = titleEl ? titleEl.textContent.trim() : '';
            const isHoodie = /hoodie/i.test(title);
            const hasComingSoonText = /coming\s*soon/i.test(card.textContent);
            const hasComingSoonBadge = !!card.querySelector('.coming-soon-badge, [class*="coming-soon"]');
            const pointerEventsNone = card.style.pointerEvents === 'none';
            const link = card.querySelector('a[href]');
            const hasLink = !!link;
            return { title, isHoodie, hasComingSoonText, hasComingSoonBadge, pointerEventsNone, hasLink };
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Collect JS errors across the whole session
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push({ url: page.url(), msg: err.message }));

    // ─────────────────────────────────────────────
    // 1. Homepage
    // ─────────────────────────────────────────────
    try {
        await goto(page, '/');
        log('PASS', 'Homepage load', 'Page loaded successfully');
    } catch (e) {
        log('FAIL', 'Homepage load', e.message);
    }

    // Nav
    try {
        const navLinks = await page.$$eval('nav a, header a', (els) =>
            els.map((a) => a.textContent.trim()).filter((t) => t.length > 0)
        );
        const hasShop = navLinks.some((l) => /shop/i.test(l));
        if (hasShop) {
            log('PASS', 'Homepage nav', `Found nav links including Shop`);
        } else {
            log('FAIL', 'Homepage nav', `No "Shop" link found. Links: ${navLinks.join(', ')}`);
        }
    } catch (e) {
        log('FAIL', 'Homepage nav', e.message);
    }

    // Hoodies on homepage: Coming Soon + not clickable
    try {
        const cards = await getProductCards(page);
        const hoodies = cards.filter((c) => c.isHoodie);

        if (hoodies.length === 0) {
            log('FAIL', 'Homepage hoodie Coming Soon', 'No hoodie cards found on homepage');
        } else {
            let allOk = true;
            for (const h of hoodies) {
                if (!h.hasComingSoonText && !h.hasComingSoonBadge) {
                    log('FAIL', `Homepage hoodie "${h.title}"`, 'No Coming Soon text or badge');
                    allOk = false;
                }
                if (!h.pointerEventsNone && h.hasLink) {
                    log(
                        'FAIL',
                        `Homepage hoodie "${h.title}"`,
                        'Card is clickable (has link and no pointer-events:none)'
                    );
                    allOk = false;
                }
            }
            if (allOk) {
                log(
                    'PASS',
                    'Homepage hoodie Coming Soon',
                    `${hoodies.length} hoodie(s) show Coming Soon and are not clickable`
                );
            }
        }
    } catch (e) {
        log('FAIL', 'Homepage hoodie Coming Soon', e.message);
    }

    // ─────────────────────────────────────────────
    // 2. Shop page
    // ─────────────────────────────────────────────
    try {
        await goto(page, '/shop');
        log('PASS', 'Shop page load', 'Page loaded successfully');
    } catch (e) {
        log('FAIL', 'Shop page load', e.message);
    }

    // Shop hoodie cards
    try {
        await page.waitForSelector('.product-card', { timeout: 10000 });
        const cards = await getProductCards(page);
        const hoodies = cards.filter((c) => c.isHoodie);

        if (hoodies.length === 0) {
            log('FAIL', 'Shop hoodie Coming Soon', 'No hoodie cards found on shop page');
        } else {
            let allOk = true;
            for (const h of hoodies) {
                if (!h.hasComingSoonText && !h.hasComingSoonBadge) {
                    log('FAIL', `Shop hoodie "${h.title}"`, 'No Coming Soon text or badge');
                    allOk = false;
                }
                if (!h.pointerEventsNone && h.hasLink) {
                    log('FAIL', `Shop hoodie "${h.title}"`, 'Card is clickable (has link and no pointer-events:none)');
                    allOk = false;
                }
            }
            if (allOk) {
                log(
                    'PASS',
                    'Shop hoodie Coming Soon',
                    `${hoodies.length} hoodie(s) show Coming Soon and are not clickable`
                );
            }
        }
    } catch (e) {
        log('FAIL', 'Shop hoodie Coming Soon', e.message);
    }

    // Shop filter labels: T-Shirts not Tops
    try {
        const filterInfo = await page.evaluate(() => {
            const els = document.querySelectorAll(
                'button, label, .filter-btn, [class*="filter"], [data-category], select option, .category-item'
            );
            const texts = Array.from(els)
                .map((el) => el.textContent.trim())
                .filter((t) => t.length > 0 && t.length < 50);
            return {
                hasTops: texts.some((t) => /^tops$/i.test(t)),
                hasTShirts: texts.some((t) => /t-shirt/i.test(t)),
                relevant: texts.filter((t) => /top|shirt/i.test(t))
            };
        });
        if (filterInfo.hasTops) {
            log('FAIL', 'Shop filter labels', `Found "Tops" in filters (should be "T-Shirts")`);
        } else if (filterInfo.hasTShirts) {
            log('PASS', 'Shop filter labels', 'Filter shows "T-Shirts" (not "Tops")');
        } else {
            log(
                'FAIL',
                'Shop filter labels',
                `Neither "T-Shirts" nor "Tops" found. Related: ${filterInfo.relevant.join(', ')}`
            );
        }
    } catch (e) {
        log('FAIL', 'Shop filter labels', e.message);
    }

    // ─────────────────────────────────────────────
    // 3. Shop hoodies filter
    // ─────────────────────────────────────────────
    try {
        await goto(page, '/shop?category=hoodies');
        await page.waitForSelector('.product-card', { timeout: 10000 });

        const cards = await getProductCards(page);
        const hoodies = cards.filter((c) => c.isHoodie);
        const withCS = hoodies.filter((c) => c.hasComingSoonText || c.hasComingSoonBadge);

        if (hoodies.length === 0) {
            log('FAIL', 'Shop hoodies filter', 'No hoodie cards found with hoodies filter active');
        } else if (withCS.length === hoodies.length) {
            log('PASS', 'Shop hoodies filter', `All ${hoodies.length} hoodie(s) show Coming Soon`);
        } else {
            const missing = hoodies.filter((c) => !c.hasComingSoonText && !c.hasComingSoonBadge).map((c) => c.title);
            log(
                'FAIL',
                'Shop hoodies filter',
                `${withCS.length}/${hoodies.length} show Coming Soon. Missing: ${missing.join(', ')}`
            );
        }
    } catch (e) {
        log('FAIL', 'Shop hoodies filter', e.message);
    }

    // ─────────────────────────────────────────────
    // 4. Hat product page
    // ─────────────────────────────────────────────
    try {
        await goto(page, '/1h-star-cap');
        log('PASS', 'Hat product page load', 'Page loaded successfully');
    } catch (e) {
        log('FAIL', 'Hat product page load', e.message);
    }

    // Breadcrumbs inline
    try {
        const bcInfo = await page.evaluate(() => {
            const bc = document.querySelector(
                '.breadcrumb, .breadcrumbs, [class*="breadcrumb"], nav[aria-label="breadcrumb"]'
            );
            if (!bc) return { found: false };
            const items = bc.querySelectorAll('a, span, li');
            const rects = Array.from(items).map((el) => {
                const r = el.getBoundingClientRect();
                return { top: Math.round(r.top), text: el.textContent.trim() };
            });
            const tops = rects.map((r) => r.top);
            const allSameRow = tops.length > 1 && tops.every((t) => Math.abs(t - tops[0]) < 10);
            return { found: true, allSameRow, items: rects.map((r) => r.text), tops };
        });

        if (!bcInfo.found) {
            log('FAIL', 'Hat breadcrumbs', 'No breadcrumb element found');
        } else if (bcInfo.allSameRow) {
            log('PASS', 'Hat breadcrumbs inline', `Breadcrumbs display inline: ${bcInfo.items.join(' > ')}`);
        } else {
            log(
                'FAIL',
                'Hat breadcrumbs inline',
                `Breadcrumbs appear stacked. Items: ${bcInfo.items.join(' > ')} (tops: ${bcInfo.tops.join(',')})`
            );
        }
    } catch (e) {
        log('FAIL', 'Hat breadcrumbs', e.message);
    }

    // Delivery text
    try {
        const hasDelivery = await page.evaluate(() => /2[- ]?3\s*day\s*delivery/i.test(document.body.textContent));
        if (hasDelivery) {
            log('PASS', 'Hat delivery text', 'Found "2-3 day delivery" text');
        } else {
            log('FAIL', 'Hat delivery text', '"2-3 day delivery" text not found');
        }
    } catch (e) {
        log('FAIL', 'Hat delivery text', e.message);
    }

    // ─────────────────────────────────────────────
    // 5. Hoodie product page
    // ─────────────────────────────────────────────
    try {
        await goto(page, '/no-half-measures-hoodie');
        log('PASS', 'Hoodie product page load', 'Page loaded successfully');
    } catch (e) {
        log('FAIL', 'Hoodie product page load', e.message);
    }

    // Coming Soon button instead of Add to Bag
    try {
        const btnInfo = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, .btn, [class*="btn"], a.button');
            const texts = Array.from(buttons).map((b) => b.textContent.trim());
            return {
                hasComingSoon: texts.some((t) => /coming\s*soon/i.test(t)),
                hasAddToBag: texts.some((t) => /add\s*to\s*(bag|cart|basket)/i.test(t)),
                buttons: texts.filter((t) => t.length > 0 && t.length < 40)
            };
        });

        if (btnInfo.hasComingSoon && !btnInfo.hasAddToBag) {
            log('PASS', 'Hoodie Coming Soon button', 'Has "Coming Soon" button, no "Add to Bag"');
        } else if (btnInfo.hasAddToBag) {
            log(
                'FAIL',
                'Hoodie Coming Soon button',
                `"Add to Bag" button still present. Buttons: ${btnInfo.buttons.join(', ')}`
            );
        } else {
            log(
                'FAIL',
                'Hoodie Coming Soon button',
                `No "Coming Soon" button found. Buttons: ${btnInfo.buttons.join(', ')}`
            );
        }
    } catch (e) {
        log('FAIL', 'Hoodie Coming Soon button', e.message);
    }

    // ─────────────────────────────────────────────
    // 6. Cart page
    // ─────────────────────────────────────────────
    try {
        const errsBefore = jsErrors.length;
        await goto(page, '/cart');
        // Give a moment for any deferred JS errors
        await new Promise((r) => setTimeout(r, 1500));
        const newErrs = jsErrors.slice(errsBefore);
        if (newErrs.length > 0) {
            log('FAIL', 'Cart page errors', `JS errors: ${newErrs.map((e) => e.msg).join('; ')}`);
        } else {
            log('PASS', 'Cart page load', 'Cart page loaded without JS errors');
        }
    } catch (e) {
        log('FAIL', 'Cart page load', e.message);
    }

    // ─────────────────────────────────────────────
    // 7. Global: no "Tops" label on any page
    // ─────────────────────────────────────────────
    try {
        const pagesToCheck = ['/', '/shop'];
        let foundTops = false;
        let foundOn = '';

        for (const p of pagesToCheck) {
            await goto(page, p);
            const hasTops = await page.evaluate(() => {
                const els = document.querySelectorAll(
                    'button, label, .filter-btn, [class*="filter"], [data-category], select option, .category-item, a[href*="category"]'
                );
                return Array.from(els).some((el) => /^tops$/i.test(el.textContent.trim()));
            });
            if (hasTops) {
                foundTops = true;
                foundOn = p;
                break;
            }
        }

        if (foundTops) {
            log('FAIL', 'No "Tops" label anywhere', `Found "Tops" filter label on ${foundOn} (should be "T-Shirts")`);
        } else {
            log('PASS', 'No "Tops" label anywhere', 'No pages have "Tops" as a filter label');
        }
    } catch (e) {
        log('FAIL', 'No "Tops" label check', e.message);
    }

    await browser.close();

    console.log('\n' + '='.repeat(60));
    console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('='.repeat(60));

    process.exit(failed > 0 ? 1 : 0);
})();
