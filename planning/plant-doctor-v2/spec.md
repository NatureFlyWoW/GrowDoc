# Plant Doctor v2 — Multi-Issue Diagnosis with Adaptive Questioning & Review Loop

## Context

GrowDoc's Plant Doctor (`docs/tool-plant-doctor.html`) is a single-page diagnostic wizard for cannabis plant problems. v1 uses a static decision tree (72 nodes: 27 questions, 44 results) with wizard and expert modes, localStorage persistence, and accessibility features.

**v1 limitation:** Users can only diagnose ONE symptom at a time. Real plants often show multiple symptoms simultaneously (e.g., yellowing + curling + spots). The current tree forces a single path, missing compound diagnoses.

## Requested Features

### 1. Multi-Issue Selection (Expert Mode Enhancement)

Experts should be able to select **multiple symptoms** simultaneously and receive a **combined step-by-step guide** that:
- Identifies which issues are likely related (e.g., N deficiency + yellowing = same root cause)
- Deduplicates overlapping fixes (don't say "check pH" five times)
- Prioritizes the combined fix order (address root causes before symptoms)
- Shows confidence adjustments when symptoms corroborate each other

### 2. Deep Conditional Questions (Adaptive Diagnosis)

The system should ask **follow-up questions only when needed** for accurate diagnosis:
- Questions that narrow down between two equally likely causes
- Environment-specific clarifications (e.g., "Are you in coco or soil?" only when it changes the diagnosis)
- Severity assessment questions (e.g., "How many leaves affected?" only for conditions where severity changes the fix)
- These should feel conversational, not like a bureaucratic form

### 3. Free-Text Context Input

Allow users to **describe their situation in their own words** at key points:
- Optional text area for additional context before diagnosis begins
- Ability to add notes/details at any question step
- The system uses this context to refine its diagnosis (not as primary input, but as supplementary signal)

### 4. Post-Diagnosis Review Loop

After receiving a diagnosis and applying fixes, users should be able to:
- Report back what they did (which fixes they applied)
- Describe current plant status (improved, same, worse, new symptoms)
- Get a **follow-up assessment** that considers:
  - The original diagnosis
  - What was done
  - Current state
  - Whether to adjust treatment, wait longer, or re-diagnose
- This creates a conversation-like diagnostic experience over time

## Technical Constraints

- Must remain a single HTML file (vanilla JS, no build step)
- Must stay under 100KB total file size
- Must preserve v1 functionality (wizard mode still works for single-issue diagnosis)
- Must maintain dark theme, accessibility standards, and localStorage persistence
- v1's decision tree data should be reused, not replaced
- The tool runs entirely client-side (no server, no API calls)

## User Experience Goals

- A first-time grower should still be able to use wizard mode simply
- An experienced grower should feel like they're consulting a knowledgeable friend
- The multi-issue flow should feel natural, not overwhelming
- The review loop should feel like a follow-up appointment, not a new diagnosis
