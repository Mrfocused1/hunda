# Systematic Debugging

Four-phase debugging methodology to identify and fix root causes, not just symptoms.

## The 4 Phases

### Phase 1: Observe & Reproduce

- Document exact symptoms
- Identify reproduction steps
- Note environment (browser, viewport, device)
- Capture screenshots/error messages

### Phase 2: Isolate

- Narrow down the scope
- Identify affected pages/components
- Check if issue is consistent or intermittent
- Use browser DevTools to inspect elements
- Test in isolation (disable other styles/scripts)

### Phase 3: Hypothesize

Based on symptoms, form hypotheses:

**CSS Issues:**
- Selector specificity conflict?
- Media query breakpoint issue?
- `!important` override?
- Missing/extra closing tag?

**HTML Structure Issues:**
- Duplicate elements?
- Missing wrapper/container?
- Incorrect nesting?

**JavaScript Issues:**
- Event listener not attached?
- Timing/async issue?
- DOM not ready when script runs?

### Phase 4: Verify & Fix

- Test hypothesis with minimal change
- Verify fix doesn't break other things
- Run visual regression tests
- Document the root cause

## Debugging Checklist

When a visual issue is reported:

```
□ Can I reproduce it?
□ Which pages are affected?
□ Which viewports show the issue?
□ What's the minimal case that shows it?
□ Is it CSS, HTML, or JavaScript related?
□ What changed recently that might have caused this?
□ Does removing recent changes fix it?
□ Is there a conflicting rule/element?
```

## Common Root Causes & Solutions

### Issue: Element not visible/hidden

**Check:**
1. `display: none` or `visibility: hidden`?
2. `opacity: 0`?
3. Behind another element (z-index)?
4. Parent container collapsed (height: 0)?
5. Overflow hidden cutting it off?

### Issue: Layout shift/broken layout

**Check:**
1. Missing closing tag?
2. CSS box-sizing different from expected?
3. Flex/Grid container issues?
4. Fixed widths on child elements?

### Issue: Works on desktop but broken on mobile

**Check:**
1. Media query overriding styles?
2. Touch vs mouse event differences?
3. Viewport meta tag present?
4. Fixed element widths too large?

### Issue: Inconsistent across pages

**Check:**
1. All pages using same CSS file?
2. Inline styles overriding?
3. Different HTML structure?
4. JavaScript conditionally loading?

## Using DevTools Effectively

### Elements Tab
- Inspect computed styles
- Check box model
- Modify styles live to test fixes
- Search for selectors (Ctrl+F)

### Console Tab
- Check for JavaScript errors
- Test selectors: `document.querySelector('#menu-toggle')`
- Check element properties

### Responsive Mode
- Test multiple viewports quickly
- Device pixel ratio simulation
- Throttle network if needed

## Documentation Template

When you find a bug, document:

```markdown
## Issue: [Brief description]

**Symptoms:** What you see
**Reproduction:** Steps to reproduce
**Root Cause:** Why it happens
**Fix:** What was changed
**Files Modified:** List of files
**Verification:** How you confirmed it's fixed
```

## Prevention

- Run visual regression tests before commits
- Use linting (Stylelint catches many CSS issues)
- Keep CSS organized and documented
- Test on multiple viewports during development
