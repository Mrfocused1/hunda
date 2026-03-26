---
name: code-quality
description: Enforce code quality standards for HTML/CSS/JS projects
---

# Code Quality Standards

Enforces consistent, maintainable, and accessible code across the project.

## When to Use

- Before committing code
- When reviewing pull requests
- During code refactoring
- When onboarding new files to the project

---

## HTML Standards

### Semantic Structure
- [ ] Use semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`)
- [ ] Only one `<h1>` per page
- [ ] Heading hierarchy is logical (h1 → h2 → h3, no skipping)
- [ ] Use `<button>` for clickable actions, `<a>` for navigation

### Accessibility (A11y)
- [ ] All images have descriptive `alt` attributes
- [ ] Form inputs have associated `<label>` elements
- [ ] Interactive elements have `aria-label` when text isn't visible
- [ ] Color contrast meets WCAG 2.1 AA standards (4.5:1 for text)
- [ ] Focus states are visible and logical
- [ ] Skip navigation link for keyboard users

### Validation
- [ ] Passes W3C HTML Validator with no errors
- [ ] No duplicate IDs in the same page
- [ ] Meta viewport tag present for responsive design

---

## CSS Standards

### Organization
- [ ] Use CSS custom properties (variables) for:
  - Colors
  - Typography (font-family, font-size scale)
  - Spacing scale
  - Breakpoints
- [ ] Group related styles together
- [ ] Avoid deep nesting (max 3 levels)

### Naming Convention
- [ ] Use BEM (Block-Element-Modifier) methodology
  ```css
  .card { }
  .card__title { }
  .card__title--large { }
  .card--featured { }
  ```

### Responsive Design
- [ ] Mobile-first approach (min-width media queries)
- [ ] Test at breakpoints: 320px, 768px, 1024px, 1440px
- [ ] No horizontal scroll at any viewport

### Performance
- [ ] Avoid `!important` (use specificity instead)
- [ ] Minimize use of expensive properties (`box-shadow`, `filter`, `blur`)
- [ ] Use `transform` and `opacity` for animations

---

## JavaScript Standards

### Syntax & Style
- [ ] Use `const` by default, `let` when reassignment needed, never `var`
- [ ] Prefer arrow functions for callbacks
- [ ] Use template literals for string concatenation
- [ ] Destructure objects/arrays when practical

### Functions
- [ ] Functions should do one thing (single responsibility)
- [ ] Max 20 lines per function (refactor if longer)
- [ ] Use early returns to reduce nesting
- [ ] Add JSDoc comments for complex functions:
  ```javascript
  /**
   * Calculates cart total with tax and shipping
   * @param {Object[]} items - Array of cart items
   * @param {number} taxRate - Tax rate as decimal
   * @param {number} shippingCost - Flat shipping cost
   * @returns {number} Final cart total
   */
  ```

### Error Handling
- [ ] Wrap async operations in try/catch
- [ ] Validate function inputs
- [ ] Provide meaningful error messages

### DOM Manipulation
- [ ] Cache DOM queries (don't repeat `document.querySelector`)
- [ ] Use event delegation for dynamic content
- [ ] Remove event listeners when components unmount

---

## Pre-Commit Checklist

Run this before every commit:

```bash
# Check for console logs
grep -r "console.log" *.js *.html || echo "✓ No console logs found"

# Check for TODO/FIXME comments
grep -r "TODO\|FIXME" *.js *.html *.css || echo "✓ No TODOs found"

# Validate HTML (if html-validate is installed)
# html-validate *.html
```

---

## Common Issues & Fixes

| Issue | Example | Fix |
|-------|---------|-----|
| Inline styles | `<div style="color: red">` | Move to CSS class |
| Missing alts | `<img src="...">` | Add `alt="description"` |
| Double equals | `if (x == y)` | Use triple equals `===` |
| Magic numbers | `margin: 47px` | Use CSS variable or comment |
| Dead code | Unused functions/variables | Delete or comment why kept |

---

## Tools Integration

### Recommended VS Code Extensions
- Prettier (formatting)
- ESLint (JS linting)
- stylelint (CSS linting)
- HTMLHint (HTML validation)

### NPM Scripts to Add
```json
{
  "scripts": {
    "lint:html": "html-validate *.html",
    "lint:css": "stylelint *.css",
    "lint:js": "eslint *.js",
    "format": "prettier --write ."
  }
}
```
