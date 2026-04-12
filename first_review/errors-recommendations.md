# Top 10 Error-Handling Improvements

Ranked by worst silent failure prevented.

---

**1. Log suppressed import errors in all four edge-case-engine catch blocks**
Files: `main.js:38`, `task-engine.js:24`, `doctor-ui.js:18`, `timeline-bar.js:18`
Change empty/comment-only catches to `console.warn('[edge-case-engine] load failed:', _importErr)`.
Prevents: A real broken engine (syntax error, missing transitive dep) masquerading as "not ready" indefinitely. Currently zero console output distinguishes the two cases.

**2. Check the return value of `save()` and notify the user**
File: `main.js:65` (debounced save subscriber)
Change: `const ok = save(key, ...); if (!ok) { /* dispatch a UI toast or set a store flag */ }`.
Prevents: Silent data loss on quota overflow — user's grow data is not persisted and they reload to an older state with no warning.

**3. Add a version counter to store commits and validate it on getSnapshot+commit round-trips**
File: `store.js` commit path; callers in `dashboard.js:385-405`, `dashboard.js:44-56`
Change: Stamp a `_rev` counter on each commit; callers that do getSnapshot-mutate-commit check that `_rev` hasn't advanced before writing. Reject or merge if it has.
Prevents: The concurrent snapshot overwrite in `_updateTask` / `generateTasks` that silently drops task completions and stats.

**4. Make `preInitMigration` atomic or write a partial-completion flag per key**
File: `migration.js:197-203`
Change: Before the write loop, set a `growdoc-migration-in-progress` flag; clear it only after V2_FLAG is set. On boot, if the in-progress flag is found, roll back using the backup keys.
Prevents: Half-migrated state on crash mid-loop that leaves grow and profile from different versions.

**5. Fix the backup namespace inconsistency between migration.js and main.js**
Files: `migration.js:48`, `main.js:341-348`
Change: Align both to use the same prefix (`growdoc-companion-backup-`). Currently `_hasBackupKeys()` in `showErrorScreen` will never find migration-phase backups, making the "Restore Backup" button useless after a migration-time crash.
Prevents: Users losing all data in the exact scenario (crash during migration) where backup restore is most needed.

**6. Guard `applyDoctorSuppression` against stale DOM in the `.then` callback**
File: `doctor-ui.js:254`
Change: Capture a generation counter before the async call; in the `.then` check that `resultsArea` is still attached and the counter hasn't changed before appending `planSection`.
Prevents: Action-plan DOM appended to a detached/re-rendered results area when the user changes symptom selection while the Promise is in flight — produces duplicate or orphaned DOM nodes.

**7. Log `_tryLoadV3Data` failures and guard against double-invocation race**
File: `doctor-ui.js:371-375`
Change: Set `_v3Loaded = true` at the *start* of the try block (before the await), not at the end. Log failures via `console.warn`. Current code has a narrow race where two concurrent renders both see `_v3Loaded === false` and both attempt the import.
Prevents: Double setDiagnosticData calls overwriting each other; and failures that leave the doctor silently running on core-only data with no indication.

**8. Replace empty `catch {}` in `_backupLegacyKey` with a logged warning**
File: `migration.js:45-51`
Change: `catch (err) { console.warn('Legacy backup failed for key', key, err); }`.
Prevents: Silent backup failure before a destructive migration write — the only safety net is silently absent and users can't know until they try to restore.

**9. Add `minSeverity` filter enforcement in `collectObservations` `opts.domains` path**
File: `note-contextualizer/index.js:430-433`
Change: The `opts.domains` filter currently returns `[]` for all section-01 observations because domains are empty until `parseObservation` runs. Callers passing `domains` to `collectObservations` before parsing silently get empty results with no error or warning. Add a `console.warn` when domains filter is applied to unparsed observations.
Prevents: Silent empty observation sets in components that filter by domain before the parse pipeline runs.

**10. Validate `docs` array entries for duplicate `id` and `file` values in `api/save.js`**
File: `api/save.js:25-38`
Change: After existing field validation, add a duplicate-id and duplicate-file check: `new Set(docs.map(d => d.id)).size !== docs.length` → 400 error.
Prevents: `docs.json` being committed with duplicate entries, which would cause the viewer to silently render one entry twice and skip another, with no runtime error on the client.
