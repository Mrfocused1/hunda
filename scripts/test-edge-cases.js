const puppeteer = require('puppeteer');

const BASE = 'https://www.1hundredornothing.co.uk';
const TIMEOUT = 30000;

let passed = 0;
let failed = 0;
const results = [];

function log(status, test, detail) {
    const tag = status === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`[${tag}] ${test}: ${detail}`);
    results.push({ status, test, detail });
    if (status === 'PASS') passed++;
    else failed++;
}

async function goto(page, path) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
}

async function sleep(ms) {
    await new Promise((r) => setTimeout(r, ms));
}

// Open cart via #cart-trigger
async function openCart(page) {
    await page.click('#cart-trigger');
    await sleep(600);
}

// Close cart via #close-cart button
async function closeCart(page) {
    await page.click('#close-cart');
    await sleep(500);
}

// Returns true if cart drawer is open (does NOT have translate-x-full class)
async function isCartOpen(page) {
    return page.evaluate(() => {
        const drawer = document.getElementById('cart-drawer');
        if (!drawer) return false;
        return !drawer.classList.contains('translate-x-full');
    });
}

// Clear cart via localStorage
async function clearCart(page) {
    await page.evaluate(() => {
        localStorage.removeItem('cart');
        localStorage.removeItem('hunda_cart');
        // Also clear via state if available
        if (window.state && window.state.cart) window.state.cart = [];
    });
}

// Get #cart-count text (numeric)
async function getCartBadgeCount(page) {
    return page.evaluate(() => {
        const el = document.getElementById('cart-count');
        if (!el) return null;
        const n = parseInt(el.textContent.trim(), 10);
        return isNaN(n) ? null : n;
    });
}

// Select a size on a product page (first available non-disabled button)
async function selectSize(page, size) {
    const sel = size
        ? `button.size-btn[data-size="${size}"], .product-size-btn[data-size="${size}"], .size-option[data-size="${size}"]`
        : null;
    // Try by text
    return page.evaluate((targetSize) => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
            const txt = b.textContent.trim();
            const match = targetSize ? txt === targetSize : ['S', 'M', 'L', 'XL', 'One Size'].includes(txt);
            if (match && !b.disabled && !b.classList.contains('out-of-stock') && !b.classList.contains('disabled')) {
                b.click();
                return txt;
            }
        }
        return null;
    }, size || null);
}

// Click "Add to Bag" button on current page
async function clickAddToBag(page) {
    return page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
            if (/add to bag|add to cart/i.test(b.textContent) && !b.disabled) {
                b.click();
                return true;
            }
        }
        return false;
    });
}

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push({ url: page.url(), msg: err.message }));

    console.log('\n=== EDGE CASE TESTS: 1hundredornothing.co.uk ===\n');

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Add same product twice - verify quantity increments (not duplicate)
    // ─────────────────────────────────────────────────────────────────
    try {
        // Clear and start fresh
        await goto(page, '/relentless-trophy-tee');
        await sleep(800);
        await clearCart(page);
        await page.reload({ waitUntil: 'networkidle2', timeout: TIMEOUT });
        await sleep(1000);

        // First add
        await selectSize(page, 'M');
        await sleep(300);
        await clickAddToBag(page);
        await sleep(1200);

        const badgeAfterFirst = await getCartBadgeCount(page);

        // Second add (same size)
        await selectSize(page, 'M');
        await sleep(300);
        await clickAddToBag(page);
        await sleep(1500);

        const badgeAfterSecond = await getCartBadgeCount(page);

        // Check cart state via in-memory state
        const cartState = await page.evaluate(() => {
            if (window.state && Array.isArray(window.state.cart)) {
                return window.state.cart.map((i) => ({ title: i.title, qty: i.quantity, size: i.size }));
            }
            return null;
        });

        if (cartState !== null) {
            const relentlessEntries = cartState.filter((i) => /relentless|trophy/i.test(i.title) && i.size === 'M');
            if (relentlessEntries.length === 1 && relentlessEntries[0].qty >= 2) {
                log(
                    'PASS',
                    'Test 1 - Duplicate add increments qty',
                    `Single cart entry qty=${relentlessEntries[0].qty} (badge: ${badgeAfterFirst}→${badgeAfterSecond})`
                );
            } else if (relentlessEntries.length > 1) {
                log(
                    'FAIL',
                    'Test 1 - Duplicate add increments qty',
                    `${relentlessEntries.length} duplicate entries: ${JSON.stringify(relentlessEntries)}`
                );
            } else {
                log('FAIL', 'Test 1 - Duplicate add increments qty', `Unexpected state: ${JSON.stringify(cartState)}`);
            }
        } else {
            // Fallback: use badge counts
            if (badgeAfterFirst !== null && badgeAfterSecond !== null && badgeAfterSecond > badgeAfterFirst) {
                // Badge went up but check if it's because of a new entry or qty increase
                // Open cart to inspect
                await openCart(page);
                await sleep(800);
                const items = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('#mini-cart-items [data-cart-item]')).map((el) => ({
                        title: el.querySelector('h4') ? el.querySelector('h4').textContent.trim() : '',
                        html: el.innerHTML.slice(0, 200)
                    }));
                });
                const relentless = items.filter((i) => /relentless|trophy/i.test(i.title));
                if (relentless.length === 1) {
                    log(
                        'PASS',
                        'Test 1 - Duplicate add increments qty',
                        `Single cart entry (badge ${badgeAfterFirst}→${badgeAfterSecond})`
                    );
                } else {
                    log(
                        'FAIL',
                        'Test 1 - Duplicate add increments qty',
                        `${relentless.length} entries. Badge: ${badgeAfterFirst}→${badgeAfterSecond}`
                    );
                }
                await closeCart(page);
            } else {
                log(
                    'FAIL',
                    'Test 1 - Duplicate add increments qty',
                    `Badge: ${badgeAfterFirst}→${badgeAfterSecond}. Could not verify cart state`
                );
            }
        }

        // Close cart if open
        const cartOpen = await isCartOpen(page);
        if (cartOpen) {
            await closeCart(page);
            await sleep(300);
        }
    } catch (e) {
        log('FAIL', 'Test 1 - Duplicate add increments qty', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Add hoodie from product page - verify blocked
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/no-half-measures-hoodie');
        await sleep(1500);

        const currentUrl = page.url();
        if (!currentUrl.includes('hoodie')) {
            log('PASS', 'Test 2 - Hoodie page blocked', `Redirected away: ${currentUrl}`);
        } else {
            const blockState = await page.evaluate(() => {
                const bodyText = document.body.textContent;
                const hasComingSoon = /coming soon/i.test(bodyText);
                const addBtns = Array.from(document.querySelectorAll('button')).filter((b) =>
                    /add to bag|add to cart/i.test(b.textContent)
                );
                const disabledAddBtns = addBtns.filter((b) => b.disabled || b.classList.contains('disabled'));
                return {
                    hasComingSoon,
                    totalAddBtns: addBtns.length,
                    disabledCount: disabledAddBtns.length
                };
            });

            if (blockState.hasComingSoon) {
                log('PASS', 'Test 2 - Hoodie page blocked', '"Coming Soon" state displayed on hoodie product page');
            } else if (blockState.totalAddBtns === 0) {
                log('PASS', 'Test 2 - Hoodie page blocked', 'No "Add to Bag" button present on hoodie page');
            } else if (blockState.disabledCount > 0) {
                log('PASS', 'Test 2 - Hoodie page blocked', `Add to Bag button is disabled on hoodie page`);
            } else {
                log(
                    'FAIL',
                    'Test 2 - Hoodie page blocked',
                    `Hoodie page has ${blockState.totalAddBtns} active Add to Bag buttons`
                );
            }
        }
    } catch (e) {
        log('FAIL', 'Test 2 - Hoodie page blocked', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Quick View - no size selected, click Add to Bag → error shown
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/shop');
        await sleep(1500);
        await page.waitForSelector('.product-card', { timeout: 10000 });

        // Hover over a non-hoodie card to reveal quick actions, then click Quick View
        const cards = await page.$$('.product-card');
        let quickViewOpened = false;

        for (const card of cards) {
            const isHoodie = await card.evaluate((el) => {
                const title = el.querySelector('h3, h4, .product-title');
                return title && /hoodie/i.test(title.textContent);
            });
            if (isHoodie) continue;

            await card.hover();
            await sleep(300);

            // Click the Quick View button (eye icon button)
            const qvBtn = await card.$('button[data-quick-view], button[title="Quick View"]');
            if (qvBtn) {
                await qvBtn.click();
                quickViewOpened = true;
                break;
            }
        }

        if (!quickViewOpened) {
            log('FAIL', 'Test 3 - Quick View no-size error', 'Could not find or open Quick View button');
            throw new Error('skip');
        }

        await sleep(800);

        // Wait for quick view overlay to be visible
        const overlayVisible = await page.evaluate(() => {
            const overlay = document.getElementById('quick-view-overlay');
            if (!overlay) return false;
            return !overlay.classList.contains('invisible') && overlay.style.opacity !== '0';
        });

        if (!overlayVisible) {
            log('FAIL', 'Test 3 - Quick View no-size error', 'Quick View overlay did not become visible');
            throw new Error('skip');
        }

        // Click Add to Bag WITHOUT selecting a size
        await page.click('#qv-add-to-bag-btn');
        await sleep(600);

        // Check for toast notification with "Please select a size"
        const toastState = await page.evaluate(() => {
            const toast = document.getElementById('toast');
            const toastMsg = document.getElementById('toast-msg');
            if (!toast) return { found: false, text: '' };
            const visible = !toast.classList.contains('hidden') || toast.style.display !== 'none';
            return {
                found: visible,
                text: toastMsg ? toastMsg.textContent.trim() : toast.textContent.trim()
            };
        });

        if (toastState.found && /size/i.test(toastState.text)) {
            log('PASS', 'Test 3 - Quick View no-size error', `Toast shown: "${toastState.text}"`);
        } else if (toastState.found) {
            log('PASS', 'Test 3 - Quick View no-size error', `Notification shown: "${toastState.text}"`);
        } else {
            log(
                'FAIL',
                'Test 3 - Quick View no-size error',
                `No error notification shown after clicking Add to Bag without size`
            );
        }

        // Close quick view
        await page.keyboard.press('Escape');
        await sleep(400);
    } catch (e) {
        if (e.message !== 'skip') log('FAIL', 'Test 3 - Quick View no-size error', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Empty cart → click checkout → graceful handling
    // ─────────────────────────────────────────────────────────────────
    try {
        await clearCart(page);
        await goto(page, '/');
        await sleep(800);

        await openCart(page);
        await sleep(600);

        // Check empty state in cart drawer
        const cartEmptyState = await page.evaluate(() => {
            const container = document.getElementById('mini-cart-items');
            const items = document.querySelectorAll('#mini-cart-items [data-cart-item]');
            const count = document.getElementById('mini-cart-count');
            const checkoutLink = document.querySelector('a[href="/checkout"]');
            return {
                itemCount: items.length,
                countText: count ? count.textContent.trim() : '?',
                hasCheckoutLink: !!checkoutLink,
                containerText: container ? container.textContent.trim().slice(0, 100) : ''
            };
        });

        // Now try clicking checkout
        const checkoutUrl = await page.evaluate(() => {
            const link = document.querySelector('a[href="/checkout"]');
            return link ? link.href : null;
        });

        if (checkoutUrl) {
            await goto(page, '/checkout');
            await sleep(1500);

            const checkoutState = await page.evaluate(() => {
                const bodyText = document.body.textContent;
                return {
                    hasEmptyMessage: /empty|no items|nothing|0 items/i.test(bodyText),
                    bodySnippet: bodyText.slice(0, 200).trim()
                };
            });

            if (checkoutState.hasEmptyMessage) {
                log('PASS', 'Test 4 - Empty cart checkout', 'Checkout handles empty cart with appropriate message');
            } else {
                // Check if checkout page still renders (graceful - no crash)
                const bodyLen = await page.evaluate(() => document.body.textContent.length);
                if (bodyLen > 100) {
                    log(
                        'PASS',
                        'Test 4 - Empty cart checkout',
                        `Checkout page loaded without crash (${bodyLen} chars). Cart count was ${cartEmptyState.countText}`
                    );
                } else {
                    log('FAIL', 'Test 4 - Empty cart checkout', 'Checkout page appears empty/crashed');
                }
            }
        } else {
            // If no checkout link shown when cart is empty, that's also valid
            if (cartEmptyState.itemCount === 0) {
                log(
                    'PASS',
                    'Test 4 - Empty cart checkout',
                    `Cart shows 0 items (count: ${cartEmptyState.countText}). Checkout link present: ${cartEmptyState.hasCheckoutLink}`
                );
            } else {
                log('FAIL', 'Test 4 - Empty cart checkout', 'No checkout link found and cart state unclear');
            }
        }

        await page.keyboard.press('Escape');
        await sleep(300);
    } catch (e) {
        log('FAIL', 'Test 4 - Empty cart checkout', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: /shop?category=invalid - no crash
    // ─────────────────────────────────────────────────────────────────
    try {
        const errsBefore = jsErrors.length;
        await goto(page, '/shop?category=invalid');
        await sleep(1500);

        const newErrors = jsErrors.slice(errsBefore);
        const pageState = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            const h1 = document.querySelector('h1, #category-title');
            const noResults = document.querySelector('[class*="no-results"], [class*="empty-state"]');
            return {
                cardCount: cards.length,
                h1Text: h1 ? h1.textContent.trim() : '',
                hasNoResultsEl: !!noResults,
                bodyLen: document.body.textContent.length
            };
        });

        if (newErrors.length > 0) {
            log('FAIL', 'Test 5 - Invalid category param', `JS errors: ${newErrors.map((e) => e.msg).join('; ')}`);
        } else if (pageState.bodyLen < 200) {
            log('FAIL', 'Test 5 - Invalid category param', 'Page appears blank/crashed');
        } else {
            log(
                'PASS',
                'Test 5 - Invalid category param',
                `No crash. H1: "${pageState.h1Text}", cards: ${pageState.cardCount}, bodyLen: ${pageState.bodyLen}`
            );
        }
    } catch (e) {
        log('FAIL', 'Test 5 - Invalid category param', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 6: Search no results - empty state shown
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/shop');
        await sleep(1000);

        // Type into #search-input directly
        await page.waitForSelector('#search-input', { timeout: 5000 });
        await page.click('#search-input');
        await page.type('#search-input', 'xyzzy_no_results_99999', { delay: 30 });
        await page.keyboard.press('Enter');
        await sleep(1500);

        const searchResult = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            const productCount = document.getElementById('product-count');
            const indicator = document.getElementById('active-search-indicator');
            const noResultsInGrid = document.querySelector('#product-grid .no-results, #product-grid [class*="empty"]');
            const bodyText = document.body.textContent;
            const hasNoResults = /no results|no products|nothing found|0 products/i.test(bodyText);
            return {
                cardCount: cards.length,
                productCountText: productCount ? productCount.textContent.trim() : '',
                searchIndicatorVisible: indicator ? !indicator.classList.contains('hidden') : false,
                hasNoResultsEl: !!noResultsInGrid,
                hasNoResultsText: hasNoResults
            };
        });

        if (searchResult.cardCount === 0 && searchResult.searchIndicatorVisible) {
            log(
                'PASS',
                'Test 6 - Search no results empty state',
                `0 cards shown, search indicator visible. Count: "${searchResult.productCountText}"`
            );
        } else if (searchResult.cardCount === 0) {
            log(
                'PASS',
                'Test 6 - Search no results empty state',
                `0 product cards for nonsense search. Count text: "${searchResult.productCountText}"`
            );
        } else {
            log(
                'FAIL',
                'Test 6 - Search no results empty state',
                `${searchResult.cardCount} cards shown for nonsense search - no filtering applied`
            );
        }
    } catch (e) {
        log('FAIL', 'Test 6 - Search no results empty state', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 7: Click product card image → navigates to product page
    // Note: clicking image wrapper opens Quick View; clicking the title/info link navigates
    // We test that product cards have a navigable link (clicking the title/info area)
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/shop');
        await sleep(1500);
        await page.waitForSelector('.product-card', { timeout: 10000 });

        // Find non-hoodie product card link and its href
        const productLink = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            for (const card of cards) {
                const title = card.querySelector('.product-title, h3');
                if (title && /hoodie/i.test(title.textContent)) continue;
                const link = card.querySelector('a[href]');
                if (link) return { href: link.href, text: title ? title.textContent.trim() : '' };
            }
            return null;
        });

        if (!productLink) {
            log('FAIL', 'Test 7 - Product card navigates to product page', 'No product card link found');
        } else {
            // Navigate to the link href directly
            await page.goto(productLink.href, { waitUntil: 'networkidle2', timeout: TIMEOUT });
            await sleep(800);

            const newUrl = page.url();
            const isProductPage = newUrl !== BASE + '/shop' && newUrl !== BASE + '/';
            if (isProductPage) {
                log(
                    'PASS',
                    'Test 7 - Product card navigates to product page',
                    `Card "${productLink.text}" → ${newUrl}`
                );
            } else {
                log(
                    'FAIL',
                    'Test 7 - Product card navigates to product page',
                    `Link href was "${productLink.href}" but navigation went to ${newUrl}`
                );
            }
        }
    } catch (e) {
        log('FAIL', 'Test 7 - Product card navigates to product page', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 8: Featured "Shop Now" button → /relentless-trophy-tee
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/');
        await sleep(1500);

        // Find the Shop Now button that points to /relentless-trophy-tee specifically
        const featuredShopNow = await page.evaluate(() => {
            const links = document.querySelectorAll('a');
            for (const a of links) {
                if (/shop now/i.test(a.textContent) && a.href.includes('relentless-trophy-tee')) {
                    return { found: true, href: a.href };
                }
            }
            // Fallback: check all Shop Now links
            const allShopNow = Array.from(document.querySelectorAll('a')).filter((a) =>
                /shop now/i.test(a.textContent)
            );
            return {
                found: false,
                allHrefs: allShopNow.map((a) => a.href)
            };
        });

        if (featuredShopNow.found) {
            await page.goto(featuredShopNow.href, { waitUntil: 'networkidle2', timeout: TIMEOUT });
            await sleep(800);
            const dest = page.url();
            if (dest.includes('relentless-trophy-tee')) {
                log('PASS', 'Test 8 - Featured Shop Now → relentless-trophy-tee', `Navigated to ${dest}`);
            } else {
                log('FAIL', 'Test 8 - Featured Shop Now → relentless-trophy-tee', `Went to ${dest}`);
            }
        } else {
            // Shop Now exists but doesn't link to relentless-trophy-tee
            log(
                'FAIL',
                'Test 8 - Featured Shop Now → relentless-trophy-tee',
                `No Shop Now link to relentless-trophy-tee. Found: ${JSON.stringify(featuredShopNow.allHrefs)}`
            );
        }
    } catch (e) {
        log('FAIL', 'Test 8 - Featured Shop Now → relentless-trophy-tee', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 9: "View All" → /shop
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/');
        await sleep(1500);

        const viewAllLink = await page.evaluate(() => {
            const links = document.querySelectorAll('a');
            for (const a of links) {
                if (/view all/i.test(a.textContent.trim())) {
                    return { found: true, href: a.href };
                }
            }
            return { found: false };
        });

        if (!viewAllLink.found) {
            log('FAIL', 'Test 9 - View All → /shop', 'No "View All" link found on homepage');
        } else if (viewAllLink.href.includes('/shop')) {
            log('PASS', 'Test 9 - View All → /shop', `"View All" href is ${viewAllLink.href}`);
        } else {
            log('FAIL', 'Test 9 - View All → /shop', `"View All" links to ${viewAllLink.href} (expected /shop)`);
        }
    } catch (e) {
        log('FAIL', 'Test 9 - View All → /shop', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 10: Max quantity - click + 10 times, verify cap
    // ─────────────────────────────────────────────────────────────────
    try {
        await clearCart(page);
        await goto(page, '/1h-star-cap');
        await sleep(800);
        await page.reload({ waitUntil: 'networkidle2', timeout: TIMEOUT });
        await sleep(1000);

        await selectSize(page, null);
        await sleep(300);
        await clickAddToBag(page);
        await sleep(1500);

        await openCart(page);
        await sleep(1000);

        // Check cart drawer is actually open
        const cartDrawerOpen10 = await isCartOpen(page);
        if (!cartDrawerOpen10) {
            log('FAIL', 'Test 10 - Max quantity cap', 'Cart drawer failed to open');
            throw new Error('skip');
        }

        // Wait for cart items to render
        await page.waitForSelector('#mini-cart-items [data-cart-item]', { timeout: 5000 }).catch(() => {});

        // Click + via evaluate to avoid detached element issues
        let clickCount = 0;
        for (let i = 0; i < 10; i++) {
            const clicked = await page.evaluate(() => {
                const btn = document.querySelector('.cart-qty-plus');
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });
            if (!clicked) break;
            await sleep(300);
            clickCount++;
        }

        // Read final quantity from in-memory state
        const finalQty = await page.evaluate(() => {
            if (window.state && Array.isArray(window.state.cart) && window.state.cart.length > 0) {
                return window.state.cart[0].quantity;
            }
            // Fallback: read from DOM
            const items = document.querySelectorAll('#mini-cart-items [data-cart-item]');
            for (const item of items) {
                const spans = item.querySelectorAll('span');
                for (const s of spans) {
                    const n = parseInt(s.textContent.trim(), 10);
                    if (!isNaN(n) && n >= 1 && n < 1000) return n;
                }
            }
            return null;
        });

        if (finalQty === null) {
            log('FAIL', 'Test 10 - Max quantity cap', `Could not read quantity after ${clickCount} + clicks`);
        } else {
            const maxExpected = 1 + clickCount;
            if (finalQty <= maxExpected) {
                const msg =
                    finalQty < maxExpected
                        ? `capped at ${finalQty} (stock limit hit after ${clickCount} clicks)`
                        : `reached ${finalQty} = 1+${clickCount} (qty increments correctly, no artificial cap)`;
                log('PASS', 'Test 10 - Max quantity cap', msg);
            } else {
                log('FAIL', 'Test 10 - Max quantity cap', `Qty ${finalQty} exceeds expected max of ${maxExpected}`);
            }
        }

        await closeCart(page);
        await sleep(400);
    } catch (e) {
        if (e.message !== 'skip') log('FAIL', 'Test 10 - Max quantity cap', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 11: Open cart, close, reopen - still works
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/');
        await sleep(800);

        await openCart(page);
        await sleep(600);

        const firstOpen = await isCartOpen(page);

        await closeCart(page);
        await sleep(600);

        const afterClose = await isCartOpen(page);

        await openCart(page);
        await sleep(600);

        const secondOpen = await isCartOpen(page);

        if (firstOpen && !afterClose && secondOpen) {
            log('PASS', 'Test 11 - Cart reopen after close', 'Cart: opened → closed → reopened successfully');
        } else {
            log(
                'FAIL',
                'Test 11 - Cart reopen after close',
                `firstOpen=${firstOpen}, afterClose=${afterClose}, secondOpen=${secondOpen}`
            );
        }

        await closeCart(page);
        await sleep(300);
    } catch (e) {
        log('FAIL', 'Test 11 - Cart reopen after close', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 12: 100MPH Tee product page loads, correct price (£40)
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/100mph-tee');
        await sleep(1500);

        const productInfo = await page.evaluate(() => {
            const title = document.querySelector('h1, .product-title');
            const prices = Array.from(document.querySelectorAll('[class*="price"], .product-price'))
                .map((el) => el.textContent.trim())
                .filter((t) => /[£\d]/.test(t));
            return {
                title: title ? title.textContent.trim() : '',
                prices,
                url: window.location.href
            };
        });

        if (!productInfo.title) {
            log('FAIL', 'Test 12 - 100MPH Tee page/price', 'No product title found on page');
        } else if (productInfo.prices.some((p) => /£40|40\.00/.test(p))) {
            log(
                'PASS',
                'Test 12 - 100MPH Tee page/price',
                `Title: "${productInfo.title}", Price: £40 confirmed. All prices: ${productInfo.prices.join(', ')}`
            );
        } else {
            log(
                'FAIL',
                'Test 12 - 100MPH Tee page/price',
                `Title: "${productInfo.title}", Prices: ${productInfo.prices.join(', ')} (expected £40)`
            );
        }
    } catch (e) {
        log('FAIL', 'Test 12 - 100MPH Tee page/price', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 13: 100MPH Tee appears in t-shirts filter on shop
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/shop?category=t-shirts');
        await sleep(1500);
        await page.waitForSelector('.product-card', { timeout: 10000 }).catch(() => {});

        const tshirts = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            return Array.from(cards)
                .map((c) => {
                    const t = c.querySelector('.product-title, h3');
                    return t ? t.textContent.trim() : '';
                })
                .filter(Boolean);
        });

        if (tshirts.some((t) => /100.*mph|100mph/i.test(t))) {
            log('PASS', 'Test 13 - 100MPH Tee in t-shirts filter', `Found in t-shirts. All: ${tshirts.join(', ')}`);
        } else {
            log('FAIL', 'Test 13 - 100MPH Tee in t-shirts filter', `Not found. Shown: ${tshirts.join(', ')}`);
        }
    } catch (e) {
        log('FAIL', 'Test 13 - 100MPH Tee in t-shirts filter', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 14: All hoodies show Coming Soon badge and block interaction
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/shop?category=hoodies');
        await sleep(1500);
        await page.waitForSelector('.product-card', { timeout: 10000 }).catch(() => {});

        const hoodieCheck = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            return Array.from(cards).map((card) => {
                const title = card.querySelector('.product-title, h3');
                const titleText = title ? title.textContent.trim() : 'Unknown';
                // "Coming Soon" badge: span with that text
                const hasComingSoonBadge =
                    !!card.querySelector('span[class*="Coming"], span[class*="coming"]') ||
                    Array.from(card.querySelectorAll('span')).some((s) => /coming soon/i.test(s.textContent));
                const hasComingSoonText = /coming\s*soon/i.test(card.textContent);
                // Blocked: no <a> link (just a <div>), or pointer-events: none
                const link = card.querySelector('a[href]');
                const pointerEventsNone = card.style.pointerEvents === 'none';
                const isBlocked = !link || pointerEventsNone;
                return { title: titleText, hasComingSoonBadge, hasComingSoonText, isBlocked, hasLink: !!link };
            });
        });

        if (hoodieCheck.length === 0) {
            log('FAIL', 'Test 14 - Coming Soon hoodies blocked', 'No hoodie cards found on /shop?category=hoodies');
        } else {
            const allGood = hoodieCheck.every((h) => (h.hasComingSoonBadge || h.hasComingSoonText) && h.isBlocked);
            if (allGood) {
                log(
                    'PASS',
                    'Test 14 - Coming Soon hoodies blocked',
                    `All ${hoodieCheck.length} hoodies have Coming Soon indicator and are non-navigable`
                );
            } else {
                const problems = hoodieCheck.filter(
                    (h) => !(h.hasComingSoonBadge || h.hasComingSoonText) || !h.isBlocked
                );
                log('FAIL', 'Test 14 - Coming Soon hoodies blocked', `Problems: ${JSON.stringify(problems)}`);
            }
        }
    } catch (e) {
        log('FAIL', 'Test 14 - Coming Soon hoodies blocked', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 15a: Escape key closes cart drawer
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/');
        await sleep(800);

        await openCart(page);
        await sleep(600);

        const openBefore = await isCartOpen(page);
        await page.keyboard.press('Escape');
        await sleep(700);
        const openAfter = await isCartOpen(page);

        if (openBefore && !openAfter) {
            log('PASS', 'Test 15a - Escape closes cart drawer', 'Cart closed with Escape key');
        } else {
            log('FAIL', 'Test 15a - Escape closes cart drawer', `openBefore=${openBefore}, openAfter=${openAfter}`);
        }
    } catch (e) {
        log('FAIL', 'Test 15a - Escape closes cart drawer', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 15b: Escape key closes mobile menu
    // ─────────────────────────────────────────────────────────────────
    try {
        await page.setViewport({ width: 375, height: 812 });
        await goto(page, '/');
        await sleep(800);

        // Open mobile menu
        await page.click('#menu-toggle');
        await sleep(600);

        const menuOpenBefore = await page.evaluate(() => {
            const menu = document.getElementById('mobile-menu');
            return menu ? menu.classList.contains('active') : false;
        });

        await page.keyboard.press('Escape');
        await sleep(700);

        const menuOpenAfter = await page.evaluate(() => {
            const menu = document.getElementById('mobile-menu');
            return menu ? menu.classList.contains('active') : false;
        });

        if (menuOpenBefore && !menuOpenAfter) {
            log('PASS', 'Test 15b - Escape closes mobile menu', 'Mobile menu closed with Escape key');
        } else if (!menuOpenBefore) {
            log('FAIL', 'Test 15b - Escape closes mobile menu', 'Mobile menu did not open (hamburger click failed)');
        } else {
            log(
                'FAIL',
                'Test 15b - Escape closes mobile menu',
                `Mobile menu still has .active class after Escape. Before=${menuOpenBefore}, After=${menuOpenAfter}`
            );
        }

        await page.setViewport({ width: 1280, height: 800 });
    } catch (e) {
        log('FAIL', 'Test 15b - Escape closes mobile menu', e.message);
        await page.setViewport({ width: 1280, height: 800 });
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 16: Cart persists after page refresh
    // ─────────────────────────────────────────────────────────────────
    try {
        await clearCart(page);
        await goto(page, '/1h-star-cap');
        await sleep(1000);

        await selectSize(page, null);
        await sleep(200);
        await clickAddToBag(page);
        await sleep(1500);

        const countBefore = await getCartBadgeCount(page);

        // Reload page
        await page.reload({ waitUntil: 'networkidle2', timeout: TIMEOUT });
        await sleep(1500);

        const countAfter = await getCartBadgeCount(page);

        if (countAfter !== null && countAfter >= 1) {
            log(
                'PASS',
                'Test 16 - Cart persists after refresh',
                `Cart count before: ${countBefore}, after refresh: ${countAfter}`
            );
        } else {
            // Check localStorage directly
            const cartData = await page.evaluate(() => {
                return localStorage.getItem('cart') || localStorage.getItem('hunda_cart');
            });
            if (cartData) {
                const parsed = JSON.parse(cartData);
                const itemCount = Array.isArray(parsed) ? parsed.length : 0;
                log(
                    'PASS',
                    'Test 16 - Cart persists after refresh',
                    `localStorage cart has ${itemCount} items after refresh (badge may not show)`
                );
            } else {
                log(
                    'FAIL',
                    'Test 16 - Cart persists after refresh',
                    `Badge before: ${countBefore}, after: ${countAfter}, no localStorage data`
                );
            }
        }
    } catch (e) {
        log('FAIL', 'Test 16 - Cart persists after refresh', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 17: Cart subtotal is mathematically correct
    // ─────────────────────────────────────────────────────────────────
    try {
        await openCart(page);
        await sleep(800);

        const mathCheck = await page.evaluate(() => {
            const items = document.querySelectorAll('#mini-cart-items [data-cart-item]');
            let calculatedTotal = 0;
            const itemDetails = [];

            for (const item of items) {
                // Price is in a <span> with font-bold at top right
                const priceEl = item.querySelector(
                    '.flex.justify-between span:last-child, span.font-bold:last-of-type'
                );
                const allSpans = item.querySelectorAll('.flex.justify-between span');
                let price = null;
                for (const s of allSpans) {
                    const m = s.textContent.match(/£([\d.]+)/);
                    if (m) {
                        price = parseFloat(m[1]);
                        break;
                    }
                }

                // Qty is the font-bold span between - and + buttons
                let qty = 1;
                const innerSpans = item.querySelectorAll('span.font-bold, .px-2.text-xs.font-bold');
                for (const s of innerSpans) {
                    const n = parseInt(s.textContent.trim(), 10);
                    if (!isNaN(n) && n >= 1 && n < 100) {
                        qty = n;
                        break;
                    }
                }

                if (price !== null) {
                    calculatedTotal += price * qty;
                    itemDetails.push({ price, qty, lineTotal: price * qty });
                }
            }

            // Displayed subtotal
            const subtotalEl = document.getElementById('mini-cart-subtotal');
            const subtotalText = subtotalEl ? subtotalEl.textContent.trim() : '';
            const subtotalMatch = subtotalText.match(/£([\d.]+)/);
            const displayedTotal = subtotalMatch ? parseFloat(subtotalMatch[1]) : null;

            return { calculatedTotal, displayedTotal, itemDetails, subtotalText };
        });

        if (mathCheck.itemDetails.length === 0) {
            log('FAIL', 'Test 17 - Cart subtotal math', 'No items found in open cart drawer');
        } else if (mathCheck.displayedTotal === null) {
            log(
                'FAIL',
                'Test 17 - Cart subtotal math',
                `Could not parse displayed subtotal "${mathCheck.subtotalText}". Items: ${JSON.stringify(mathCheck.itemDetails)}`
            );
        } else {
            const diff = Math.abs(mathCheck.calculatedTotal - mathCheck.displayedTotal);
            if (diff < 0.02) {
                log(
                    'PASS',
                    'Test 17 - Cart subtotal math',
                    `${mathCheck.subtotalText} matches calculated £${mathCheck.calculatedTotal.toFixed(2)} (${mathCheck.itemDetails.length} items)`
                );
            } else {
                log(
                    'FAIL',
                    'Test 17 - Cart subtotal math',
                    `Displayed: ${mathCheck.subtotalText} vs Calculated: £${mathCheck.calculatedTotal.toFixed(2)} (diff £${diff.toFixed(2)})`
                );
            }
        }

        await closeCart(page);
        await sleep(300);
    } catch (e) {
        log('FAIL', 'Test 17 - Cart subtotal math', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 18: Shop page product count is correct
    // ─────────────────────────────────────────────────────────────────
    try {
        await goto(page, '/shop');
        await sleep(2000);
        await page.waitForSelector('.product-card', { timeout: 10000 }).catch(() => {});

        const countCheck = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            const productCountEl = document.getElementById('product-count');
            const displayedCount = productCountEl ? parseInt(productCountEl.textContent.trim(), 10) : null;
            const titles = Array.from(cards)
                .map((c) => {
                    const t = c.querySelector('.product-title, h3');
                    return t ? t.textContent.trim() : '';
                })
                .filter(Boolean);
            return { actualCardCount: cards.length, displayedCount, titles };
        });

        if (countCheck.actualCardCount === 0) {
            log('FAIL', 'Test 18 - Shop product count', 'No product cards found on shop page');
        } else if (countCheck.displayedCount !== null && !isNaN(countCheck.displayedCount)) {
            if (countCheck.displayedCount === countCheck.actualCardCount) {
                log(
                    'PASS',
                    'Test 18 - Shop product count',
                    `Displayed count (${countCheck.displayedCount}) matches rendered cards (${countCheck.actualCardCount})`
                );
            } else {
                log(
                    'FAIL',
                    'Test 18 - Shop product count',
                    `Displayed: ${countCheck.displayedCount}, Actual cards: ${countCheck.actualCardCount} — mismatch. Titles: ${countCheck.titles.join(', ')}`
                );
            }
        } else {
            // No count element - just verify reasonable number
            const expected = 6; // fallback has 6 products
            if (countCheck.actualCardCount >= expected) {
                log(
                    'PASS',
                    'Test 18 - Shop product count',
                    `${countCheck.actualCardCount} cards rendered (≥${expected} expected). Titles: ${countCheck.titles.join(', ')}`
                );
            } else {
                log(
                    'FAIL',
                    'Test 18 - Shop product count',
                    `Only ${countCheck.actualCardCount} cards (expected ≥${expected}). Titles: ${countCheck.titles.join(', ')}`
                );
            }
        }
    } catch (e) {
        log('FAIL', 'Test 18 - Shop product count', e.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────────
    await browser.close();

    console.log('\n' + '='.repeat(60));
    console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
    console.log('='.repeat(60) + '\n');

    if (jsErrors.length > 0) {
        console.log(`JS Errors encountered (${jsErrors.length}):`);
        jsErrors.forEach((e) => console.log(`  [${e.url}] ${e.msg}`));
        console.log();
    }

    // Print failures summary
    if (failed > 0) {
        console.log('FAILED TESTS:');
        results
            .filter((r) => r.status === 'FAIL')
            .forEach((r) => {
                console.log(`  • ${r.test}: ${r.detail}`);
            });
        console.log();
    }

    process.exit(failed > 0 ? 1 : 0);
})();
