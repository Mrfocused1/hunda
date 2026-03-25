# Chrome DevTools Guide for 1 HUNDRED

## Quick Mobile Testing

### Method 1: DevTools Device Mode (Fastest)

1. **Open DevTools**
   - Chrome: `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Or right-click → Inspect

2. **Toggle Device Toolbar**
   - Shortcut: `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows)
   - Or click the icon: 📱

3. **Select Device Preset**
   - Click the device dropdown (shows "Responsive" by default)
   - Recommended presets:
     - **iPhone SE** (375×667) - Small screen test
     - **iPhone 12 Pro** (390×844) - Modern iPhone
     - **Pixel 5** (393×851) - Android reference
     - **iPad Mini** (768×1024) - Tablet view

4. **Test Interactions**
   - Touch events are simulated automatically
   - Click the hamburger menu to test mobile navigation
   - Click cart icon to test cart drawer

### Method 2: VS Code Launch Configurations

1. Install "Debugger for Chrome" extension
2. Press `F5` and select:
   - "Launch Chrome (Desktop)" for desktop view
   - "Launch Chrome (Mobile iPhone SE)" for mobile view

### Method 3: Automated Screenshots

```bash
# Start local server
npm run dev

# In another terminal, capture all screenshots
npm run test:screenshots

# Or just mobile
npm run test:screenshots:mobile

# Or just desktop
npm run test:screenshots:desktop
```

Screenshots are saved to `./screenshots/[timestamp]/` with an HTML report.

## Common Issues to Check

### Mobile Layout
- [ ] Header doesn't duplicate (desktop + mobile headers visible)
- [ ] Hamburger menu opens correctly
- [ ] Mobile menu doesn't look like it has two headers
- [ ] Cart drawer slides in from right
- [ ] All navigation links work
- [ ] Logo centered in mobile header

### Desktop Layout
- [ ] All nav links visible (Shop All, New In, About Us)
- [ ] Search bar functional
- [ ] Cart button opens drawer
- [ ] Logo positioned left

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 1024px | Hamburger menu, centered logo |
| Desktop | ≥ 1024px | Full nav, left logo |

## Network Throttling

Test slow connections:
1. DevTools → Network tab
2. Throttle dropdown → "Fast 3G" or "Slow 3G"
3. Reload page to see loading states

## Element Inspector Tips

1. **Find computed styles**: Elements → Computed tab
2. **Check responsive classes**: Toggle device mode, watch classes change
3. **Screenshot element**: Right-click element → Capture screenshot

## Visual Regression Testing

Compare screenshots between versions:

```bash
# 1. Create baseline screenshots
npm run test:screenshots
mv screenshots/[timestamp] screenshots/baseline

# 2. Make your changes...

# 3. Capture new screenshots
npm run test:screenshots

# 4. Compare
npm run test:compare -- ./screenshots/baseline ./screenshots/[new-timestamp]
```
