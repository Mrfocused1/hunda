# Header Consistency Check

Ensures all pages have consistent header structure and navigation across the site.

## When to Use

- Adding new navigation items
- Modifying header structure
- Adding new pages
- Fixing header-related bugs
- Before deploying changes

## Checklist

### Desktop Header Structure
All pages must have identical desktop headers with:

- [ ] Logo linking to home
- [ ] Navigation: Shop All, New In, About Us
- [ ] Search functionality
- [ ] Account icon linking to /account
- [ ] Wishlist icon linking to /wishlist
- [ ] Cart button (not link) with id="cart-trigger"

### Mobile Header Structure
All pages must have identical mobile headers with:

- [ ] Hamburger menu button with id="menu-toggle"
- [ ] Logo centered
- [ ] Search icon
- [ ] Cart button with id="cart-trigger-mobile"
- [ ] NO desktop header visible on mobile (<1024px)

### Mobile Menu Structure
All pages must have identical mobile menus with:

- [ ] Logo + close button header
- [ ] Search input field (gray background)
- [ ] Primary links: Shop All, New In, About Us
- [ ] Divider line
- [ ] Secondary links: My Account, Wishlist, Shopping Bag
- [ ] Cart count badge in Shopping Bag row

### Cart Drawer
All pages must include cart drawer:

- [ ] Overlay div with id="cart-overlay"
- [ ] Aside with id="cart-drawer"
- [ ] Bag count display
- [ ] Close button with id="close-cart"
- [ ] Items container with id="mini-cart-items"
- [ ] Subtotal display with id="mini-cart-subtotal"
- [ ] Checkout button linking to /checkout
- [ ] View Bag button linking to /cart

## Automated Verification

Run this command to check all pages:

```bash
node scripts/verify-headers.js
```

## Manual Verification Steps

1. Open Chrome DevTools
2. Toggle Device Toolbar (Cmd+Shift+M)
3. Select "iPhone SE" preset
4. Visit each page and verify:
   - Single header only
   - Mobile menu opens
   - All links present

5. Toggle to desktop view (1440px)
6. Verify:
   - Full navigation visible
   - All icons present
   - Search functional

## Common Failures

| Issue | Cause | Fix |
|-------|-------|-----|
| Double header on mobile | CSS override of `.hidden` class | Add `display: none !important` for mobile viewport |
| Missing About Us link | Forgot to update all pages | Use find/replace across all HTML files |
| Cart doesn't open | Using `<a>` instead of `<button>` | Change to `<button id="cart-trigger">` |
| Mobile menu looks like two headers | Search section has white background | Change to gray background, remove border |

## Files to Check

Always verify these 8 files are consistent:
1. index.html
2. shop.html
3. product.html
4. cart.html
5. checkout.html
6. wishlist.html
7. account.html
8. about.html
