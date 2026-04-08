// GrowDoc Companion — Plant Doctor UI

import { runDiagnosis, getRefineQuestions, buildContext, setDiagnosticData } from './doctor-engine.js';
import { CORE_SCORING, CORE_REFINE_RULES, SYMPTOM_OPTIONS } from './doctor-data.js';

/**
 * renderPlantDoctor(container, store) — Plant Doctor diagnostic view.
 */
export function renderPlantDoctor(container, store) {
  container.innerHTML = '';

  // Initialize scoring data
  setDiagnosticData(CORE_SCORING, CORE_REFINE_RULES);

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
