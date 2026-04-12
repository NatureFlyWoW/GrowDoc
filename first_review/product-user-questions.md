# Questions for the User

Strategic questions to refine roadmap recommendations.

## Vision & Product Direction

1. **End-state vision:** Is GrowDoc a *daily tool for an active grow* (like a pilot checklist), a *retrospective learning log* (grow journal + analytics), or *both equally*? This changes feature priority fundamentally.

2. **Target user evolution:** You've built for the hobbyist solo grower. Should we expand to: (a) small commercial (5-20 plants in a tent/room), (b) multi-grower households (partner + kids learning), (c) mentor-mentee pairs (experienced grower coaching a novice)?

3. **Monetization intent:** Is this a passion project, a portfolio piece, or a business? If business: are you funding development yourself, seeking investment, or planning to bootstrap through premium features?

4. **Offline-first philosophy:** The PWA + localStorage design is deliberate. Is this a hard constraint (e.g., privacy, reliability) or would cloud sync + real-time multi-device become valuable later?

## Priorities & Constraints

5. **Time/resource allocation:** Are you the sole developer? If you could add one person (designer, engineer, cannabis expert), who first and why?

6. **Platform priorities:** Mobile-first (app on phone in tent) vs. desktop-first (planning at desk)? The responsive design works both, but interaction patterns differ.

7. **Feature freeze or continuous iteration?** Should we stabilize the current feature set (bug fixes, UX polish only) or keep shipping new features aggressively?

8. **Competing with free vs. premium:** Would you consider a freemium model (free: core companion, paid: photo analytics + multi-device sync)? Or stay 100% free?

## User Research & Feedback

9. **Current user base:** How many active users? Are they giving feedback? What's the #1 request you hear in the last month?

10. **Geographic scope:** Are you optimizing for US/Canada only, or should localization (EU strain names, metric defaults) be on the roadmap?

11. **Use case patterns:** Do users run this app *during* a grow (daily checklist mode) or *after* (retrospective journaling)? Mix of both?

12. **Churn risk:** Have any early users stopped using it? If so, why — better tool found, grow ended, privacy concerns, too hard to use?

## Technical & Knowledge Gaps

13. **Cannabis cultivation expertise:** Do you have direct growing experience, or are you relying on research + Franco/Professor agents? (Affects confidence in edge-case rule quality.)

14. **Mobile photo pipeline:** You have a camera modal (`photos.js`) but it's not integrated. Is this a known debt or deprioritized? Why?

15. **Data export demand:** Have users asked for CSV export, multi-grow analytics, or cloud backup? Or is localStorage export enough?

16. **Strain data freshness:** The strain database has 200+ strains. How often do you refresh it? Should this be crowdsourced (user contributions)?

## Roadmap Clarity

17. **Next 3 months:** What's *already committed* to build? (e.g., sections in planning/ docs suggest structured plans.)

18. **Competitive landscape:** Have you tracked what Grow with Jane, Leafwire, or other competitors shipped recently? Any feature that surprised you or feels urgent to match?

19. **Success metrics:** What does "success" look like in 6 months? (e.g., 1K users, 10K GitHub stars, feature parity with competitor X, sustainable monetization?)

20. **Known risks:** What's the biggest assumption that could be wrong? (e.g., "users will log observations daily" — are they?)
