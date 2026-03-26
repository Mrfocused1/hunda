---
name: performance
description: Optimize website performance for speed and Core Web Vitals
---

# Performance Optimization

Ensures fast loading times, smooth interactions, and excellent Core Web Vitals scores.

## When to Use

- Before deploying to production
- After adding new features or assets
- When Lighthouse scores drop below 90
- Monthly performance audits
- When users report slowness

---

## Core Web Vitals Targets

| Metric | Target | Good Score |
|--------|--------|------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Under 2.5s |
| **INP** (Interaction to Next Paint) | < 200ms | Under 200ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Under 0.1 |
| **FCP** (First Contentful Paint) | < 1.8s | Under 1.8s |
| **TTFB** (Time to First Byte) | < 800ms | Under 800ms |

---

## Image Optimization

### Format Selection
- [ ] Use **WebP** as default (30% smaller than JPEG)
- [ ] Use **AVIF** for next-gen (50% smaller, check browser support)
- [ ] Use **SVG** for icons and logos
- [ ] Use **PNG** only when transparency needed and quality critical

### Implementation
- [ ] Implement lazy loading: `<img loading="lazy">`
- [ ] Use `srcset` for responsive images:
  ```html
  <img srcset="img-320.jpg 320w, img-768.jpg 768w, img-1200.jpg 1200w"
       sizes="(max-width: 600px) 320px, (max-width: 1000px) 768px, 1200px"
       src="img-1200.jpg" alt="...">
  ```
- [ ] Specify image dimensions (width/height) to prevent CLS
- [ ] Use `decoding="async"` for non-critical images

### Compression Targets
- [ ] Hero images: < 200KB
- [ ] Product images: < 100KB each
- [ ] Thumbnails: < 30KB
- [ ] Icons: Use SVG or icon font

### Tools
```bash
# Image conversion
cwebp -q 85 input.jpg -o output.webp

# Batch optimization (if imagemin installed)
# npx imagemin src/images/* --out-dir=dist/images
```

---

## CSS Optimization

### Critical CSS
- [ ] Inline critical CSS for above-the-fold content
- [ ] Load non-critical CSS asynchronously:
  ```html
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  ```

### Minification & Removal
- [ ] Minify CSS for production (remove whitespace, comments)
- [ ] Remove unused CSS with PurgeCSS or similar
- [ ] Combine multiple CSS files when possible

### Efficient Selectors
- [ ] Avoid universal selectors (`*`)
- [ ] Avoid overqualified selectors (`div.container` → `.container`)
- [ ] Don't nest deeper than 3 levels

---

## JavaScript Optimization

### Loading Strategy
- [ ] Use `defer` for scripts that need DOM but not immediate execution
- [ ] Use `async` for independent scripts (analytics, etc.)
- [ ] Load non-critical JS at the bottom or on user interaction
- [ ] Code-split large bundles

### Code Efficiency
- [ ] Minify and compress JS for production
- [ ] Remove console.log statements
- [ ] Use event delegation instead of many individual listeners
- [ ] Debounce scroll/resize event handlers
- [ ] Use Intersection Observer for scroll-based triggers

### Example: Debounce Function
```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage
window.addEventListener('resize', debounce(() => {
  // Resize handler
}, 250));
```

---

## Font Optimization

### Loading Strategy
- [ ] Use `font-display: swap` to prevent invisible text
- [ ] Preload critical fonts:
  ```html
  <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
  ```
- [ ] Subset fonts to include only needed characters
- [ ] Use system font stack as fallback

### System Font Stack Example
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

---

## Caching Strategy

### Static Assets
```nginx
# Nginx example
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### HTML Files
```nginx
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

---

## Performance Checklist

### Before Launch
- [ ] Run Lighthouse audit (target: 90+ all categories)
- [ ] Test on 3G connection (Chrome DevTools)
- [ ] Verify no render-blocking resources
- [ ] Check total page weight < 2MB
- [ ] Verify fonts load with minimal FOUT/FOIT

### Monthly Audit
- [ ] Review Core Web Vitals in Search Console
- [ ] Check for new unused CSS/JS
- [ ] Verify images haven't regressed in size
- [ ] Test on real mobile devices
- [ ] Review third-party script impact

---

## Performance Budget

Set limits and enforce them:

| Resource | Budget |
|----------|--------|
| Total page weight | < 2 MB |
| JavaScript | < 300 KB (gzipped) |
| CSS | < 50 KB (gzipped) |
| Images | < 1 MB total |
| Web fonts | < 100 KB |
| Third-party scripts | < 200 KB |

---

## Quick Wins

1. **Enable compression** (gzip/Brotli) on server
2. **Use a CDN** for static assets
3. **Lazy load below-fold images**
4. **Preconnect to required origins**:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   ```
5. **Optimize third-party scripts** (async/defer, load conditionally)

---

## Testing Tools

- **Lighthouse** (Chrome DevTools)
- **WebPageTest** (webpagetest.org)
- **PageSpeed Insights** (pagespeed.web.dev)
- **GTmetrix** (gtmetrix.com)
- **Chrome DevTools Performance panel**
