# Plant Doctor v3 Interview Transcript

## Q1: Growing medium question placement and behavior
**Q:** For the growing medium question, should it be mandatory (blocking progress until answered) or optional with a sensible default? And should it appear BEFORE the growth stage question or after it?
**A:** Mandatory, ask first (before stage). Medium first — it affects everything including stage interpretation.

## Q2: VPD integration depth
**Q:** For VPD integration (item 6), the research shows we need temp + RH to calculate VPD. How deep should this go in the diagnostic flow?
**A:** Lightweight: just ask temp+RH in context notes. Prompt users to include temp/RH in the notes field, surface guidance text. No VPD calculation built in.

## Q3: Hermie urgency UX
**Q:** The hermie detection path needs to be urgent/time-critical in the UI. How should urgency be communicated beyond the standard severity badge?
**A:** Red alert banner + action timeline. Distinct red banner at top of result card saying 'TIME-SENSITIVE — act within 24h' with a countdown-style urgency indicator.

## Q4: Pest diagnostic path accessibility
**Q:** For the new pest diagnostic paths (broad mites, thrips, gnats, bud rot), should they be reachable ONLY through Multi-Dx mode scoring, or also through the Wizard decision tree with dedicated question branches?
**A:** Both Wizard + Multi-Dx (Recommended). Add wizard branches for pest symptoms AND scoring entries. More accessible but increases tree size.

## Q5: Ca mobility fix — rerouting destination
**Q:** The Ca mobility fix requires rerouting the 'lower leaf brown spots' wizard path. Currently it leads to r-ca-def. What should it lead to instead?
**A:** pH lockout (Recommended). Brown spots on old leaves + interveinal pattern → pH lockout as primary, with Mg def and leaf septoria as 'also consider'.

## Q6: Dynamic treatment text per medium
**Q:** Should the growing medium selection also change treatment text dynamically?
**A:** Yes, full dynamic treatment text. Each result node has medium-specific treatment variants. Most accurate but biggest implementation effort.

## Q7: Treatment data model
**Q:** For dynamic treatment text per medium, how should we store the medium-specific variants?
**A:** Object map per medium (Recommended). `checkFirst: { soil: [...], coco: [...], hydro: [...], default: [...] }`. Renderer picks based on selected medium.

## Q8: Medium/lighting persistence
**Q:** Should the medium/lighting selections persist in localStorage so returning users don't have to re-answer them each time?
**A:** Yes, persist and show as editable badges. Save to localStorage. Show as small badges at top of the tool that can be tapped to change.
