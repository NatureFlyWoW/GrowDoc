// GrowDoc Companion — Plant Doctor UI

import { runDiagnosis, getRefineQuestions, buildContext, setDiagnosticData } from './doctor-engine.js';
import { CORE_SCORING, CORE_REFINE_RULES, SYMPTOM_OPTIONS } from './doctor-data.js';
import { generateContextualAdvice } from '../data/note-contextualizer/index.js';

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
    const advice = generateContextualAdvice(context.ctx, topCondition.condition);
    if (Array.isArray(advice) && advice.length > 0) {
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
      resultsArea.appendChild(planSection);
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
