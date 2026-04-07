# Usage Guide: Plant Doctor v2

## Quick Start

Open `docs/tool-plant-doctor.html` in a browser (with `docs/plant-doctor-data.js` in the same directory).

The app provides three diagnosis modes:

1. **Wizard Mode** — Step-by-step guided questions. Click answers to walk through the decision tree.
2. **Expert Mode** — All questions displayed as dropdowns. Select answers in any order.
3. **Multi-Dx Mode** — Check symptoms from a grouped list, get ranked differential diagnoses with confidence scores.

## Features

### Three Diagnosis Modes
- **Wizard**: Click through questions one at a time. Good for beginners.
- **Expert**: See all decision points at once. Fast for experienced growers.
- **Multi-Dx**: Select multiple symptoms, get scored differential diagnosis with refining questions.

### Treatment Journal
- After any diagnosis, click **"Save & Start Tracking"** to create a journal entry.
- Select which fix steps you plan to apply.
- Check in later to report progress (much better, somewhat better, no change, getting worse, new symptoms).
- Check-ins trigger re-scoring with updated symptom lists and score changelogs.
- Journal dashboard appears at the starting state of any mode, showing active and recent entries.
- FIFO eviction at 20 entries (oldest resolved first, then oldest overall).

### Notes
- Collapsible "Add notes" textarea on every question step (200 char limit).
- Notes are included in journal entries and displayed in result cards.

### localStorage Persistence
- v2 schema with automatic migration from v1.
- v1 backup preserved for 5 loads after migration.
- Corrupted data recovery with user-visible warning.

## Running Tests

Open the browser console and run:

```js
runTests()
```

Expected output: ~100+ tests passing. All tests are self-contained — state is saved and restored.

Tests cover:
- v1 decision tree traversal and backward compatibility
- Knowledge base data validation (SYMPTOMS, SCORING, REFINE_RULES)
- State machine and mode selector
- Scoring engine (weighted scoring, stage modifiers, corroboration, treatment penalties)
- Notes input and XSS safety
- Multi-Dx flow (symptom selection, diagnosis, refining, results)
- Treatment journal (migration, CRUD, eviction, check-ins, corruption recovery)
- Integration tests (E2E flows, cross-reference validation, edge cases, performance)

## File Structure

```
docs/
├── tool-plant-doctor.html      # Main app (single file: HTML + CSS + JS)
└── plant-doctor-data.js        # SYMPTOMS, SCORING, REFINE_RULES data
```

## Key Functions

| Function | Purpose |
|----------|---------|
| `scoreDiagnoses(symptoms, stage, treated)` | Score all diagnoses against selected symptoms |
| `getRefineQuestions(scores)` | Get adaptive follow-up questions for scored diagnoses |
| `applyRefineAnswer(scores, ruleId, optionIndex)` | Adjust scores based on refine answer |
| `generateCombinedPlan(results)` | Merge fix plans from top diagnoses |
| `saveToJournal()` | Save current diagnosis to treatment journal |
| `loadStateV2()` | Load/migrate localStorage data |
| `createJournalEntry(mode, primaryId, diagnoses, plan, notes)` | Create new journal entry |
| `processCheckIn()` | Process check-in form and re-score |
