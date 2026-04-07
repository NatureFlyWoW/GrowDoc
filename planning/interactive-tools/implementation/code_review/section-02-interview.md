# Section 02 — Code Review Interview

## Auto-fixes Applied
1. **Falsy-zero bug** (HIGH): Changed `||` to `??` for numeric defaults in getInputs() — prevents 0 values from being silently replaced
2. **Missing null guard** (HIGH): Added `if (!data.lastInputs) return;` in loadState() before accessing properties
3. **DLI advice threshold** (MEDIUM): Changed canopy management advice threshold from <25 to <30 to match plan spec
4. **Focus style** (MEDIUM): Replaced `outline: none` + box-shadow with `outline: 3px solid var(--accent)` for High Contrast Mode compatibility
5. **Console.warn** (MEDIUM): Added console.warn() call when localStorage is unavailable

## Let Go
- Corrupted localStorage export button — raw JSON shown in warning message is sufficient
- Marker drift on window resize — edge case, not blocking
- Input value clamping — HTML5 min/max attributes handle most cases

## User Decisions
- All fixes auto-applied (no tradeoff decisions required)
