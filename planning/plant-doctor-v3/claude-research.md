# Plant Doctor v3 Research Findings

## Codebase Context (from prior exploration)

- **Architecture:** Standalone vanilla JS/HTML/CSS, ES5-compatible, single HTML file + external data JS
- **Decision tree:** 72 nodes (27 questions, 44 results) in flat `TREE` map using `makeResult()` helper
- **Scoring engine:** `scoreDiagnoses()` in plant-doctor-data.js — symptom weights, stage modifiers, corroboration bonus, base_confidence cap
- **Refine rules:** 20 disambiguation rules triggered by condition functions
- **State:** `state` (wizard), `multiDxState` (multi-dx), `journalState` (journal) — all in-memory objects
- **Tests:** 165 inline console tests in `runTests()`, all passing
- **Storage:** localStorage v2 schema with migration from v1

---

## 1. Nutrient Mobility & Deficiency Mapping

### Calcium Mobility Resolution

**The "Ca on old leaves" claim is wrong for cannabis under normal conditions.**

Cross-validated across GrowWeedEasy, Royal Queen Seeds, Dutch Passion, USU Extension, and PMC peer-reviewed study (Cockson et al., 2023):

- **Calcium is SEMI-MOBILE** (immobile in phloem, moves passively via xylem/transpiration)
- **Primary symptom location: NEW/upper growth** — brown spots/blotches on young leaves, tip distortion
- **The PMC study exception:** Found Ca symptoms on lower leaves in hydroponic conditions, but explicitly noted this was atypical — attributed to low-transpiration microenvironments, not classical mobility
- **Bottom line for the tool:** Ca deficiency should ONLY be reachable through new growth symptoms. Brown spots on old leaves = Mg deficiency, fungal issues (leaf septoria), or pH lockout — NOT Ca def.

### Complete Nutrient Mobility Chart

| Nutrient | Mobility | Symptoms Appear | Primary Visual Presentation |
|---|---|---|---|
| Nitrogen (N) | Mobile | Old/lower first | Uniform yellowing from tip inward |
| Phosphorus (P) | Mobile | Old/lower first | Dark green to purple/bronze |
| Potassium (K) | Mobile | Old/lower edges first | Marginal burn/necrosis |
| Calcium (Ca) | Semi-mobile | New/upper growth | Brown spots, tip distortion |
| Magnesium (Mg) | Mobile | Old/lower first | Interveinal chlorosis (veins stay green) |
| Sulfur (S) | Semi-mobile/Immobile | New growth primarily | Light green/yellow young leaves |
| Iron (Fe) | Immobile | New/upper first | Stark interveinal chlorosis on newest leaves |
| Manganese (Mn) | Immobile | New/upper first | Mottled interveinal chlorosis, crinkled edges |
| Zinc (Zn) | Immobile | New/upper first | Interveinal chlorosis + leaf wrinkling + compressed internodes |
| Boron (B) | Immobile | New growth/tips | Stunted, twisted tips; thickened brittle leaves |
| Copper (Cu) | Immobile | New/upper | Wilting, bluish-green, necrotic tips |
| Molybdenum (Mo) | Semi-mobile | Mid-plant | Yellowing between veins, cupping |

### Mn vs Mg Differential

| Feature | Magnesium | Manganese |
|---|---|---|
| Location | Old/lower leaves | New/upper leaves |
| Pattern | Clean interveinal chlorosis | Mottled, web-like, less stark |
| Leaf texture | Soft, no distortion | Crinkled, curled, wavy edges |
| Speed | Slow progression | Slow and subtle |
| pH trigger | Low pH (<6.0 soil) | High pH (>6.5 soil) |

### Zinc Deficiency Key Features
- Interveinal chlorosis on new growth + leaf wrinkling/distortion + compressed internodes
- **Signature:** Leaves rotate/twist up to 90 degrees sideways
- **Common cause:** High pH (>6.5 soil) or excess phosphorus blocking Zn uptake

### pH Lockout by Medium

| Nutrient | Soil Lockout | Coco Lockout | Hydro Lockout |
|---|---|---|---|
| Ca, Mg | Below 5.5 | Below 5.5 | Below 5.2 |
| Fe, Mn, Zn, Cu | Above 6.5 | Above 6.2 | Above 6.0 |
| P | Below 5.5 or above 7.5 | Below 5.5 or above 7.0 | Below 5.0 or above 7.0 |
| N | Below 5.5 | Below 5.0 | Below 5.0 |
| Mo | Below 5.5 | Below 5.5 | Below 5.2 |

**Key patterns:**
- pH too low: Ca/Mg/K/Mo/P lock out; Fe/Mn/Zn become toxic
- pH too high: Fe/Mn/Zn/Cu/B lock out (most common cause of micronutrient deficiency)
- Coco buffers toward 6.5+ over time → Fe/Mn/Zn deficiencies

### LED vs HPS Ca/Mg Demand

**The effect is REAL but the mechanism is environmental, not spectral.**

- LEDs emit no significant IR → leaf surfaces 2-3°C cooler than air
- Lower leaf temp = lower transpiration = less Ca transport via xylem
- **Fix:** Run LED rooms 3-5°C warmer than HPS rooms to restore equivalent VPD
- At high PPFD (>800 μmol/m²/s), increased photosynthetic rate may genuinely increase Mg demand
- **For the tool:** LED users with Ca/Mg symptoms should first be asked about temp/RH/VPD; boost Ca/Mg scores +0.15 under LED as a modifier

Sources: GrowWeedEasy, RQS, Dutch Passion, USU Extension, PMC (Cockson 2023), MDPI Cannabis Nutrient Disorders, Cannabis Business Times

---

## 2. Pest Differential Diagnosis

### Broad Mites (Polyphagotarsonemus latus)

**Symptoms:**
- Twisted, cupped new growth (asymmetrical distortion)
- **Glossy/wet plastic leaf surface** — key distinguishing feature
- Leaf edges curling upward on new growth
- Stunted, bronzed, pale new tips with "locked up" appearance
- Hardened, brittle tissue

**Broad Mites vs Calcium Deficiency:**

| Feature | Broad Mites | Calcium Deficiency |
|---|---|---|
| Brown spots | No — distortion only | Yes — hallmark |
| Leaf texture | Glossy, wet-looking | Normal or crispy at spots |
| Spreads plant-to-plant | Yes | No |
| Responds to CalMag | No improvement | Improvement in days |
| Definitive test | 60x microscope — white specks, polka-dot eggs | No organisms |

**Key diagnostic question:** If pH is correct AND CalMag supplementation shows no improvement in 5-7 days → suspect broad mites immediately.

**Treatment:** Avid (abamectin) or Forbid 4F (spiromesifen) in veg only. Predatory mites for prevention. Heat treatment (45°C/15min) for clones.

### Thrips (Frankliniella occidentalis)

**Symptoms:**
- Silver/bronze streaks ("leaf was lightly sanded")
- **Black frass dots** — the most reliable field indicator
- Tissue damage is permanent (cells consumed and air-filled)
- Flower damage: silvered calyxes, stigma damage

**Thrips vs Spray Damage:** Frass present = thrips. No frass = spray/splash.

**Treatment:** Spinosad every 3 days × 3 cycles (veg). Predatory mites. In flower: spinosad up to 1 week before harvest; biologicals (Orius spp.) safe at any stage.

### Fungus Gnats (Bradysia spp.)

**Adult ID:** 3-4mm, dark gray/black, mosquito-like silhouette, long bead-like antennae
**Shore fly differentiation:** Shore flies are stocky/housefly-like with 5 white wing spots — they do NOT damage roots

**Larval damage:** Stunted growth, wilting not responsive to watering, especially in seedlings
**Gnats vs Overwatering:** Adults flying + larvae in soil = gnat damage. No insects + heavy pot = overwatering.
**Potato test:** Raw potato cube on soil 24-48h — larvae migrate to feed, confirms presence.

**Treatment:** BTi (Gnatrol, Mosquito Bits) as soil drench — preferred. H2O2 drench (1:4 ratio) as alternative. Let top soil dry between waterings.

### Bud Rot (Botrytis cinerea)

**Early symptoms:** Single leaf death within a bud cluster; dying pistils in patches; water-soaked spots on bracts
**Late symptoms:** Gray fuzzy mycelium (definitive); brown mushy collapsing tissue; spore puff when disturbed

**Botrytis vs Senescence:** Botrytis = rapid onset at bud sites + gray fuzz + musty smell. Senescence = gradual lower-leaf yellowing, no fuzz, normal smell.

**Risk conditions:** RH >70%, temp 17-24°C, dense buds, poor airflow, night-cycle humidity spikes

### Hermaphroditism

**Two presentations:**
1. **Genetic (true hermie):** Round pollen sacs at nodes, early flower (weeks 1-4), multiple branches → CULL
2. **Stress-induced (nanners):** Yellow banana-shaped stamens from within buds, late flower (weeks 6-9), limited to few buds → MANAGE

**Common triggers:** Light leaks (#1), heat >30°C, pH swings, heavy defoliation near flip, timer failures
**Symptom delay:** 10-14 days after stress event

**Decision framework:**
- Manage if: nanners only, late flower, limited distribution, stressor identified and corrected, can inspect daily
- Cull if: full pollen sacs, early flower, widespread, no identifiable stressor, shares airspace with other plants

Sources: ICMag, Rollitup, GrowWeedEasy, RQS, Cannabis Business Times, PMC, University of Florida IFAS, Canadian Journal of Botany (2023), Taylor & Francis (2025)

---

## 3. VPD Symptom Correlation

### VPD Formula

```
SVP(T) = 0.61078 × exp(17.27 × T / (T + 237.3))  [kPa, T in °C]
Leaf VPD = SVP(T_leaf) - (RH/100) × SVP(T_air)

Leaf temp offsets:
  HPS/CMH:       air temp - 0.5°C
  Generic LED:   air temp - 2.0°C
  High-output LED: air temp - 3.0°C (PPFD > 800)
```

### Optimal VPD by Stage

| Stage | VPD Range (kPa) |
|---|---|
| Seedling/Clone | 0.4 – 0.8 |
| Early Veg | 0.8 – 1.0 |
| Late Veg | 1.0 – 1.2 |
| Early Flower | 1.0 – 1.5 |
| Mid Flower | 1.2 – 1.5 |
| Late Flower | 1.4 – 1.6 |
| Danger HIGH | > 1.6 |
| Danger LOW | < 0.4 |

### High VPD Symptoms (>1.6 kPa)
- Upward leaf curl (taco/canoe shape) — most consistent early indicator
- Crispy leaf edges/margins
- Rapid wilting despite adequate root moisture
- **Critical:** Can cause Ca deficiency symptoms because stomatal closure halts Ca transport

### Low VPD Symptoms (<0.4 kPa)
- Heavy, dark, rubbery leaves
- Drooping despite normal moisture (misdiagnosed as overwatering)
- Guttation (water droplets at leaf tips) — reliable low-VPD indicator
- Edema (corky blisters on leaf underside)
- PM and Botrytis risk

### Key Differentials

**High VPD vs Heat Stress:**
- Both cause upward taco curl
- Heat stress: worst near light source, leaf temp >29°C
- High VPD: affects entire canopy uniformly, VPD >1.6 but leaf temp may be normal
- **Fix differs:** VPD → raise RH. Heat → lower temp or raise light.

**Low VPD vs Overwatering:**
- Both cause drooping
- Low VPD: RH >70%, guttation present, edema possible
- Overwatering: pot stays heavy, any RH, root zone issue
- **Diagnostic shortcut:** RH >70% + drooping = low VPD suspect. Normal RH + wet substrate 3+ days = overwatering.

### VPD-Ca Deficiency Connection
Both very high VPD (stomata close) and very low VPD (transpiration stops) can produce Ca deficiency symptoms. **Check VPD before attributing Ca symptoms to a nutrient problem.**

### Minimum Info for VPD Diagnosis
1. Air temperature at canopy height (required)
2. Relative humidity at canopy height (required)
3. Lighting type (for leaf temp offset)
4. Growth stage (for target range comparison)

### Symptom Overlap Matrix

| Symptom | VPD High | VPD Low | Heat | Light Burn | Overwater | Ca Def |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Upward curl | X | — | X | — | — | — |
| Crispy margins | X | — | X | — | — | — |
| Guttation | — | X | — | — | — | — |
| Edema | — | X | — | — | X | — |
| Drooping | — | X | — | — | X | — |
| Ca symptoms | X | X | — | — | — | X |
| PM/mold risk | — | X | — | — | X | — |

Sources: Dimlux, Black Dog LED, Cannabis Science & Technology, MaryJane Farm, Alchimia, Royal Queen Seeds, GrowSensor, JumpLights, GrowWeedEasy, Soft Secrets, UMass Extension

---

## Testing Context

- **Framework:** Inline console tests using `assert(condition, msg)` pattern
- **Runner:** `runTests()` function at bottom of HTML, saves/restores all state
- **Coverage:** Data structure validation, state management, UI rendering, localStorage migration
- **Gap noted by Franco:** No tests validate plant science correctness (e.g., "yellow-lower + interveinal → Mg def")
- **Current count:** 165 tests, 0 failures
