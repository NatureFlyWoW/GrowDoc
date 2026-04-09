# Section 16: Knowledge Base

## Overview

This section builds a contextual knowledge browser that replaces the 14 static guide documents currently served via the iframe doc viewer. Instead of separate HTML files, all knowledge content is stored in JS data modules and rendered by a dedicated view function. This enables contextual references from anywhere in the app -- task cards can link to specific knowledge articles by ID, the Plant Doctor can reference deep-dive articles, and the dashboard can surface relevant tips based on the current growth stage.

The Knowledge Base is organized by topic and growth stage, uses a three-layer disclosure pattern for progressive detail, includes evidence level badges, and has a dedicated myth-busting section with citations.

**Routes:** `/knowledge` (main browser) and `/knowledge/myths` (myth-busting section).

**Tech stack:** Vanilla JS (ES modules). Content stored as JS data structures, not markdown or HTML files.

---

## Dependencies

- **Section 02 (Store/Storage):** Knowledge articles may reference the user's current stage and medium to provide contextual tips. The store provides the active profile data.
- **Section 04 (Grow Knowledge):** Evidence classifications from `evidence-data.js` are used for the evidence level badges displayed in Layer 2 of knowledge articles.

## Blocks

This section does not block any other section. It can be built in parallel with sections 09-15 and 17-18.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/views/knowledge.js` | Knowledge Base browser view (main rendering, search, filtering) |
| `/js/data/myths-data.js` | Myth-busting content with evidence citations |
| `/js/data/knowledge-articles.js` | All knowledge article content organized by topic |
| `/js/components/disclosure.js` | Three-layer expandable content component (shared, may already exist from Section 01) |

---

## Tests (Implement First)

### Content Integrity Tests

- **Layer 1 completeness:** all knowledge articles have a Layer 1 property (action text / practical summary) that is a non-empty string
- **Layer 2 for evidence claims:** all articles that include evidence-based claims have a Layer 2 property containing an evidence level badge value (one of: established, promising, speculative, practitioner)
- **Myth citations:** all myth-busting articles include a `sources` array with at least one citation entry (author, year, or study name)
- **Internal links valid:** all `relatedArticles` references in articles point to valid article IDs that exist in the knowledge-articles data

### Search and Filter Tests

- **Keyword search:** searching by a keyword (e.g., "VPD") returns articles whose title, summary, or tags contain that keyword (case-insensitive)
- **Topic filter:** filtering by topic (e.g., "Environment") returns only articles assigned to that topic category
- **Stage filter:** filtering by stage (e.g., "flower") returns articles tagged as relevant to that stage
- **Empty search:** an empty search query returns all articles (no filtering applied)
- **Combined filters:** applying both a topic filter and a keyword search returns the intersection (articles matching both criteria)

### Disclosure Component Tests

- **Layer 1 visible by default:** Layer 1 content (the summary/action text) is always visible when a knowledge card is rendered
- **Layer 2 collapsed by default:** Layer 2 content (the why/evidence section) is hidden until the user clicks to expand
- **Layer 2 expand/collapse:** clicking the expand control toggles Layer 2 visibility
- **Layer 3 as link:** Layer 3 entries render as internal navigation links (not inline content), pointing to related knowledge article routes
- **Accessibility:** expand/collapse controls have appropriate `aria-expanded` attributes

---

## Implementation Details

### Knowledge Article Data Structure

All knowledge content lives in `/js/data/knowledge-articles.js` as a JS data module. Each article follows a consistent schema.

```javascript
/**
 * KNOWLEDGE_ARTICLES -- Array of knowledge article objects.
 *
 * Each article: {
 *   id: String,              // Unique article ID for internal linking
 *   title: String,           // Article title (Layer 1 heading)
 *   summary: String,         // Practical advice summary (Layer 1 body)
 *   topic: String,           // Category: 'basics' | 'stages' | 'nutrients' |
 *                            //   'environment' | 'training' | 'pests' |
 *                            //   'harvest' | 'myths'
 *   stages: String[],        // Relevant stages: ['veg', 'flower', 'all', etc.]
 *   tags: String[],          // Search keywords
 *   evidence: {              // Layer 2 evidence content
 *     level: String,         // 'established' | 'promising' | 'speculative' | 'practitioner'
 *     explanation: String,   // Why this recommendation matters
 *     source: String,        // Citation or practitioner insight attribution
 *     detail: String         // Extended scientific/practical explanation
 *   },
 *   relatedArticles: String[], // IDs of related articles (Layer 3 links)
 *   isMyth: Boolean          // true for myth-busting articles
 * }
 */
export const KNOWLEDGE_ARTICLES = [ /* ... */ ];
```

### Content Topics and Coverage

The knowledge base organizes articles into eight topic categories. Each topic contains multiple articles covering the key information that was previously spread across 14 static guide documents.

**Growing Basics** (`topic: 'basics'`):
- Medium setup (soil vs coco vs hydro -- pros/cons, preparation)
- Lighting fundamentals (LED vs HPS vs CFL, distance, PPFD basics)
- Ventilation and air circulation
- Water quality (pH, EC, tap vs RO)
- Container selection and sizing

**Stage Guides** (`topic: 'stages'`):
- Germination best practices
- Seedling care (light intensity, watering frequency, humidity dome)
- Vegetative growth (node development, when to top, when to flip)
- Flowering (photoperiod, bud development phases, late-flower ripening)
- Harvest timing (trichome assessment primer)
- Drying protocol (temperature, humidity, duration, snap test)
- Curing protocol (jar method, burping schedule, humidity packs)

**Nutrient Science** (`topic: 'nutrients'`):
- N-P-K ratios by stage (what each macronutrient does)
- Micronutrient overview (CalMag, iron, manganese)
- Deficiency identification (visual symptoms mapped to nutrients)
- Toxicity identification (nutrient burn, lockout)
- Organic vs synthetic feeding approaches
- pH and its role in nutrient availability (the pH-availability chart explanation)

**Environment** (`topic: 'environment'`):
- VPD explained (what it is, why it matters, how to measure)
- DLI explained (daily light integral, PPFD to DLI conversion)
- Temperature management (day/night differential, late-flower cooling)
- Humidity control (dehumidifiers, humidifiers, VPD targets by stage)
- CO2 supplementation (when it helps, when it does not)

**Training** (`topic: 'training'`):
- Low Stress Training (LST) technique and timing
- Topping and FIMming (when, how, recovery time)
- ScrOG (Screen of Green) setup and management
- Mainlining / manifolding technique
- Lollipoping (removing lower growth, timing in flower)
- Defoliation (strategic leaf removal, timing, frequency)

**Pest and Disease** (`topic: 'pests'`):
- Spider mites (identification, treatment, prevention)
- Fungus gnats (identification, treatment, prevention)
- Powdery mildew (identification, treatment, environment control)
- Root rot (causes, treatment, prevention)
- Integrated pest management (IPM) principles

**Harvest and Post-Harvest** (`topic: 'harvest'`):
- Trichome maturity stages (clear, milky, amber -- what each means)
- Priority-based harvest timing (yield vs quality vs terpenes)
- Wet trim vs dry trim comparison
- Slow-dry method for maximum terpene preservation
- Long-term storage (temperature, humidity, light, container types)

**Myths vs Science** (`topic: 'myths'`):
Dedicated myth-busting articles (see Myths section below).

### Three-Layer Disclosure Pattern

Every knowledge article renders with three progressive layers of detail.

**Layer 1 -- Always Visible (Card):**
The article title and a 1-3 sentence practical summary. This is the "what to do" layer. Always rendered when an article card appears in the knowledge browser or when linked from a task card.

**Layer 2 -- Expandable (Why + Evidence):**
Click/tap to expand. Contains:
- An explanation of why this recommendation matters (the science or logic behind it)
- Evidence level badge, color-coded:
  - **Established** (green): Supported by published research or widespread expert consensus
  - **Promising** (blue): Supported by preliminary research or strong practitioner consensus
  - **Speculative** (gold): Theoretical basis but limited empirical evidence
  - **Practitioner** (gray): Based on experienced grower consensus, not formally studied
- Source citation text (e.g., "Stemeroff et al., 2017" or "Franco's cultivation protocols")
- Extended explanation with additional detail

**Layer 3 -- Internal Links (Related Articles):**
At the bottom of Layer 2, a "Related" section lists links to other knowledge articles by ID. Clicking a related article navigates to that article within the knowledge browser. No external URLs -- all references are internal to the knowledge base.

### disclosure.js (Shared Component)

The three-layer disclosure component is reusable across the app (also used by task cards and Plant Doctor result cards).

```javascript
/**
 * disclosure.js
 *
 * renderDisclosure(container, options) -- Render a three-layer disclosure card.
 *   options.title       -- Layer 1 heading text
 *   options.summary     -- Layer 1 body text (always visible)
 *   options.detail      -- Layer 2 content (expandable)
 *   options.evidence    -- Evidence level object {level, source} for Layer 2 badge
 *   options.links       -- Array of {id, title} for Layer 3 related links
 *   options.onLinkClick(id) -- Callback when a Layer 3 link is clicked
 *   options.expanded    -- Initial expanded state (default false)
 *
 * Accessibility:
 *   - Expand/collapse button has aria-expanded attribute
 *   - Layer 2 panel has aria-hidden when collapsed
 *   - Button text changes: "Show details" / "Hide details"
 */
export function renderDisclosure(container, options) { /* ... */ }
```

### Myth-Busting Section

The myths data module contains common cannabis cultivation myths, each presented with structured evidence.

```javascript
/**
 * myths-data.js
 *
 * MYTHS -- Array of myth article objects.
 *
 * Each myth: {
 *   id: String,              // Unique myth ID
 *   claim: String,           // The myth as commonly stated
 *   verdict: String,         // 'debunked' | 'no-evidence' | 'partially-true' | 'context-dependent'
 *   reality: String,         // The evidence-based truth
 *   explanation: String,     // Detailed explanation of why the myth persists and what the evidence shows
 *   sources: [{
 *     author: String,
 *     year: Number,
 *     title: String,
 *     type: String           // 'study' | 'review' | 'expert-consensus'
 *   }]
 * }
 */
export const MYTHS = [ /* ... */ ];
```

**Core myths to include:**

1. **Pre-harvest flushing:** Claim: "Flush plants with plain water for 1-2 weeks before harvest to improve taste." Verdict: debunked. Source: Stemeroff et al. (2017) -- blind taste tests showed no difference between flushed and unflushed cannabis.

2. **48-hour darkness before harvest:** Claim: "Leave plants in total darkness for 48 hours before harvest to increase THC." Verdict: no-evidence. No published research supports this practice. Trichome maturity is determined over weeks, not hours.

3. **Sugar/carb supplements for terpenes:** Claim: "Adding molasses or carbohydrate supplements increases terpene production." Verdict: no-evidence. Plants synthesize their own sugars via photosynthesis. Root-zone sugar supplements primarily feed soil microbes (which can be beneficial in organic soil, but not via the terpene pathway claimed).

4. **Indica vs sativa effect classification:** Claim: "Indica strains produce body highs, sativa strains produce head highs." Verdict: debunked. Source: Russo (2016). Chemotype (cannabinoid and terpene profile) determines effects, not plant morphology classification.

5. **More light always means more yield:** Claim: "You can't give cannabis too much light." Verdict: context-dependent. There is a DLI ceiling (~65 mol/m2/day without CO2 supplementation) above which additional light causes photoinhibition, bleaching, and stress. Optimal DLI varies by stage and depends on CO2 levels.

6. **CalMag fixes everything:** Claim: "Yellow leaves? Add CalMag." Verdict: partially-true. CalMag deficiency is common in coco + LED grows and with RO water, but yellow leaves have many causes. Diagnosing the actual issue (pH lockout, nitrogen deficiency, overwatering) matters more than reflexive CalMag supplementation.

### Knowledge Browser View

The main knowledge view renders at `/knowledge` and provides browsing, searching, and filtering.

```javascript
/**
 * knowledge.js (view)
 *
 * renderKnowledgeView(container, store) -- Main knowledge browser.
 *   Components:
 *   1. Search bar with debounced text input (200ms)
 *   2. Topic filter chips (clickable, toggleable)
 *   3. Stage filter dropdown (optional, filters by relevant growth stage)
 *   4. Article list: rendered as disclosure cards (Layer 1 visible, Layer 2 expandable)
 *   5. Contextual highlight: if user has an active grow, articles relevant
 *      to their current stage are marked with a "Relevant now" badge
 *
 * renderMythsView(container, store) -- Myth-busting dedicated page (/knowledge/myths).
 *   Renders all MYTHS entries as cards with claim, verdict badge, reality text,
 *   expandable evidence detail, and source citations.
 *
 * navigateToArticle(articleId) -- Scroll to or render a specific article
 *   (used when navigating from task cards or Plant Doctor results via
 *   internal link).
 */
```

**Search implementation:**

Search filters articles by matching the query string (case-insensitive) against the article's title, summary, and tags array. The search input is debounced at 200ms to avoid excessive DOM re-renders when typing.

**Contextual relevance:**

When a user has an active grow, the knowledge view reads the current stage from the store and marks articles whose `stages` array includes the current stage with a "Relevant now" badge. These articles are optionally sorted to the top of the list (configurable via a "Show relevant first" toggle).

**Navigation from other sections:**

Task cards, Plant Doctor results, and dashboard tips can link to specific knowledge articles using internal IDs:

```javascript
// Example: from a task card's Layer 3 link
router.navigate(`/knowledge#article-vpd-explained`);
// The knowledge view scrolls to or highlights the article with id 'vpd-explained'
```

### Evidence Level Badge Styling

Evidence badges are small colored pills rendered inline with the article content in Layer 2.

| Level | Color | Label |
|-------|-------|-------|
| Established | Green (#8fb856) | Established |
| Promising | Blue (#6b9fc4) | Promising |
| Speculative | Gold (#d4a843) | Speculative |
| Practitioner | Gray (#8a8472) | Practitioner |

The badge renders as a `<span>` with a CSS class corresponding to the evidence level. The same badge styling is used in the Plant Doctor results and task cards.

---

## Implementation Checklist

1. Write content integrity tests (Layer 1 completeness, Layer 2 for evidence claims, myth citations, internal link validity)
2. Write search and filter tests (keyword search, topic filter, stage filter, empty search, combined filters)
3. Write disclosure component tests (Layer 1 visible, Layer 2 collapsed, expand/collapse toggle, Layer 3 links, aria-expanded)
4. Create `/js/components/disclosure.js` with the three-layer expandable card component
5. Implement disclosure expand/collapse with proper ARIA attributes
6. Create `/js/data/knowledge-articles.js` with the full article data structure
7. Write articles for each topic category: basics, stages, nutrients, environment, training, pests, harvest
8. Ensure every article has id, title, summary, topic, stages, tags, evidence (where applicable), and relatedArticles
9. Create `/js/data/myths-data.js` with the myth-busting content
10. Write all 6+ core myth entries with claim, verdict, reality, explanation, and sources
11. Implement `renderKnowledgeView()` in `/js/views/knowledge.js`
12. Implement search bar with debounced filtering (200ms)
13. Implement topic filter chips (clickable, toggleable, filter article list)
14. Implement stage filter dropdown
15. Implement contextual "Relevant now" badge based on current grow stage
16. Implement `renderMythsView()` for the `/knowledge/myths` route
17. Render myth cards with claim, verdict badge, reality, expandable evidence, sources
18. Implement `navigateToArticle()` for deep-linking from task cards and Plant Doctor
19. Wire evidence level badge styling (green/blue/gold/gray pills)
20. Run all content integrity tests and verify passing
21. Run all search/filter tests and verify passing
22. Run disclosure component tests and verify passing
23. Test end-to-end flow: browse topics, search keyword, expand article, follow related link, navigate from myth page
