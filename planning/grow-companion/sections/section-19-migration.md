# Section 19: Existing Code Migration

## Overview

This section defines the strategy for transitioning from the current doc-viewer architecture (iframe-based `app.js` + `index.html` that loads standalone tool HTML files) to the new Grow Companion single-page app. The migration covers three areas: file reorganization (parallel deployment), data migration from existing localStorage keys to the companion format, and extraction of the Plant Doctor from its monolithic HTML into ES modules.

This is the final section in the implementation order. It runs after all companion features are built and tested, ensuring the migration has a complete target to migrate into.

**Tech stack:** Vanilla JS. Migration logic runs once on first companion load and sets a flag to prevent re-execution.

---

## Dependencies

- **Section 02 (Store/Storage):** The migration writes to the companion's store format and uses `storage.save()` to persist migrated data. The `storage.migrate()` function and version-based migration infrastructure from Section 02 is the foundation for data migration.

## Blocks

This section does not block any other section. It is the last section to implement. All other sections must be complete before the full migration can be executed.

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `/js/migration.js` | Migration logic: detect old data, transform, import into companion format, set migration flag |
| `/legacy/index.html` | Moved copy of the current `index.html` (doc-viewer app) |
| `/legacy/app.js` | Moved copy of the current `app.js` |

### Existing Files Affected

| File | Change |
|------|--------|
| `/index.html` | Replaced by the companion app shell (Section 01) |
| `/app.js` | Moved to `/legacy/app.js` |
| `/admin.html`, `/admin.js`, `/admin.css` | Moved to `/legacy/` |
| `/docs/tool-plant-doctor.html` | Remains in place (used as extraction source, kept for reference) |
| `/docs/tool-stealth-audit.html` | Remains in place (used by iframe embed in Section 17) |

---

## Tests (Implement First)

### Data Migration Tests

- **Plant Doctor data imported:** existing `growdoc-plant-doctor` localStorage key data is correctly transformed and imported into the companion's `grow.plants[].diagnoses` format (diagnosis IDs, timestamps, and outcomes are preserved)
- **Cure tracker data imported:** existing `growdoc-cure-tracker` localStorage key data maps correctly to the companion's dry/cure stage data format (jar entries, burp counts, RH readings are converted to stage log entries)
- **Env dashboard data imported:** existing `growdoc-env-dashboard` localStorage key data (last temperature, humidity, and VPD inputs) is imported as the most recent entry in `environment.readings`
- **Profile data imported:** existing `growdoc-grow-profile` localStorage key data (medium, lighting selections) is imported into `store.state.profile.medium` and `store.state.profile.lighting`
- **Backup preservation:** after migration, the original localStorage keys (`growdoc-plant-doctor`, `growdoc-grow-profile`, `growdoc-plants`, `growdoc-cure-tracker`, `growdoc-env-dashboard`) are still present and unmodified (they are NOT deleted)
- **Migration flag:** after successful migration, a `growdoc-companion-migrated` flag is set in localStorage with a timestamp
- **No re-run:** if the `growdoc-companion-migrated` flag exists, the migration logic does not execute again (prevents double-import)
- **Corrupted data fallback:** if migration encounters corrupted or unparseable data in any old key, it logs a warning, skips that key, and continues with the remaining keys. The error recovery screen is shown with options to restore or start fresh.

---

## Implementation Details

### Phase 1: Parallel Deployment (File Reorganization)

The new companion app is deployed alongside the existing doc-viewer architecture. This allows a gradual transition with rollback capability.

**File moves:**

1. The current `index.html` (doc-viewer app shell with iframe-based navigation) is moved to `/legacy/index.html`
2. The current `app.js` (doc-viewer app logic) is moved to `/legacy/app.js`
3. The current `admin.html`, `admin.js`, `admin.css` are moved to `/legacy/`
4. The new companion `index.html` (Section 01 app shell) takes over the root `/index.html` position
5. All existing `/docs/*.html` tool files remain in place -- they are still needed by:
   - The Stealth Audit iframe embed (`/docs/tool-stealth-audit.html`)
   - The Plant Doctor as a reference during extraction
   - Any direct URL bookmarks users may have

**Vercel routing update:**

The `vercel.json` SPA rewrite rule (from Section 01) routes all non-static, non-API paths to the new companion `index.html`. The `/legacy/*` path is excluded from rewrites, so the old doc-viewer remains accessible at `/legacy/index.html` as a fallback.

```json
{
  "rewrites": [
    { "source": "/((?!api|legacy|assets|css|js|docs).*)", "destination": "/index.html" }
  ]
}
```

**Rollback strategy:** If the companion has critical issues after deployment, the rollback is:
1. Swap `index.html` and `/legacy/index.html` back
2. The old app.js-based doc-viewer resumes as the primary interface
3. No data loss -- the companion's `growdoc-companion-*` keys are separate from the old app's keys

### Phase 2: Data Migration

On first load of the companion app, the migration module checks for existing data from the old tools and imports it into the companion's format.

**Migration entry point:**

```javascript
/**
 * migration.js
 *
 * runMigration(store) -- Execute the full migration sequence.
 *   Called once during app initialization (main.js) AFTER the store
 *   is initialized but BEFORE the first view renders.
 *
 *   Steps:
 *   1. Check for growdoc-companion-migrated flag -- if exists, return early
 *   2. Detect existing old keys in localStorage
 *   3. For each detected key, run the corresponding import function
 *   4. On success: set growdoc-companion-migrated flag with timestamp
 *   5. On failure: log error, show recovery screen, do NOT set flag
 *      (so migration can be retried)
 */
export function runMigration(store) { /* ... */ }
```

**Key-by-key migration:**

Each old localStorage key has a dedicated import function. All import functions are fail-safe -- if one fails, the others still run.

```javascript
/**
 * migrateGrowProfile(store) -- Import from growdoc-grow-profile key.
 *   Maps: medium -> profile.medium
 *         lighting -> profile.lighting
 *         experience -> profile.experience (if present)
 *   Returns: { success: Boolean, warnings: String[] }
 *
 * migratePlantDoctor(store) -- Import from growdoc-plant-doctor key.
 *   The old Plant Doctor stores:
 *   - Diagnosis history (past diagnoses with symptoms, results, timestamps)
 *   - Journal entries (user notes from the diagnostic process)
 *   Maps to: grow.plants[].diagnoses (if plants exist) or a pending
 *   migration queue (applied when the first grow is created)
 *   Returns: { success: Boolean, warnings: String[] }
 *
 * migratePlants(store) -- Import from growdoc-plants key.
 *   The old app may store plant names and dates.
 *   Maps to: grow.plants[] entries with name, startDate.
 *   Returns: { success: Boolean, warnings: String[] }
 *
 * migrateCureTracker(store) -- Import from growdoc-cure-tracker key.
 *   The Cure Tracker stores jar entries with:
 *   - Date, jar RH, smell assessment, burp count
 *   Maps to: plant log entries for plants in the cure stage
 *   Returns: { success: Boolean, warnings: String[] }
 *
 * migrateEnvDashboard(store) -- Import from growdoc-env-dashboard key.
 *   The Env Dashboard stores last-used inputs:
 *   - Temperature, humidity, VPD values
 *   Maps to: environment.readings (single most-recent entry)
 *   Returns: { success: Boolean, warnings: String[] }
 */
```

**Data transformation details:**

1. **growdoc-grow-profile -> profile:**
   - Direct field mapping for medium and lighting values
   - Validate that medium is one of: soil, coco, hydro, soilless
   - Validate that lighting is one of: led, hps, cfl, fluorescent
   - If values are invalid or missing, skip with a warning (user can set them in settings)

2. **growdoc-plant-doctor -> diagnoses:**
   - Parse the stored diagnosis history array
   - Each old diagnosis entry maps to a `grow.plants[].diagnoses` entry:
     - `diagnosisId`: map old diagnosis name to new SCORING key ID
     - `timestamp`: preserve original timestamp
     - `confidence`: preserve if available, default to 0 if not
     - `treatment`: preserve treatment text
     - `outcome`: default to 'pending' (outcomes from the old tool are not tracked)
   - If no active plants exist yet (user has not completed onboarding), store the diagnoses in a `_pendingMigration` key. Apply them to plants when the first grow is created.

3. **growdoc-plants -> plants:**
   - Parse stored plant names and creation dates
   - Create plant entries in `grow.plants[]` with:
     - `name`: sanitized via escapeHtml
     - `id`: generated UUID
     - `stage`: default to the profile's current stage if available, or 'early-veg'
     - `stageStartDate`: use the plant's creation date or today
     - `logs`: empty array
     - `diagnoses`: empty array (or merged with migrated Plant Doctor data)

4. **growdoc-cure-tracker -> dry/cure logs:**
   - Parse stored jar entries (date, RH, smell, burp count)
   - Convert to plant log entries:
     - `type`: 'observed'
     - `details`: { jarRH, smellAssessment, burpCount }
     - `timestamp`: original date
   - Attach to the first plant in the cure stage, or store as pending if no plant is in cure

5. **growdoc-env-dashboard -> environment readings:**
   - Parse last-used temperature, humidity, VPD values
   - Create a single entry in `environment.readings`:
     - `date`: today (exact timestamp not available from old format)
     - `tempHigh`: parsed temperature
     - `tempLow`: temperature minus a reasonable differential (3-5 degrees)
     - `rhHigh`: parsed humidity
     - `rhLow`: humidity minus a reasonable differential (5-10%)
     - `vpdDay`: parsed VPD or recalculated from temp/RH

### Phase 3: Plant Doctor Extraction

The extraction of Plant Doctor logic from the monolithic HTML into ES modules is detailed in Section 15. This migration section covers the coordination:

1. The data extraction (SYMPTOMS, SCORING, REFINE_RULES) is done during Section 15 implementation
2. The old `/docs/tool-plant-doctor.html` file remains in place after extraction -- it is not deleted
3. The companion's Plant Doctor view (`/tools/doctor`) uses the extracted modules
4. The standalone HTML file can still be accessed directly at `/docs/tool-plant-doctor.html` for comparison/fallback during the transition period
5. Once the companion's Plant Doctor is verified to have feature parity and all 165+ tests pass, the standalone file can optionally be archived to `/legacy/tool-plant-doctor.html`

### Error Recovery During Migration

If any import function throws an error or encounters unparseable data:

1. The error is caught and logged to console with full details
2. A `warnings` array accumulates all non-fatal issues
3. The migration continues with remaining keys (one failed key does not block others)
4. After all keys are attempted, if any had fatal errors:
   - The migration flag is NOT set (allowing retry)
   - The error recovery screen from Section 01 is displayed with:
     - A summary of what migrated successfully and what failed
     - "Try again" button (re-runs migration)
     - "Skip migration" button (sets the flag and starts fresh, old data preserved as-is)
     - "Export old data" button (attempts to download the raw old keys as JSON)
5. If all imports succeeded (even with non-fatal warnings):
   - The migration flag is set
   - A one-time "Migration complete" banner shows on the dashboard with a summary of imported data
   - Warnings are displayed in the banner (e.g., "2 old diagnosis entries had invalid dates and were skipped")

```javascript
/**
 * showMigrationResult(container, results) -- Display migration outcome.
 *   results: {
 *     success: Boolean,
 *     imported: { profile: Boolean, plants: Number, diagnoses: Number,
 *                 cureEntries: Number, envReadings: Number },
 *     warnings: String[],
 *     errors: String[]
 *   }
 *   If success: show green banner with import counts
 *   If partial: show gold banner with import counts + warnings
 *   If failed: show error recovery screen with retry/skip/export options
 */
```

### Migration Flag

The migration flag is a simple localStorage entry:

```javascript
// Key: growdoc-companion-migrated
// Value: JSON string
{
  version: 1,
  timestamp: '2026-04-08T12:00:00Z',
  imported: {
    profile: true,
    plants: 3,
    diagnoses: 5,
    cureEntries: 12,
    envReadings: 1
  }
}
```

The flag includes metadata about what was imported, useful for debugging if users report missing data.

### Old Key Preservation

After migration, ALL original localStorage keys are preserved untouched. The migration READS from old keys but never WRITES to or DELETES them. This ensures:

- If the companion has issues, the old doc-viewer at `/legacy/index.html` still has its data
- If migration produced incorrect results, the old data can be re-read for a corrected migration
- Users can manually compare old and new data if needed
- The only cost is ~1-2MB of duplicate data in localStorage, which is acceptable given the 5MB budget

---

## Implementation Checklist

1. Write migration test: Plant Doctor localStorage data imported correctly
2. Write migration test: cure tracker data maps to companion dry/cure format
3. Write migration test: env dashboard last inputs imported
4. Write migration test: profile medium and lighting imported
5. Write migration test: original keys preserved as backup after migration
6. Write migration test: migration flag prevents re-running
7. Write migration test: corrupted data triggers graceful fallback (error recovery screen)
8. Move current `index.html` to `/legacy/index.html`
9. Move current `app.js` to `/legacy/app.js`
10. Move `admin.html`, `admin.js`, `admin.css` to `/legacy/`
11. Verify the new companion `index.html` (from Section 01) is at the root
12. Verify `vercel.json` SPA rewrites exclude `/legacy/*` and `/docs/*`
13. Create `/js/migration.js` with `runMigration()` entry point
14. Implement `migrateGrowProfile()` with field mapping and validation
15. Implement `migratePlantDoctor()` with diagnosis history transformation
16. Implement `migratePlants()` with plant name/date import
17. Implement `migrateCureTracker()` with jar entry to log entry conversion
18. Implement `migrateEnvDashboard()` with temperature/humidity/VPD import
19. Implement pending migration queue for data that arrives before onboarding completes
20. Implement migration flag setting with metadata (timestamp, import counts)
21. Implement error recovery flow (catch per-key, accumulate warnings, show result screen)
22. Implement `showMigrationResult()` banner/screen
23. Wire `runMigration()` into `main.js` initialization (after store init, before first render)
24. Run all migration tests with mock localStorage data and verify passing
25. Test with real existing localStorage data from Plant Doctor v3
26. Test rollback: verify old doc-viewer at `/legacy/index.html` still works with original data
27. Test migration of empty/missing keys (no old data exists -- migration completes silently)
28. Test migration with partially corrupted data (one key valid, one key corrupt)
29. Deploy to Vercel and verify parallel deployment works (companion at `/`, legacy at `/legacy/`)
