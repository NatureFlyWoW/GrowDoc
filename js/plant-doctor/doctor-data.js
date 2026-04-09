// GrowDoc Companion — Plant Doctor Diagnostic Data
// Core symptom-condition scoring rules extracted from v3.
// Full 44 conditions × 42 symptoms data will be imported from
// /docs/plant-doctor-data.js at runtime via dynamic import.

/**
 * Placeholder scoring rules — the full dataset loads from the existing
 * plant-doctor-data.js file on first use. These cover the most common
 * conditions as a fallback.
 */
export const CORE_SCORING = [
  { condition: 'Nitrogen Deficiency', symptom: 'yellowing-lower-leaves', weight: 8 },
  { condition: 'Nitrogen Deficiency', symptom: 'pale-overall', weight: 5 },
  { condition: 'Nitrogen Deficiency', symptom: 'slow-growth', weight: 4 },
  { condition: 'Overwatering', symptom: 'drooping-leaves', weight: 7 },
  { condition: 'Overwatering', symptom: 'yellowing-lower-leaves', weight: 4 },
  { condition: 'Overwatering', symptom: 'slow-growth', weight: 3 },
  { condition: 'Underwatering', symptom: 'drooping-leaves', weight: 6 },
  { condition: 'Underwatering', symptom: 'dry-crispy-edges', weight: 7 },
  { condition: 'Underwatering', symptom: 'wilting', weight: 5 },
  { condition: 'Light Burn', symptom: 'bleaching-tops', weight: 9 },
  { condition: 'Light Burn', symptom: 'burnt-tips', weight: 5 },
  { condition: 'Light Burn', symptom: 'yellowing-tops', weight: 4 },
  { condition: 'Nutrient Burn', symptom: 'burnt-tips', weight: 8 },
  { condition: 'Nutrient Burn', symptom: 'brown-edges', weight: 6 },
  { condition: 'Nutrient Burn', symptom: 'curling-down', weight: 4 },
  { condition: 'pH Imbalance', symptom: 'multicolor-spots', weight: 7 },
  { condition: 'pH Imbalance', symptom: 'lockout-symptoms', weight: 8 },
  { condition: 'pH Imbalance', symptom: 'slow-growth', weight: 3 },
  { condition: 'Calcium Deficiency', symptom: 'brown-spots', weight: 7, contextBoost: { key: 'medium', value: 'coco', multiplier: 1.5 } },
  { condition: 'Calcium Deficiency', symptom: 'curling-new-growth', weight: 5, contextBoost: { key: 'lighting', value: 'led', multiplier: 1.3 } },
  { condition: 'Magnesium Deficiency', symptom: 'interveinal-yellowing', weight: 8 },
  { condition: 'Magnesium Deficiency', symptom: 'yellowing-lower-leaves', weight: 4 },
  { condition: 'Heat Stress', symptom: 'tacoing', weight: 8 },
  { condition: 'Heat Stress', symptom: 'wilting', weight: 5 },
  { condition: 'Heat Stress', symptom: 'foxtailing', weight: 6 },
  { condition: 'Spider Mites', symptom: 'tiny-dots-leaves', weight: 9 },
  { condition: 'Spider Mites', symptom: 'webbing', weight: 10 },
  { condition: 'Fungus Gnats', symptom: 'small-flies', weight: 9 },
  { condition: 'Fungus Gnats', symptom: 'slow-growth', weight: 3 },
  { condition: 'Potassium Deficiency', symptom: 'brown-edges', weight: 7 },
  { condition: 'Potassium Deficiency', symptom: 'yellowing-edges', weight: 6 },
  { condition: 'Root Rot', symptom: 'brown-slimy-roots', weight: 10 },
  { condition: 'Root Rot', symptom: 'foul-smell', weight: 8 },
  { condition: 'Root Rot', symptom: 'wilting', weight: 4 },
  { condition: 'Phosphorus Deficiency', symptom: 'purple-stems', weight: 7 },
  { condition: 'Phosphorus Deficiency', symptom: 'dark-leaves', weight: 5 },
];

export const CORE_REFINE_RULES = [
  { condition: 'Nitrogen Deficiency', question: 'Are the affected leaves mainly on the lower/older part of the plant?', yesBoost: 20, noBoost: -15 },
  { condition: 'Overwatering', question: 'Does the soil feel heavy/wet when you lift the pot?', yesBoost: 25, noBoost: -20 },
  { condition: 'Underwatering', question: 'Do the leaves perk up within hours after watering?', yesBoost: 30, noBoost: -10 },
  { condition: 'Light Burn', question: 'Are the symptoms concentrated on the parts closest to the light?', yesBoost: 25, noBoost: -20 },
  { condition: 'Nutrient Burn', question: 'Have you recently increased nutrient concentration?', yesBoost: 20, noBoost: -10 },
  { condition: 'pH Imbalance', question: 'Have you been checking and adjusting pH before feeding?', yesBoost: -10, noBoost: 20 },
  { condition: 'Calcium Deficiency', question: 'Are you growing in coco or using LED lights?', yesBoost: 20, noBoost: -5 },
  { condition: 'Heat Stress', question: 'Is the temperature in your grow space above 28°C?', yesBoost: 25, noBoost: -15 },
  { condition: 'Spider Mites', question: 'Do you see tiny webs on the undersides of leaves?', yesBoost: 30, noBoost: -20 },
  { condition: 'Root Rot', question: 'Do the roots look brown or slimy (instead of white)?', yesBoost: 30, noBoost: -25 },
];

export const SYMPTOM_OPTIONS = [
  { id: 'yellowing-lower-leaves', label: 'Yellowing lower/older leaves' },
  { id: 'yellowing-tops', label: 'Yellowing at tops/new growth' },
  { id: 'pale-overall', label: 'Pale green overall' },
  { id: 'drooping-leaves', label: 'Drooping/wilting leaves' },
  { id: 'dry-crispy-edges', label: 'Dry, crispy leaf edges' },
  { id: 'burnt-tips', label: 'Burnt leaf tips' },
  { id: 'brown-edges', label: 'Brown leaf edges' },
  { id: 'brown-spots', label: 'Brown/rust spots on leaves' },
  { id: 'multicolor-spots', label: 'Multiple colors/deficiency signs' },
  { id: 'curling-down', label: 'Leaves curling downward' },
  { id: 'curling-new-growth', label: 'New growth curling/twisted' },
  { id: 'bleaching-tops', label: 'White/bleached tops' },
  { id: 'tacoing', label: 'Leaves folding up (tacoing)' },
  { id: 'wilting', label: 'Wilting despite being watered' },
  { id: 'slow-growth', label: 'Slow or stunted growth' },
  { id: 'interveinal-yellowing', label: 'Yellowing between veins' },
  { id: 'purple-stems', label: 'Purple/red stems' },
  { id: 'dark-leaves', label: 'Very dark green leaves' },
  { id: 'foxtailing', label: 'Foxtailing buds' },
  { id: 'tiny-dots-leaves', label: 'Tiny dots/stippling on leaves' },
  { id: 'webbing', label: 'Webbing on plants' },
  { id: 'small-flies', label: 'Small flies around soil' },
  { id: 'yellowing-edges', label: 'Yellowing at leaf edges' },
  { id: 'brown-slimy-roots', label: 'Brown/slimy roots' },
  { id: 'foul-smell', label: 'Foul smell from roots/medium' },
  { id: 'lockout-symptoms', label: 'Multiple deficiency signs (lockout)' },
];
