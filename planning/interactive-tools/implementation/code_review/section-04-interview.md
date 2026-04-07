# Section 04 — Code Review Interview

## Auto-fixes Applied
1. **XSS via innerHTML** (CRITICAL): Added `escapeHtml()` utility, applied to all user-controlled content (notes, smell) rendered into innerHTML
2. **parseFloat + ?? returning NaN** (CRITICAL): Added `safeFloat()` helper that returns fallback for NaN, replacing broken `?? 0` pattern
3. **DST-safe date arithmetic** (LOW): Added `addDays()` helper using `setDate()` pattern, replaced all `86400000` ms multiplication
4. **Space key on timeline** (MEDIUM): Added Space key handler alongside Enter for keyboard accessibility on timeline day items

## Let Go
- Focus management on phase transitions — aria-live="polite" covers announcements
- No curingStartDate — plan doesn't include it, getCureWeek works reasonably with log-based calculation
- Corrupted data export button — warning message is sufficient
- storageAvailable flag dead code — try/catch handles gracefully
- Test gap for startNewHarvest via confirm — known limitation of confirm() dialog
- Missing `day` field in curing log entries — minor omission from plan model
- copySummary using alert() — acceptable for simple tool
- Accordion aria-controls — minor WCAG pattern gap

## User Decisions
- All fixes auto-applied (no tradeoff decisions required)
