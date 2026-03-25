# Visual Regression Tester

Automates screenshot capture and comparison across all site pages to detect visual inconsistencies and regressions.

## When to Use

- Before committing changes that affect UI
- After fixing layout/styling issues
- When adding new pages or components
- To verify responsive behavior across viewports
- After updating shared CSS or header components

## Workflow

### 1. Capture Baseline Screenshots

```bash
npm run test:screenshots
```

This captures all pages at mobile (iPhone SE) and desktop (1440px) viewports.

### 2. Make Your Changes

Edit files as needed. The skill will help verify changes don't break other pages.

### 3. Capture New Screenshots & Compare

```bash
npm run test:screenshots
# Then compare with baseline if needed
npm run test:compare -- ./screenshots/baseline ./screenshots/current
```

### 4. Review the Report

Open `screenshots/[timestamp]/index.html` to view:
- Side-by-side mobile/desktop views
- Mobile menu open states
- Any visual differences highlighted

## Testing Checklist

Before marking a UI task complete, verify:

- [ ] All 8 pages tested (home, shop, product, cart, checkout, wishlist, account, about)
- [ ] Mobile viewport (375px) renders correctly
- [ ] Desktop viewport (1440px) renders correctly
- [ ] Mobile menu opens and displays correctly
- [ ] No duplicate headers or layout shifts
- [ ] Navigation links consistent across all pages

## Common Issues This Catches

1. **Header inconsistencies** - Desktop header showing on mobile
2. **Missing navigation items** - About Us link missing on some pages
3. **Layout shifts** - Elements breaking at certain viewports
4. **Mobile menu issues** - Menu not opening or displaying incorrectly
5. **Cart drawer problems** - Drawer not sliding in properly

## Integration with CI/CD

Add to GitHub Actions:

```yaml
- name: Visual Regression Tests
  run: |
    npm run test:screenshots
    # Fail if differences detected
    npm run test:compare -- ./screenshots/baseline ./screenshots/current
```

## Tips

- Always capture baseline before major changes
- Run tests before every commit with `--screenshots` flag
- Review the HTML report - it's easier than comparing images manually
- Mask dynamic content (timestamps, random images) in screenshots if needed
