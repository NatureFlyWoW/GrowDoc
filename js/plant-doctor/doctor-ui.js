// GrowDoc Companion — Plant Doctor UI

import { runDiagnosis, getRefineQuestions, buildContext, setDiagnosticData } from './doctor-engine.js';
import { CORE_SCORING, CORE_REFINE_RULES, SYMPTOM_OPTIONS } from './doctor-data.js';
import { generateContextualAdvice } from '../data/note-contextualizer/index.js';

// ── Edge-Case Engine Integration ──────────────────────────────────────
//
// Attempt to import from edge-case-engine.js (may not exist yet during
// parallel development). Falls back to a local minimal implementation
// built directly from edge-case-knowledge.js.

let _ecGetBlockedActions = null;
let _ecGetActiveEdgeCases = null;

try {
  const eceMod = await import('../data/edge-case-engine.js');
  _ecGetBlockedActions = eceMod.getBlockedActions;
  _ecGetActiveEdgeCases = eceMod.getActiveEdgeCases;
} catch (_importErr) {
  // edge-case-engine.js not yet available — use local fallback below.
}

if (!_ecGetBlockedActions || !_ecGetActiveEdgeCases) {
  let _EDGE_CASES_DOCTOR = null;
  async function _loadEdgeCasesDoctor() {
    if (_EDGE_CASES_DOCTOR) return _EDGE_CASES_DOCTOR;
    try {
      const mod = await import('../data/edge-case-knowledge.js');
      _EDGE_CASES_DOCTOR = mod.EDGE_CASES || [];
    } catch (_e) {
      _EDGE_CASES_DOCTOR = [];
    }
    return _EDGE_CASES_DOCTOR;
  }

  function _extractRecentEventsDoctor(plant, grow) {
    const events = new Set();
    const logs = plant?.logs || [];
    const now = Date.now();
    for (const log of logs) {
      const ts = new Date(log.timestamp || log.date || 0).getTime();
      const ageHours = (now - ts) / 3600000;
      if (log.type === 'transplant' && ageHours <= 240) events.add('event-transplant');
      if (log.type === 'flush' && ageHours <= 120) events.add('treatment-flush');
      if (log.type === 'observe') {
        const n = (log.notes || log.details?.notes || '').toLowerCase();
        if (n.includes('heat') || n.includes('hot')) events.add('env-heatwave');
        if (n.includes('hermie') || n.includes('nanner')) events.add('NEW-KEYWORD:event-hermie');
        if (n.includes('bud rot') || n.includes('botrytis')) events.add('NEW-KEYWORD:event-bud-rot');
        if (n.includes('underwater') || n.includes('wilt')) events.add('watering-underwatered');
        if (n.includes('light leak')) events.add('env-light-leak');
      }
      if (log.type === 'feed' && log.details?.decreased) events.add('treatment-decreased-nutes');
    }
    return events;
  }

  function _extractPlantFlagsDoctor(plant) {
    const flags = new Set();
    if (plant?.plantType) flags.add(`plantType:${plant.plantType}`);
    if (plant?.previousProblems) {
      for (const p of (Array.isArray(plant.previousProblems) ? plant.previousProblems : [plant.previousProblems])) {
        flags.add(`previousProblems:${p}`);
      }
    }
    return flags;
  }

  function _edgeCaseMatchesDoctor(ec, stage, recentEvents, plantFlags) {
    const t = ec.trigger;
    if (t.stage && t.stage.length > 0 && !t.stage.includes(stage)) return false;
    if (t.plantFlags && t.plantFlags.length > 0) {
      for (const f of t.plantFlags) {
        if (!plantFlags.has(f)) return false;
      }
    }
    if (t.recentEvents && t.recentEvents.length > 0 && t.withinHours > 0) {
      const anyMatch = t.recentEvents.some(e => recentEvents.has(e));
      if (!anyMatch) return false;
    }
    return true;
  }

  _ecGetBlockedActions = async function({ plant, grow } = {}) {
    const cases = await _loadEdgeCasesDoctor();
    const blocked = new Set();
    const stage = plant?.stage || '';
    const recentEvents = _extractRecentEventsDoctor(plant, grow);
    const plantFlags = _extractPlantFlagsDoctor(plant);
    for (const ec of cases) {
      if (!_edgeCaseMatchesDoctor(ec, stage, recentEvents, plantFlags)) continue;
      for (const a of (ec.blockActions || [])) blocked.add(a);
    }
    return blocked;
  };

  _ecGetActiveEdgeCases = async function({ plant, grow } = {}) {
    const cases = await _loadEdgeCasesDoctor();
    const stage = plant?.stage || '';
    const recentEvents = _extractRecentEventsDoctor(plant, grow);
    const plantFlags = _extractPlantFlagsDoctor(plant);
    return cases.filter(ec => _edgeCaseMatchesDoctor(ec, stage, recentEvents, plantFlags));
  };
}

/**
 * renderPlantDoctor(container, store) — Plant Doctor diagnostic view.
 */
export function renderPlantDoctor(container, store) {
  container.innerHTML = '';

  // Initialize with core scoring data, then try to load full v3 dataset
  setDiagnosticData(CORE_SCORING, CORE_REFINE_RULES);
  _tryLoadV3Data();

  const context = buildContext(store);
  const selectedSymptoms = new Set();
  let results = [];

  const h1 = document.createElement('h1');
  h1.textContent = 'Plant Doctor';
  container.appendChild(h1);

  // Context info
  if (context.medium || context.stage) {
    const ctx = document.createElement('div');
    ctx.className = 'doctor-context text-muted';
    ctx.textContent = `Auto-detected: ${context.medium || '?'} medium, ${context.stage || '?'} stage, ${context.lighting || '?'} lighting`;
    container.appendChild(ctx);
  }

  // Symptom selector
  const h3 = document.createElement('h3');
  h3.textContent = 'What symptoms do you see?';
  container.appendChild(h3);

  const symptomGrid = document.createElement('div');
  symptomGrid.className = 'symptom-grid';

  for (const sym of SYMPTOM_OPTIONS) {
    const btn = document.createElement('button');
    btn.className = 'btn symptom-btn';
    btn.textContent = sym.label;
    btn.addEventListener('click', () => {
      if (selectedSymptoms.has(sym.id)) {
        selectedSymptoms.delete(sym.id);
        btn.classList.remove('btn-primary');
      } else {
        selectedSymptoms.add(sym.id);
        btn.classList.add('btn-primary');
      }
      _updateResults(container, [...selectedSymptoms], context, store);
    });
    symptomGrid.appendChild(btn);
  }
  container.appendChild(symptomGrid);

  // Results area
  const resultsArea = document.createElement('div');
  resultsArea.id = 'doctor-results';
  container.appendChild(resultsArea);
}

function _updateResults(container, symptoms, context, store) {
  const resultsArea = container.querySelector('#doctor-results');
  if (!resultsArea) return;
  resultsArea.innerHTML = '';

  if (symptoms.length === 0) return;

  const results = runDiagnosis(symptoms, context);

  if (results.length === 0) {
    resultsArea.innerHTML = '<p class="text-muted">No matching conditions found. Try selecting different symptoms.</p>';
    return;
  }

  const h3 = document.createElement('h3');
  h3.textContent = 'Possible Conditions';
  resultsArea.appendChild(h3);

  for (const r of results.slice(0, 5)) {
    const card = document.createElement('div');
    card.className = 'diagnosis-card';

    const header = document.createElement('div');
    header.className = 'diagnosis-header';

    const name = document.createElement('span');
    name.className = 'diagnosis-name';
    name.textContent = r.condition;

    const confidence = document.createElement('span');
    confidence.className = 'diagnosis-confidence';
    confidence.textContent = `${r.confidence}%`;
    if (r.confidence >= 60) confidence.style.color = 'var(--status-urgent)';
    else if (r.confidence >= 30) confidence.style.color = 'var(--status-action)';
    else confidence.style.color = 'var(--text-muted)';

    header.appendChild(name);
    header.appendChild(confidence);
    card.appendChild(header);

    const matches = document.createElement('div');
    matches.className = 'text-muted';
    matches.style.fontSize = '0.82rem';
    matches.textContent = `Matched: ${r.matchedSymptoms.join(', ')}`;
    card.appendChild(matches);

    // Save diagnosis button
    if (store) {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-sm';
      saveBtn.style.marginTop = 'var(--space-2)';
      saveBtn.textContent = 'Save Diagnosis';
      saveBtn.addEventListener('click', () => {
        const grow = store.getSnapshot().grow;
        if (grow && grow.plants && grow.plants.length > 0) {
          const plant = grow.plants[0]; // Default to first plant
          if (!plant.diagnoses) plant.diagnoses = [];
          plant.diagnoses.push({
            name: r.condition,
            confidence: r.confidence,
            symptoms: r.matchedSymptoms,
            date: new Date().toISOString(),
            outcome: 'pending',
          });
          store.commit('grow', grow);
          saveBtn.textContent = 'Saved ✓';
          saveBtn.disabled = true;
        }
      });
      card.appendChild(saveBtn);
    }

    resultsArea.appendChild(card);
  }

  // Section-05: Contextual "Your Action Plan" — only render when buildContext
  // produced a merged note ctx (otherwise fall through silently for backwards
  // compat with legacy launch sites that didn't carry a plant context).
  if (context && context.ctx && typeof context.ctx === 'object' && results.length > 0) {
    const topCondition = results[0];
    const rawAdvice = generateContextualAdvice(context.ctx, topCondition.condition);
    if (Array.isArray(rawAdvice) && rawAdvice.length > 0) {
      // Resolve the active plant from context so suppression can read its logs.
      const grow = store?.state?.grow || store?.getSnapshot?.()?.grow || {};
      const activePlant = (context.plantId && grow?.plants?.find(p => p.id === context.plantId)) ||
                          grow?.plants?.[0] || null;

      // Apply edge-case suppression. applyDoctorSuppression is async but we
      // render with the result after awaiting so the DOM update is deferred.
      applyDoctorSuppression(rawAdvice, activePlant, grow).then(({ advice, suppressed }) => {
        const planSection = document.createElement('div');
        planSection.className = 'doctor-action-plan';
        planSection.style.marginTop = 'var(--space-4)';

        const planH3 = document.createElement('h3');
        planH3.textContent = 'Your Action Plan';
        planSection.appendChild(planH3);

        for (const item of advice) {
          const row = document.createElement('div');
          row.className = 'doctor-advice';
          row.dataset.severity = item.severity || 'info';
          row.dataset.adviceId = item.id || '';
          row.dataset.citedObsIds = Array.isArray(item.citedObsIds) ? item.citedObsIds.join(',') : '';

          const h4 = document.createElement('h4');
          h4.textContent = item.headline || '';
          row.appendChild(h4);

          const p = document.createElement('p');
          p.textContent = item.detail || '';
          row.appendChild(p);

          planSection.appendChild(row);
        }

        // Render suppressed items as an expandable section so the grower can
        // see what was blocked and why. Do NOT silently discard.
        if (suppressed && suppressed.length > 0) {
          const suppressedToggle = document.createElement('details');
          suppressedToggle.className = 'doctor-suppressed-advice';
          suppressedToggle.style.marginTop = 'var(--space-3)';

          const summary = document.createElement('summary');
          summary.className = 'text-muted';
          summary.style.fontSize = '0.82rem';
          summary.textContent = `Hidden by edge-case guard (${suppressed.length})`;
          suppressedToggle.appendChild(summary);

          for (const s of suppressed) {
            const sRow = document.createElement('div');
            sRow.className = 'doctor-advice doctor-advice--suppressed';
            sRow.style.opacity = '0.5';
            sRow.dataset.severity = s.advice?.severity || 'info';

            const sH4 = document.createElement('h4');
            sH4.textContent = s.advice?.headline || '';
            sRow.appendChild(sH4);

            const sReason = document.createElement('p');
            sReason.className = 'text-muted';
            sReason.style.fontSize = '0.78rem';
            sReason.textContent = `Suppressed by edge-case guard: ${s.reason}`;
            sRow.appendChild(sReason);

            suppressedToggle.appendChild(sRow);
          }

          planSection.appendChild(suppressedToggle);
        }

        resultsArea.appendChild(planSection);
      }).catch(() => {
        // Suppression failure — render original advice without filtering.
        const planSection = document.createElement('div');
        planSection.className = 'doctor-action-plan';
        planSection.style.marginTop = 'var(--space-4)';

        const planH3 = document.createElement('h3');
        planH3.textContent = 'Your Action Plan';
        planSection.appendChild(planH3);

        for (const item of rawAdvice) {
          const row = document.createElement('div');
          row.className = 'doctor-advice';
          row.dataset.severity = item.severity || 'info';
          row.dataset.adviceId = item.id || '';

          const h4 = document.createElement('h4');
          h4.textContent = item.headline || '';
          row.appendChild(h4);

          const p = document.createElement('p');
          p.textContent = item.detail || '';
          row.appendChild(p);

          planSection.appendChild(row);
        }
        resultsArea.appendChild(planSection);
      });
    }
  }

  // Refine questions
  const questions = getRefineQuestions(results);
  if (questions.length > 0) {
    const refineSection = document.createElement('div');
    refineSection.style.marginTop = 'var(--space-4)';
    const h4 = document.createElement('h4');
    h4.textContent = 'Refining Questions';
    refineSection.appendChild(h4);

    for (const q of questions.slice(0, 4)) {
      const qDiv = document.createElement('div');
      qDiv.className = 'refine-question';
      qDiv.textContent = q.question;
      refineSection.appendChild(qDiv);
    }
    resultsArea.appendChild(refineSection);
  }
}

// Try to load the full v3 Plant Doctor data at runtime.
// The v3 data lives at /docs/plant-doctor-data.js — now an ES module
// exporting SYMPTOMS (obj), SCORING (obj), REFINE_RULES (array).
let _v3Loaded = false;
async function _tryLoadV3Data() {
  if (_v3Loaded) return;
  try {
    const mod = await import('/docs/plant-doctor-data.js');
    const { SCORING, REFINE_RULES } = mod;

    // SCORING is an object keyed by diagnosis id (e.g. 'r-n-def') with
    // { symptoms, stage_modifier?, medium_modifier?, lighting_modifier?, base_confidence }.
    // Flatten to the [{ condition, symptom, weight, contextBoost }] shape
    // the companion's scoring engine expects.
    if (!SCORING || typeof SCORING !== 'object') return;

    const scoring = [];
    for (const diagId in SCORING) {
      if (!Object.prototype.hasOwnProperty.call(SCORING, diagId)) continue;
      const entry = SCORING[diagId];
      if (!entry || !entry.symptoms) continue;
      for (const symptomId in entry.symptoms) {
        if (!Object.prototype.hasOwnProperty.call(entry.symptoms, symptomId)) continue;
        scoring.push({
          condition: diagId,
          symptom: symptomId,
          weight: entry.symptoms[symptomId],
          contextBoost: null,
        });
      }
    }

    const refineRules = (REFINE_RULES || [])
      .filter(r => r && r.question)
      .map(r => ({
        condition: r.id || 'refine',
        question: r.question,
        yesBoost: 15,
        noBoost: -10,
      }));

    if (scoring.length > 0) {
      setDiagnosticData(scoring, refineRules.length > 0 ? refineRules : CORE_REFINE_RULES);
      _v3Loaded = true;
      console.log(`Plant Doctor: loaded ${scoring.length} v3 scoring rules`);
    }
  } catch (err) {
    // Silently fall back to core data — v3 data is optional
    console.warn('Plant Doctor: v3 data not available, using core dataset', err.message);
  }
}

// ── Doctor Edge-Case Suppression Helpers ──────────────────────────────

/**
 * _deriveAdviceActionId(advice) — Map a contextual advice item to the
 * blockActions taxonomy used in edge-case-knowledge.js.
 *
 * NOTE: This mapping is intentionally heuristic. Advice items from
 * rules-advice.js are keyed by appliesTo + headline text, not by a
 * machine-readable action id. The mappings below cover the high-confidence
 * cases; ambiguous rules are left at 'unknown' and will not trigger
 * suppression (conservative default).
 *
 * Uncertainty: Mg deficiency advice rules share headlines with pH-lockout
 * recovery advice in some cases — pH correction should never be suppressed.
 * We only map explicit "add Mg" / "add cal-mag" headlines, not pH-fix rules.
 *
 * @param {Object} advice — advice item from generateContextualAdvice()
 * @returns {string}
 */
function _deriveAdviceActionId(advice) {
  const headline = (advice.headline || '').toLowerCase();
  const detail = (advice.detail || '').toLowerCase();
  const appliesTo = (advice.appliesTo || '').toLowerCase();
  const id = (advice.id || '').toLowerCase();

  // Mg / cal-mag deficiency advice → 'add-epsom'
  if (headline.includes('cal-mag') || headline.includes('calcium') || headline.includes('magnesium') ||
      detail.includes('cal-mag') || id.includes('mg-def') || id.includes('calmag')) {
    // Exception: if the headline is about pH correction, do not suppress.
    if (headline.includes('ph') || headline.includes('flush') || detail.includes('runoff ph')) return 'unknown';
    return 'add-epsom';
  }

  // Iron deficiency advice → 'add-iron'
  if (headline.includes('iron') || headline.includes(' fe ') || id.includes('fe-def') ||
      detail.includes('iron chelate') || detail.includes('ferrous')) {
    return 'add-iron';
  }

  // Phosphorus deficiency advice → 'add-phosphorus'
  // NOTE: pH correction (flush + lower pH) is explicitly excluded — pH fix IS
  // the correct action in most edge cases and must not be suppressed.
  if ((headline.includes('phosphorus') || headline.includes('phosphate') || id.includes('p-def')) &&
      !headline.includes('ph') && !detail.includes('runoff ph') && !detail.includes('flush')) {
    return 'add-phosphorus';
  }

  // Feed / nutrient advice
  if (appliesTo.includes('nutrient') || appliesTo.includes('deficiency') ||
      headline.includes('feed') || headline.includes('nutrients') || id.includes('feed')) {
    // Avoid catching pH-correction advice under feed suppression
    if (headline.includes('ph') || headline.includes('flush')) return 'unknown';
    return 'feed-nutrients';
  }

  // Flush recommendations
  if (headline.includes('flush') || detail.includes('flush') || id.includes('flush')) {
    return 'flush-again';
  }

  // Defoliation advice
  if (headline.includes('defoli') || detail.includes('defoli') || id.includes('defol')) {
    return 'defoliate';
  }

  return 'unknown';
}

/**
 * _findSuppressingEdgeCase(advice, edgeCases) — Find the edge case that
 * triggered the suppression of an advice item.
 *
 * @param {Object} advice
 * @param {Object[]} edgeCases
 * @returns {Object|null}
 */
function _findSuppressingEdgeCase(advice, edgeCases) {
  const actionId = _deriveAdviceActionId(advice);
  if (actionId === 'unknown') return null;
  return edgeCases.find(ec => (ec.blockActions || []).includes(actionId)) || null;
}

/**
 * applyDoctorSuppression(advice, plant, grow) — Filter advice blocked by
 * active edge cases and return suppressed items separately so the UI can
 * render an expandable "Hidden by edge-case guard" disclosure.
 *
 * Returns { advice: kept[], suppressed: [{ advice, reason }] }.
 * Suppressed items are NEVER silently dropped — they must be disclosed.
 *
 * @param {Object[]} advice
 * @param {Object|null} plant
 * @param {Object} grow
 * @returns {Promise<{ advice: Object[], suppressed: Array<{advice: Object, reason: string}> }>}
 */
async function applyDoctorSuppression(advice, plant, grow) {
  if (!plant) return { advice, suppressed: [] };
  try {
    const [blocked, edgeCases] = await Promise.all([
      _ecGetBlockedActions({ plant, grow }),
      _ecGetActiveEdgeCases({ plant, grow }),
    ]);

    if (!blocked || blocked.size === 0) return { advice, suppressed: [] };

    const suppressed = [];
    const kept = advice.filter(a => {
      const actionId = _deriveAdviceActionId(a);
      if (actionId === 'unknown') return true; // Conservative: never suppress unknowns
      if (blocked.has(actionId)) {
        const ec = _findSuppressingEdgeCase(a, edgeCases);
        suppressed.push({ advice: a, reason: ec?.id || 'blocked' });
        return false;
      }
      return true;
    });

    return { advice: kept, suppressed };
  } catch (_err) {
    // Suppression must never crash the plant doctor.
    return { advice, suppressed: [] };
  }
}
