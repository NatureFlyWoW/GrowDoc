# Critical Untested Paths — Top 10

Ranked by consequence of undetected failure.

---

## 1. `api/_lib/auth.js` — JWT sign/verify + scrypt password check

**Risk:** Authentication bypass. If `verifyPassword` or `signToken`/`verifyToken` regresses, any user can access admin endpoints or tokens stop working entirely.
**Test shape:** Unit-test scrypt hash roundtrip; assert `verifyToken(signToken(payload)).userId === payload.userId`; assert expired tokens are rejected.

---

## 2. `api/save.js` — GitHub commit write path

**Risk:** Data loss or silent corruption. The save endpoint commits to GitHub as the database. A regression here means grow logs are silently dropped or overwritten due to SHA conflict mishandling.
**Test shape:** Mock `github.js` client; assert correct SHA is passed; assert `FILE_NAME_RE` rejects path traversal inputs like `../../etc/passwd`; assert 409 conflict path returns updated SHA.

---

## 3. `js/components/log-form.js` — Note submission + severity assignment

**Risk:** Every note enters the system through this form. If the submit handler fails to attach severity or `details.notes`, the entire note-contextualizer pipeline receives malformed input silently.
**Test shape:** Render form in test DOM, fill textarea, fire submit, assert emitted log object has `{ type, timestamp, details: { notes, severity } }` shape.

---

## 4. `js/components/trichome-sliders.js` — Trichome ratio input feeding harvest advisor

**Risk:** `getHarvestRecommendation` is well-tested with constructed trichome ratios, but if the sliders emit wrong `{clear, milky, amber}` values (e.g., sum > 100, negative values), the recommendation silently computes on bad data.
**Test shape:** Render sliders, drag/set values, assert emitted ratio sums to 100 and each component is within [0, 100].

---

## 5. `js/data/edge-case-engine.js:runTests()` — Incompatible with runner

**Risk:** The 7 existing tests use a throw-on-fail pattern that causes the test runner to emit `ERROR edge-case-engine` and count 1 failure. The tests themselves are sound but are invisible to the pass/fail score. Edge-case suppression of feed/training tasks is not reflected in runner results.
**Test shape (fix):** Wrap the existing tests in `{pass,msg}[]` format and add the module to `main.js:396`.

---

## 6. `js/views/plant-detail.js` — Plant-level log add flow

**Risk:** This is the main interaction surface. Any breakage in the log-save → store-commit → contextualizer-rebuild pipeline is not caught. The recent async/await fixes (`fix: dashboard crashed because generateTasks became async`) indicate this area has regressed before.
**Test shape:** Create store with plant, render plant-detail, simulate adding a log, assert `store.state.grow.plants[0].logs.length === 1` and observation index rebuilds.

---

## 7. `js/views/harvest.js` + `finish.js` — Stage transition to drying/curing

**Risk:** Advancing to drying/curing triggers cure-tracker initialization and stops task generation. A broken transition leaves the plant stuck in an inconsistent stage.
**Test shape:** Call `advancePlantStage(store, plantId, 'drying')`, assert `stage === 'drying'`, assert `stage:changed` event fires, assert cure-tracker localStorage is initialized.

---

## 8. `js/data/calculators.js` — Exposed calculator math

**Risk:** EC/pH/VPD/DLI calculators surface recommendations directly to growers. Incorrect math causes wrong grow decisions. Currently zero tests.
**Test shape:** Import each calculator function, assert known input→output pairs (e.g., VPD formula matches vpd-widget tests as a cross-check).

---

## 9. `js/storage.js` migration path for `grow` schema

**Risk:** The storage module has migration tests for synthetic keys, but the real `grow` schema migration (which runs on first load after an update) is untested. A broken migration silently wipes all plant data.
**Test shape:** Seed `localStorage` with a v0 grow object, call `load('grow')`, assert migrated result has expected v-current shape and all plants are preserved.

---

## 10. `api/_lib/github.js` — Conflict detection (SHA mismatch → retry)

**Risk:** The CLAUDE.md critical rule is "optimistic concurrency via SHA-based conflict detection." If `getFile`, `createOrUpdateFile` regresses under concurrent saves, two simultaneous saves silently lose one commit.
**Test shape:** Mock the GitHub REST API, call `createOrUpdateFile` with a stale SHA, assert the 409 response is surfaced correctly to `save.js` caller rather than swallowed.
