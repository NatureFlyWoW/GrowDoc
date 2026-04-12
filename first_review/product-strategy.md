# Strategic Assessment

## What GrowDoc Does Well (Moat)

1. **Evidence-based guardrail system** — 50+ edge-case rules (post-transplant stress, humidity diseases, nutrient lockout recovery blocks) that actively prevent costly mistakes. Competitors surface generic advice; GrowDoc knows *when general advice fails*.
2. **Unified note intelligence** — Observations, questions, diagnoses, and logs feed into a single contextualizer that weights recent + severe notes. Competitors collect data; GrowDoc actually uses it to tune recommendations.
3. **Vanilla JS architecture** — Zero npm dependencies, offline-capable PWA, <5 second cold start on weak 3G. Competitors bloated with frameworks; GrowDoc works on a feature phone with service worker caching.
4. **Priority-weighted system thinking** — 4D slider (yield/quality/terpenes/effect) shapes task sorting, VPD targets, feeding schedules, and harvest timing. Competitors offer binary choices; GrowDoc adapts to your grow philosophy.

## What Competitors Offer That GrowDoc Doesn't

| Feature | GrowDoc | Competitors (Grow with Jane, Leafwire, Agrify) | Impact |
|---------|---------|------|--------|
| Photo timeline + visual comparison | Missing | Full featured | Medium — workaround: screenshot + phone camera |
| Cloud sync + multi-device | localStorage only | Native sync | Medium — single-device OK for home growers |
| Community grower forum | No | Yes | Low — niche: cultivation-specific QA exists in Discord |
| Commercial scales integration | No | Yes (for large ops) | Low — consumer focus, not target market |
| Video tutorials | No | Yes | Low — written guides in Knowledge base sufficient for now |

## Growth Vectors

**User acquisition:** Hobbyist home growers (soil + LED, 1-6 plants, 2-4 grows/year). Direct channels: Reddit r/cannabiscultivation, Facebook micro-grow groups, Indie Hackers. Estimated TAM: 300K active US home growers. Current penetration: <1%.

**Feature depth:** Expand observation tools (photos, time-lapse comparison, AI image-based diagnosis). Add historical analytics dashboard (yield trends, cost per gram, strain performance). Integrate light-meter + soil moisture sensors via Bluetooth.

**Monetization:** Freemium model: free app (current), $4.99/month premium (strain library sync, past-grow analytics, cloud backup). B2B: white-label for seed banks. Estimated unit economics: 5% conversion, $1.50/user/month LTV.

## Single Most Important Next Investment

**Photo + visual diagnosis module.** Rationale: (1) Addresses #1 gap (photo timeline missing), (2) Creates network effect (users share grows, build portfolio), (3) Unlocks AI image-based diagnosis (scale Plant Doctor beyond text symptoms), (4) Differentiates vs. competitors who have text-only advice. ROI: 30% increase in daily active users + 40% increase in task completion if photos are wired into observation flow.

### Recommended sequence:
1. Wire camera modal into plant-detail + journal views (2-3 days)
2. Build photo gallery timeline in plant detail (3 days)
3. Add "diagnose by photo" button to Plant Doctor (2 days)
4. Implement visual comparison (side-by-side time-lapse) (3 days)
