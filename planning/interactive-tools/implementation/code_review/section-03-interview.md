# Section 03 — Code Review Interview

## Auto-fixes Applied
1. **resetAudit() persists state** (MEDIUM): Removed `persistState()` from reset — plan says "No save"
2. **saveAudit() debounced write** (MEDIUM): Changed to immediate `localStorage.setItem()` for explicit user save action
3. **Test pollution** (LOW): Tests now save/restore `state` and `localStorage` before/after mutations

## Let Go
- Corrupted data export button — warning message with raw JSON is sufficient for a checklist tool
- `var` vs `let/const` — consistent style choice, no hoisting bugs present
- History cap test approach — tests the logic correctly even if indirectly
- `aria-expanded` on dual history toggles — minor, both work functionally
- Version migration code — YAGNI
- All-N/A dual behavior — matches plan spec exactly

## User Decisions
- All fixes auto-applied (no tradeoff decisions required)
