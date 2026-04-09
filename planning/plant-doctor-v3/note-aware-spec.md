# Note-Aware Diagnosis System — Spec

## Overview
Parse user notes for keywords/patterns, extract structured context, use it to:
1. Generate contextual advice on result cards (highest priority)
2. Adjust Multi-Dx scoring based on extracted context
3. Both combined

## Architecture
extractNoteContext(allNotes) → context object → generateContextualAdvice(context, diagnosis) + adjustScoresFromNotes(scores, context)

## Context Object Shape
plantType, age/timeline, medium, lighting, environment (temp/rh), scope (single/multiple/all), severity, keywords, growerIntent, previousTreatment, wateringPattern

## Rule Database (Franco builds)
- ~80-100 keyword patterns → context mapping
- ~150-200 diagnosis × context → advice snippets  
- Scoring adjustment rules for multi-dx

## UI
New "Based on Your Notes" section on result cards, styled distinctly.

## Constraints
- ES5 JavaScript, no API, works offline
- Must not break existing 243 tests
