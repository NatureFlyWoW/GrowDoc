# Section 2: Error Handling -- Console Logging + Critical Banner

## Overview

This section replaces 15+ empty catch blocks across the codebase with labeled `console.error` calls, and creates a new `error-banner.js` UI component that displays a fixed-position critical error banner when user-visible failures occur (storage quota, boot crash, migration failure). The banner auto-adjusts `#app-shell` padding to avoid occluding content and handles early-boot scenarios where `#app-shell` does not yet exist.

**Depends on:** Section 01 (Remove Top-Level Awaits) -- the async-to-lazy refactoring changes the catch blocks in the 4 engine-importing modules. Those catch blocks must already use the `_getEngine()` pattern before this section adds `console.error` labels to them.

**File coordination with Section 06:** Both sections touch `js/main.js`. This section (02) owns the **boot path and error triggers** (the `boot()` function catch block, the top of file). Section 06 owns the **backup/restore functions and auto-save wiring** (bottom half of the file). Do not modify the auto-save debounce callback or backup/restore functions -- those belong to Section 06.

---

## Tests FIRST

All tests go in `js/components/error-banner.js` as an exported `runTests()` function following the project convention (returns `[{ pass: boolean, msg: string }]`).

### error-banner.js `runTests()`

Each test stub below must be implemented as a real assertion:

1. Call `showCriticalError('test message')`. Assert `document.querySelector('.critical-error-banner')` is not null.
2. Assert banner's text content includes `'test message'`.
3. Assert a dismiss button exists inside the banner (query for a `button` or `.dismiss-btn`).
4. Call `dismissError()`, then assert `document.querySelector('.critical-error-banner')` is null.
5. Assert `document.getElementById('app-shell')?.style.paddingTop` is either empty or `''`.
6. Call `showCriticalError('first')` then `showCriticalError('second')` -- assert only ONE `.critical-error-banner` exists and its text includes `'second'`.
7. Temporarily remove `#app-shell` from DOM (or test in a detached context), call `showCriticalError('no shell')`, assert the banner is a child of `document.body`.
8. After all assertions, remove any remaining `.critical-error-banner` elements and reset `#app-shell` padding.

### Verification via grep (manual verification)

After implementation, these grep commands must return zero matches:

- `grep -rn "catch\s*{" js/ --include="*.js"` -- no empty catch blocks
- `grep -rn "catch\s*(_" js/ --include="*.js"` -- no underscore-suppressed catches

---

## Implementation

### Part A: Replace Empty Catch Blocks with Labeled `console.error`

Walk every `.js` file under `js/` and replace each empty or underscore-only catch block with a labeled `console.error`. The label format is `[module:context]` -- unique enough to locate the exact catch block from a browser console log.

**Files and their catch blocks:**

| File | Line(s) | Label |
|------|---------|-------|
| `js/main.js:38` | `catch { /* engine not ready */ }` | `[main:edge-case-import]` |
| `js/main.js:117` | `catch { /* engine not ready */ }` | `[main:edge-case-timeline]` |
| `js/main.js:347` | `catch { /* ignore */ }` in `_hasBackupKeys` | `[main:backup-check]` |
| `js/components/timeline-bar.js:19` | `catch {}` on engine import | `[timeline-bar:import]` |
| `js/components/timeline-bar.js:232` | `catch { edgeCases = []; }` | `[timeline-bar:edge-cases]` |
| `js/components/task-engine.js:24` | `catch (_importErr)` | `[task-engine:import]` |
| `js/components/task-engine.js:35` | `catch (_e)` | `[task-engine:suppression-init]` |
| `js/components/task-engine.js:160` | `catch (_err)` | `[task-engine:suppression]` |
| `js/components/task-engine.js:303` | `catch (_err) { /* best-effort */ }` | `[task-engine:citation-write]` |
| `js/components/task-engine.js:491` | `catch (_err) { /* best-effort */ }` | `[task-engine:observation-record]` |
| `js/components/task-engine.js:609` | `catch (_err) { /* best-effort */ }` | `[task-engine:observation-record-2]` |
| `js/components/task-engine.js:986` | `catch (_err)` | `[task-engine:run-tests]` |
| `js/components/task-engine-note-guards.js:55` | `catch (_err)` | `[note-guards:observation]` |
| `js/components/task-engine-note-guards.js:214` | `catch { return []; }` | `[note-guards:rule-errors]` |
| `js/components/task-card.js:148` | `catch (_err)` | `[task-card:citation]` |
| `js/plant-doctor/doctor-ui.js:20` | `catch (_importErr)` | `[doctor-ui:import]` |
| `js/plant-doctor/doctor-ui.js:31` | `catch (_e)` | `[doctor-ui:suppression-init]` |
| `js/plant-doctor/doctor-ui.js:537` | `catch (_err)` | `[doctor-ui:suppression]` |
| `js/plant-doctor/doctor-engine.js:50` | `catch (_err)` | `[doctor-engine:note-adjust]` |
| `js/plant-doctor/doctor-engine.js:74` | `catch (_err)` | `[doctor-engine:citation-write]` |
| `js/plant-doctor/doctor-engine.js:135` | `catch (_err)` | `[doctor-engine:observation]` |
| `js/components/parsed-signal-strip.js:77` | `catch (_err)` | `[signal-strip:parse]` |
| `js/components/debug-waterfall.js:39` | `catch {}` | `[debug-waterfall:session-clear]` |
| `js/components/debug-waterfall.js:50` | `catch { index = null; }` | `[debug-waterfall:observation-index]` |
| `js/components/debug-waterfall.js:89` | `catch { tdCtx.textContent = '---'; }` | `[debug-waterfall:context]` |
| `js/components/debug-waterfall.js:99` | `catch { cites = []; }` | `[debug-waterfall:citations]` |
| `js/components/recent-observations-widget.js:34` | `catch { index = null; }` | `[recent-obs:observation-index]` |
| `js/components/strain-picker.js:32` | `catch { return {}; }` | `[strain-picker:load]` |
| `js/views/onboarding.js:152` | `catch {}` | `[onboarding:guard]` |
| `js/views/onboarding.js:738` | `catch { /* handled by store auto-save */ }` | `[onboarding:save]` |
| `js/views/dashboard.js:134` | `catch { /* best-effort */ }` | `[dashboard:observation-record]` |
| `js/views/dashboard.js:179` | `catch (_) { /* fall through */ }` | `[dashboard:status-check]` |
| `js/views/knowledge.js:105` | `catch {}` | `[knowledge:load]` |
| `js/views/knowledge.js:694` | `catch {}` | `[knowledge:deep-dive]` |
| `js/storage.js:60` | `catch {}` (quota retry) | `[storage:save-retry]` |
| `js/storage.js:139` | `catch {}` in `checkCapacity` | `[storage:capacity-read]` |
| `js/storage.js:170` | `catch {}` in `exportAllData` inner parse | `[storage:export-parse]` |
| `js/storage.js:314` | `catch {}` in `checkQuota` | `[storage:quota-read]` |
| `js/storage.js:381` | `catch {}` in `exportAll` inner parse | `[storage:export-all-parse]` |
| `js/storage.js:386` | `catch {}` in `exportAll` outer | `[storage:export-all]` |
| `js/storage.js:403` | `catch {}` in `clearArchive` | `[storage:clear-archive]` |
| `js/router.js:136` | `catch {}` | `[router:hash-parse]` |
| `js/photos.js:34` | `catch {}` | `[photos:load]` |
| `js/photos.js:148` | `catch {}` | `[photos:save]` |
| `js/store.js:95` | `catch {}` | `[store:listener]` |
| `js/store.js:299` | `catch {}` | `[store:test]` |
| `js/migration.js:40` | `catch {}` in `_readLegacyKey` | `[migration:read-legacy]` |
| `js/migration.js:50` | `catch {}` in `_backupLegacyKey` | `[migration:backup-legacy]` |
| `js/data/note-contextualizer/index.js:415` | `catch (_err)` | `[contextualizer:init]` |
| `js/data/note-contextualizer/index.js:453` | `catch { return; }` | `[contextualizer:cure-read]` |
| `js/data/note-contextualizer/index.js:456` | `catch { return; }` | `[contextualizer:cure-parse]` |
| `js/data/note-contextualizer/index.js:523` | `catch { return ''; }` | `[contextualizer:grow-serialize]` |
| `js/data/note-contextualizer/index.js:526` | `catch { return ''; }` | `[contextualizer:profile-serialize]` |
| `js/data/note-contextualizer/index.js:537` | `catch { /* ignore */ }` | `[contextualizer:subscribe]` |
| `js/data/note-contextualizer/rules-advice.js:467` | `catch {}` | `[rules-advice:test]` |
| `js/data/note-contextualizer/rules-score.js:337` | `catch {}` | `[rules-score:test]` |

**Replacement pattern:**

```js
// BEFORE (empty):
} catch { /* engine not ready */ }

// AFTER:
} catch (err) { console.error('[main:edge-case-import]', err); }
```

For catches that already have fallback logic, keep the fallback AND add the log:

```js
// BEFORE:
} catch { edgeCases = []; }

// AFTER:
} catch (err) { console.error('[timeline-bar:edge-cases]', err); edgeCases = []; }
```

**Notes:**
- Catches inside test files are intentional -- leave them alone.
- Some catches already have `console.warn` or `console.error` -- those are fine.
- After Section 01, the `_getEngine()` catches already include `console.error` labels. Verify those are present.

### Part B: Create `js/components/error-banner.js`

Create a new file exporting `showCriticalError(message)`, `dismissError()`, and `runTests()`.

**`showCriticalError(message)`**

1. Check if a `.critical-error-banner` already exists -- if so, remove it first (prevents duplicates).
2. Create a `div` with class `critical-error-banner`.
3. Contents: a warning icon (unicode `\u26A0`), a `span` with the message text, and a dismiss button (text: `\u2715`, class `dismiss-btn`).
4. The dismiss button's click handler calls `dismissError()`.
5. Insert as the first child of `#app-shell`. If `#app-shell` does not exist (early boot), prepend to `document.body` instead.
6. Add `padding-top` to the target container using the banner's `offsetHeight` value.

**`dismissError()`**

1. Find `.critical-error-banner` in the DOM and remove it.
2. Reset `padding-top` on `#app-shell` (or `document.body`) to empty string.

### Part B-CSS: Append Styles to `css/components.css`

```css
/* Critical Error Banner */
.critical-error-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--status-urgent);
  color: #fff;
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.critical-error-banner .dismiss-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
}

.critical-error-banner .dismiss-btn:hover {
  opacity: 0.7;
}
```

Use `var(--status-urgent)` which is `#c0392b` (already in the design system).

### Part C: Wire Triggers

Import `showCriticalError` from `./components/error-banner.js` in the relevant files:

**1. `js/main.js` -- boot() catch block (line ~244)**

```js
} catch (err) {
  console.error('[main:boot]', err);
  showCriticalError('App failed to start -- try reloading');
  showErrorScreen('Something went wrong during startup.');
}
```

**2. `js/main.js` -- debounced auto-save (line ~65)**

This is the **most critical trigger**. Currently the return value of `save()` is discarded:

```js
const debouncedSave = debounce(() => save(key, store.state[key]), 300);
```

Change to:

```js
const debouncedSave = debounce(() => {
  if (!save(key, store.state[key])) {
    showCriticalError('Data save failed -- storage may be full');
  }
}, 300);
```

**File coordination note:** Section 06 also modifies this callback to track `_lastSavedAt`. The combined form:

```js
const debouncedSave = debounce(() => {
  const ok = save(key, store.state[key]);
  if (ok) {
    _lastSavedAt = Date.now();  // Section 06
  } else {
    showCriticalError('Data save failed -- storage may be full');  // Section 02
  }
}, 300);
```

**3. `js/migration.js` -- preInitMigration failure**

```js
} catch (err) {
  console.error('[migration:pre-init]', err);
  showCriticalError('Data migration failed -- your data may need recovery');
}
```

### Registration in Test Runner

After creating `error-banner.js` with `runTests()`, register it in the test runner module list at `js/main.js:~396`:

```js
{ name: 'error-banner', path: './components/error-banner.js' },
```

---

## File Summary

| File | Action |
|------|--------|
| `js/components/error-banner.js` | **CREATE** -- banner component with `showCriticalError`, `dismissError`, `runTests` |
| `css/components.css` | **APPEND** -- `.critical-error-banner` styles |
| `js/main.js` | **MODIFY** -- add `console.error` labels, import `showCriticalError`, wire into `boot()` catch and auto-save |
| `js/components/timeline-bar.js` | **MODIFY** -- add `console.error` labels |
| `js/components/task-engine.js` | **MODIFY** -- add `console.error` labels |
| `js/components/task-engine-note-guards.js` | **MODIFY** -- add `console.error` labels |
| `js/components/task-card.js` | **MODIFY** -- add `console.error` label |
| `js/plant-doctor/doctor-ui.js` | **MODIFY** -- add `console.error` labels |
| `js/plant-doctor/doctor-engine.js` | **MODIFY** -- add `console.error` labels |
| `js/components/parsed-signal-strip.js` | **MODIFY** -- add `console.error` label |
| `js/components/debug-waterfall.js` | **MODIFY** -- add `console.error` labels |
| `js/components/recent-observations-widget.js` | **MODIFY** -- add `console.error` label |
| `js/components/strain-picker.js` | **MODIFY** -- add `console.error` label |
| `js/views/onboarding.js` | **MODIFY** -- add `console.error` labels |
| `js/views/dashboard.js` | **MODIFY** -- add `console.error` labels |
| `js/views/knowledge.js` | **MODIFY** -- add `console.error` labels |
| `js/storage.js` | **MODIFY** -- add `console.error` labels |
| `js/store.js` | **MODIFY** -- add `console.error` labels |
| `js/router.js` | **MODIFY** -- add `console.error` label |
| `js/photos.js` | **MODIFY** -- add `console.error` labels |
| `js/migration.js` | **MODIFY** -- add `console.error` labels, import and wire `showCriticalError` |
| `js/data/note-contextualizer/index.js` | **MODIFY** -- add `console.error` labels |
| `js/data/note-contextualizer/rules-advice.js` | **MODIFY** -- add `console.error` label |
| `js/data/note-contextualizer/rules-score.js` | **MODIFY** -- add `console.error` label |

---

## Implementation Notes (Actual)

### Files created
- `js/components/error-banner.js` — showCriticalError, dismissError, runTests (8 assertions)

### Files modified
- 24 files with catch-block console.error labels (40 blocks total)
- `css/components.css` — .critical-error-banner styles appended
- `js/main.js` — import showCriticalError, wire boot() catch + auto-save failure trigger, register error-banner + doctor-ui in test runner
- `js/migration.js` — import showCriticalError, wire preInitMigration catch

### Deviations from plan
1. XSS prevention: error-banner uses textContent+createElement instead of innerHTML (code review fix)
2. Five labels corrected from plan: task-engine:run-tests→edge-case-suppression, router:hash-parse→profile-check, photos:save→quota-check, rules-advice:test→record-error, rules-score:test→record-error
3. store.js:300 catch inside runTests left empty (intentional test behavior)

### Test count
- error-banner.js runTests: 8 assertions

## Verification Checklist

1. `grep -rn "catch\s*{" js/ --include="*.js"` returns zero matches (except 2 in runTests)
2. `grep -rn "catch\s*(_" js/ --include="*.js"` returns zero matches
3. Every catch block contains a `console.error` call
4. Banner appears when localStorage is full (test by filling storage then triggering a save)
5. Banner is dismissible
6. Banner works when called before `#app-shell` exists (falls back to `document.body`)
7. `/test` route shows error-banner tests passing
