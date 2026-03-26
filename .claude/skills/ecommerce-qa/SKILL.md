---
name: ecommerce-qa
description: Validate e-commerce functionality for the 100hunda shop
---

# E-commerce QA Checklist

Comprehensive testing guide for the 100hunda streetwear shop to ensure all shopping functionality works correctly.

## When to Use

- Before deploying new features
- After modifying cart/checkout code
- When adding new product pages
- Before marketing campaigns or sales
- Weekly regression testing

---

## Cart Functionality

### Add to Cart
- [ ] Add to cart works on all product pages
- [ ] Add to cart works from product listings (shop page)
- [ ] Cart count badge updates immediately
- [ ] Correct product (size, color, quantity) added
- [ ] Can add multiple quantities of same product
- [ ] Can add different variants (sizes/colors) of same product

### Cart Persistence
- [ ] Cart persists across page navigation
- [ ] Cart persists after browser refresh
- [ ] Cart data stored in localStorage/sessionStorage
- [ ] Cart survives going back/forward in history

### Cart Updates
- [ ] Quantity increment/decrement works
- [ ] Cart subtotal updates immediately on quantity change
- [ ] Cart total updates correctly (subtotal + shipping + tax)
- [ ] Remove item button works
- [ ] Removing item updates cart count badge
- [ ] Empty cart state displays correctly

### Cart Drawer/Mini-Cart
- [ ] Cart drawer opens when clicking cart icon
- [ ] Cart drawer closes when clicking overlay or X button
- [ ] Cart drawer displays correct items
- [ ] Cart drawer shows item images, names, prices
- [ ] Scroll works when many items in cart
- [ ] "View Bag" button links to full cart page
- [ ] "Checkout" button proceeds to checkout

---

## Product Pages

### Product Information
- [ ] Product images display correctly
- [ ] Image zoom/lightbox works
- [ ] Multiple product images in gallery
- [ ] Product name, price, description display
- [ ] Size selector works
- [ ] Size guide modal opens if available
- [ ] Color selector works (if applicable)
- [ ] Stock availability shows correctly
- [ ] "Out of stock" state prevents add to cart

### Product Interactions
- [ ] Quantity selector works (min: 1, max: reasonable limit)
- [ ] "Add to Wishlist" works
- [ ] Share buttons functional
- [ ] Related products display
- [ ] Recently viewed products track correctly

---

## Wishlist

- [ ] Add to wishlist from product page works
- [ ] Add to wishlist from product listing works
- [ ] Wishlist persists across sessions
- [ ] Can remove items from wishlist
- [ ] Can move items from wishlist to cart
- [ ] Wishlist count badge updates
- [ ] Empty wishlist state displays correctly
- [ ] Wishlist requires login (if implemented)

---

## Checkout Flow

### Step 1: Information
- [ ] Email field validates format
- [ ] Shipping address fields validate
- [ ] Country/region selector works
- [ ] Postal code validation
- [ ] Phone number field validates
- [ ] "Ship to different address" option works (if available)
- [ ] Order summary displays correct items and totals

### Step 2: Shipping
- [ ] Shipping options display
- [ ] Shipping costs calculate correctly
- [ ] Free shipping threshold works (if applicable)
- [ ] Delivery estimates show
- [ ] Selection persists

### Step 3: Payment
- [ ] Payment form loads securely (HTTPS)
- [ ] Credit card validation works
- [ ] Expiry date validation (not expired)
- [ ] CVV field validates (3-4 digits)
- [ ] Billing address same as shipping toggle works
- [ ] Alternative payment methods work (PayPal, Apple Pay, etc.)
- [ ] "Complete Order" button validates all fields first

### Order Confirmation
- [ ] Success page displays after order
- [ ] Order number generates and displays
- [ ] Order summary shows on confirmation page
- [ ] Confirmation email sends
- [ ] Cart clears after successful order

---

## User Account

### Authentication
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] "Remember me" option works
- [ ] Logout works and clears session
- [ ] Password reset flow works

### Account Dashboard
- [ ] Order history displays
- [ ] Can view order details
- [ ] Can track shipments (if integrated)
- [ ] Saved addresses display
- [ ] Can add/edit/delete addresses
- [ ] Account settings save correctly

---

## Mobile Experience

### Responsive Design
- [ ] Cart drawer slides smoothly on mobile
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scroll on any page
- [ ] Product images zoom properly on touch
- [ ] Swipe gestures work for image galleries
- [ ] Mobile menu opens/closes correctly

### Mobile Checkout
- [ ] Forms are easy to fill on mobile
- [ ] Number pad opens for phone/zip fields
- [ ] Date picker works for expiry dates
- [ ] Autofill works for address fields
- [ ] No zoom on input focus (viewport settings correct)

---

## Search & Navigation

### Search
- [ ] Search returns relevant results
- [ ] Search handles typos gracefully
- [ ] Search filters work (category, price, size)
- [ ] Empty search shows helpful message
- [ ] Search suggestions work (if implemented)

### Navigation
- [ ] Main nav links work
- [ ] Category pages load correct products
- [ ] Filters work on category pages
- [ ] Sorting works (price, newness, etc.)
- [ ] Pagination or infinite scroll works
- [ ] Breadcrumbs display and work correctly

---

## Error Handling

### User-Friendly Errors
- [ ] Network errors show helpful message
- [ ] Cart errors don't lose user's items
- [ ] Payment failures explain next steps
- [ ] Out of stock items handled gracefully
- [ ] Session timeout warns user

### Edge Cases
- [ ] Rapid clicks don't break cart
- [ ] Double-submit prevented on checkout
- [ ] Browser back button works correctly in checkout
- [ ] Cart works with JavaScript disabled (graceful degradation)

---

## Security Checks

- [ ] All checkout pages use HTTPS
- [ ] No sensitive data in URLs
- [ ] PCI compliance for card handling (use Stripe/PayPal)
- [ ] CSRF tokens on forms
- [ ] Rate limiting on login attempts
- [ ] Secure session handling

---

## Automated Testing Commands

```bash
# Run header verification (project-specific)
node scripts/verify-headers.js

# Check for console errors
grep -r "console.error" *.js || echo "No console errors"

# Verify all pages exist
for page in index shop product cart checkout wishlist account about; do
  if [ -f "$page.html" ]; then
    echo "✓ $page.html exists"
  else
    echo "✗ $page.html missing"
  fi
done
```

---

## Quick Smoke Test (2 Minutes)

Run this before any deploy:

1. [ ] Open site on mobile viewport
2. [ ] Add product to cart
3. [ ] Open cart drawer, verify item appears
4. [ ] Go to checkout, fill test data
5. [ ] Verify order summary correct
6. [ ] Check no console errors
7. [ ] Test on desktop, verify responsive

---

## Known Issues Log

Use this section to track recurring issues:

| Date | Issue | Status | Fix |
|------|-------|--------|-----|
| YYYY-MM-DD | Example issue | Fixed/Pending | Description |

---

## Browser Testing Matrix

Test on these browsers before major releases:

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Chrome Mobile (iOS & Android)
- [ ] Safari Mobile (iOS)
