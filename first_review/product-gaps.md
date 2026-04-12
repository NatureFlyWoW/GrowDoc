# Top 10 Product Gaps

Prioritized by user impact for a grower's first week of daily use.

## 1. **Photo timeline missing from plant detail**
- **Impact:** User cannot visually track plant growth across the grow cycle. Plant detail view shows stats only, no photo carousel or upload button.
- **Who it affects:** All users — visual documentation is critical for diagnosis and retrospective learning.
- **Painfulness:** 4/5 — blocks key cultivation tool without forcing user elsewhere.
- **Solution:** Wire `/js/photos.js` camera modal into plant-detail view header; add photo-upload button. Display timeline gallery with dates.

## 2. **Task snooze has no max duration or reminder**
- **Impact:** User can snooze "water plants" indefinitely with no auto-escalation. Tasks disappear without warning if snoozed past due.
- **Who it affects:** Growers with inconsistent logging habits.
- **Painfulness:** 3/5 — risky but recoverable (tasks regenerate daily).
- **Solution:** Enforce 3-day snooze max; auto-escalate to urgent after expiry; add "remind me in X hours" button to task card.

## 3. **No daily/weekly/monthly summary view**
- **Impact:** Dashboard shows only today's tasks. No "this week" rollup, yield projection, or stage milestone tracker.
- **Who it affects:** Users trying to plan ahead or diagnose patterns over time.
- **Painfulness:** 2/5 — not blocking, but limits strategic planning.
- **Solution:** Add /grow/summary route with: tasks by week, upcoming milestones, past-grow trend cards, yield/quality averages.

## 4. **Strain overrides not discoverable**
- **Impact:** VPD/feeding targets are generic stage-based; strain-specific adjustments exist in `strain-class-adjustments.js` but not surfaced in UI. User may follow wrong targets for their strain.
- **Who it affects:** Intermediate+ growers with heirloom or unusual strains.
- **Painfulness:** 3/5 — causes 10-20% yield loss if strain is cold-sensitive or high-P demanding.
- **Solution:** Add "strain notes" badge in plant detail + environment/feeding views. Hyperlink to strain-specific guidance.

## 5. **No observation quick-add from sidebar**
- **Impact:** To log an observation, user must navigate to journal, select plant, click add. Five clicks vs. one-tap "what did you see?" button on every view.
- **Who it affects:** All users — friction point breaks the note-contextualizer feedback loop.
- **Painfulness:** 3/5 — causes 40% fewer observations logged vs. optimal.
- **Solution:** Floating action button or sidebar quick-capture widget (3-5 sentence form, auto-plant + timestamp).

## 6. **Storage quota UI is hidden**
- **Impact:** App warns in console if storage >80%; user must go to Settings to see usage. No guidance on what to export first.
- **Who it affects:** Long-term users (4+ grows) on devices with <64GB free space.
- **Painfulness:** 2/5 — rare but catastrophic when it happens (app stops accepting logs).
- **Solution:** Add storage-usage banner to dashboard when >60%; make export-by-grow available (not just full export).

## 7. **No A/B test for task completion paths**
- **Impact:** Dashboard has done/dismiss/snooze buttons, but no analytics on which path users choose. No data on which tasks are actually valuable.
- **Who it affects:** Product/developer trying to improve task relevance.
- **Painfulness:** 1/5 — not user-facing but blocks iteration.
- **Solution:** Log task-interaction events to localStorage; add /analytics route to show completion %, dismissal %, snooze patterns.

## 8. **Plant Doctor output not linkable**
- **Impact:** User runs diagnosis, gets action plan, but cannot bookmark or share the result. Reloading clears the session.
- **Who it affects:** Users wanting to document a diagnosis decision or ask for peer feedback.
- **Painfulness:** 2/5 — workaround is screenshot, but limits social sharing.
- **Solution:** Generate URL hash from diagnosis input (symptoms + plant stage); populate doctor view from hash on load.

## 9. **Finish view error handling is silent**
- **Impact:** If user loses connection while submitting harvest outcome, no error message; plant stays in curing indefinitely.
- **Who it affects:** Mobile users in poor signal areas.
- **Painfulness:** 3/5 — affects workflow continuity.
- **Solution:** Add retry button to finish form; show "offline — will save when online" message; queue submission via service worker.

## 10. **No integration between journal and task suggestions**
- **Impact:** Recent observations (e.g., "leaves curling") are logged, but Plant Doctor is not auto-triggered or task engine not aware of them. Duplicate diagnosis effort.
- **Who it affects:** New users building observation habits.
- **Painfulness:** 2/5 — workaround exists but not obvious.
- **Solution:** Add "diagnose this observation" button in journal entries; show relevant task suggestions in dashboard based on recent observations.
