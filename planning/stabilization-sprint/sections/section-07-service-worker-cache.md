# Section 7: Service Worker Cache Invalidation

## Overview

This is the **final step** of the stabilization sprint. After all six preceding sections have been deployed to production, the service worker's `VERSION` string must be bumped to force cache invalidation. Without this step, returning users whose browsers have cached the old `sw.js` and its precached assets will continue running the pre-fix code -- including the broken boot race, silent error swallowing, and dangerous advice rules.

## Dependencies

This section depends on **all prior sections being complete and deployed**:

- Section 1 (Remove Top-Level Awaits)
- Section 2 (Error Handling)
- Section 3 (Cultivation Contradictions)
- Section 4 (Test Coverage)
- Section 5 (Playwright Smoke Test)
- Section 6 (localStorage Hardening)

Do NOT execute this section until all six are merged to `main` and verified.

## Background: How the Service Worker Cache Works

`C:/GrowDoc/sw.js` uses a versioned cache strategy:

- `VERSION` constant (currently `'2026-04-nc2'`) is embedded in cache names: `growdoc-static-${VERSION}` and `growdoc-runtime-${VERSION}`
- On **install**: precaches critical app-shell assets (index.html, main.js, store.js, storage.js, etc.)
- On **activate**: deletes all caches not matching current version (cache-busting mechanism)
- Static assets use **stale-while-revalidate**
- Navigation requests use **network-first**
- `self.skipWaiting()` during install, `self.clients.claim()` during activate
- `vercel.json` sets `no-cache, no-store, must-revalidate` on `/sw.js` itself

## Tests

No automated tests. Verification is operational:

1. **Pre-deploy:** Confirm VERSION string has been updated
2. **Post-deploy:** Check DevTools > Application > Service Workers for new SW, check Cache Storage for new versioned caches
3. **Functional:** App boots correctly, console shows no uncaught errors, edge-case warnings appear

## Implementation

### File to Modify

`C:/GrowDoc/sw.js` -- line 23

### Change

```js
// Before:
const VERSION = '2026-04-nc2';

// After:
const VERSION = '2026-04-stab1';
```

This single-line change is sufficient because:
- Cache names are derived from `VERSION` (lines 24-25)
- The `activate` handler deletes non-matching caches (lines 57-67)
- `self.skipWaiting()` takes over without waiting for tabs to close
- `self.clients.claim()` claims existing tabs immediately

### Precache List Review

The `PRECACHE` array (lines 29-43) covers all critical-path assets. The new `error-banner.js` (Section 2) is NOT a critical boot-path module -- it's imported lazily only when errors occur. No changes to PRECACHE needed.

### No Other Files Change

`vercel.json` cache headers for `sw.js` are already correctly configured.

## Deployment

This section's deployment IS the final sprint deploy:

```bash
vercel --prod
```

After deploying, verify in a browser that previously visited the site:

1. Browser fetches `/sw.js` (no-cache header ensures fresh copy)
2. Browser detects version change
3. New SW enters `installing` state, precaches updated files
4. `skipWaiting()` moves to `activated`
5. Old `growdoc-static-2026-04-nc2` and `growdoc-runtime-2026-04-nc2` caches are deleted
6. `clients.claim()` takes over existing tabs
7. On next navigation, users get the fully stabilized codebase

## Checklist

- [ ] All 6 preceding sections merged and deployed
- [ ] Playwright smoke test passes against production
- [ ] Browser-based test suite at `/test` shows all modules passing with 900+ assertions
- [ ] `VERSION` in `sw.js` updated from `'2026-04-nc2'` to `'2026-04-stab1'`
- [ ] `vercel --prod` deploys successfully
- [ ] In a previously-visited browser: new SW active, old caches deleted
- [ ] App boots correctly with sidebar and content visible
