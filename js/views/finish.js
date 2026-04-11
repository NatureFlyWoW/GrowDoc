// GrowDoc Companion — Harvest Outcome / Finish View
//
// Section 07: When the user advances a plant out of curing, route here
// to capture yield/quality/notes. On submit, set plant.stage='done'
// and persist outcome on the plant. The 'done' stage is excluded from
// task generation by Section 02's blocksTaskGeneration flag.

import { navigate } from '../router.js';

/**
 * Returns YYYY-MM-DD in the user's local timezone (NOT UTC).
 * Critical for streaks/dates that should align with the user's day boundary.
 */
export function localDate(d = new Date()) {
  return d.toLocaleDateString('en-CA');
}

export function renderFinish(container, store) {
  container.innerHTML = '';

  // Read plantId from URL query string. Router handles the param parse.
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const plantId = params.get('plantId');

  const grow = store.state.grow;
  const plant = plantId
    ? (grow?.plants || []).find(p => p.id === plantId)
    : null;

  if (!plant) {
    const empty = document.createElement('div');
    empty.style.maxWidth = '500px';
    empty.style.margin = '40px auto';
    empty.style.padding = '24px';
    empty.style.textAlign = 'center';
    const h2 = document.createElement('h2');
    h2.textContent = 'No plant to finish';
    empty.appendChild(h2);
    const p = document.createElement('p');
    p.className = 'text-muted';
    p.textContent = 'Open this page from a plant in the curing stage to record its outcome.';
    empty.appendChild(p);
    const back = document.createElement('button');
    back.className = 'btn btn-primary';
    back.textContent = 'Back to dashboard';
    back.addEventListener('click', () => navigate('/'));
    empty.appendChild(back);
    container.appendChild(empty);
    return;
  }

  // If outcome already exists, show summary instead of form
  if (plant.outcome) {
    _renderSummary(container, plant);
    return;
  }

  _renderForm(container, plant, store);
}

function _renderForm(container, plant, store) {
  const wrapper = document.createElement('div');
  wrapper.style.maxWidth = '600px';
  wrapper.style.margin = '24px auto';
  wrapper.style.padding = '24px';

  const h1 = document.createElement('h1');
  h1.textContent = `Finish ${plant.name}`;
  wrapper.appendChild(h1);

  const intro = document.createElement('p');
  intro.className = 'text-muted';
  intro.textContent = 'Record the outcome of this grow. All fields except dry yield are optional. The plant will move to the Completed stage and stop generating tasks.';
  wrapper.appendChild(intro);

  // Yield (number, required)
  const yieldGroup = _field('Dry yield (grams)');
  const yieldInput = document.createElement('input');
  yieldInput.type = 'number';
  yieldInput.className = 'input';
  yieldInput.min = '0';
  yieldInput.step = '0.1';
  yieldInput.placeholder = 'e.g. 85';
  yieldGroup.appendChild(yieldInput);
  wrapper.appendChild(yieldGroup);

  // Quality (1-10 slider)
  const qualityGroup = _field('Quality rating (1-10)');
  const qualityRow = document.createElement('div');
  qualityRow.style.display = 'flex';
  qualityRow.style.alignItems = 'center';
  qualityRow.style.gap = '12px';
  const qualityInput = document.createElement('input');
  qualityInput.type = 'range';
  qualityInput.min = '1';
  qualityInput.max = '10';
  qualityInput.value = '7';
  qualityInput.style.flex = '1';
  const qualityValue = document.createElement('span');
  qualityValue.textContent = '7';
  qualityValue.style.fontWeight = '600';
  qualityValue.style.minWidth = '24px';
  qualityInput.addEventListener('input', () => { qualityValue.textContent = qualityInput.value; });
  qualityRow.appendChild(qualityInput);
  qualityRow.appendChild(qualityValue);
  qualityGroup.appendChild(qualityRow);
  wrapper.appendChild(qualityGroup);

  // Terpene notes
  const terpenesGroup = _field('Terpene notes');
  const terpenesInput = document.createElement('textarea');
  terpenesInput.className = 'input';
  terpenesInput.rows = 2;
  terpenesInput.placeholder = 'e.g. citrus-forward, hint of fuel, sweet finish';
  terpenesGroup.appendChild(terpenesInput);
  wrapper.appendChild(terpenesGroup);

  // Effect notes
  const effectGroup = _field('Effect notes');
  const effectInput = document.createElement('textarea');
  effectInput.className = 'input';
  effectInput.rows = 2;
  effectInput.placeholder = 'e.g. heady, energetic, no couch lock';
  effectGroup.appendChild(effectInput);
  wrapper.appendChild(effectGroup);

  // Would grow again
  const growAgainGroup = _field('Would you grow this strain again?');
  const growAgainRow = document.createElement('div');
  growAgainRow.style.display = 'flex';
  growAgainRow.style.gap = '8px';
  const radioMap = {};
  for (const opt of ['yes', 'maybe', 'no']) {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '4px';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'growAgain';
    radio.value = opt;
    if (opt === 'yes') radio.checked = true;
    radioMap[opt] = radio;
    label.appendChild(radio);
    label.appendChild(document.createTextNode(opt.charAt(0).toUpperCase() + opt.slice(1)));
    growAgainRow.appendChild(label);
  }
  growAgainGroup.appendChild(growAgainRow);
  wrapper.appendChild(growAgainGroup);

  // Lessons learned
  const lessonsGroup = _field('Lessons learned (for next time)');
  const lessonsInput = document.createElement('textarea');
  lessonsInput.className = 'input';
  lessonsInput.rows = 3;
  lessonsInput.placeholder = 'e.g. Stretched more than expected — top earlier next run.';
  lessonsGroup.appendChild(lessonsInput);
  wrapper.appendChild(lessonsGroup);

  // Submit + cancel
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '12px';
  actions.style.marginTop = '24px';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = 'Finish grow';
  submitBtn.addEventListener('click', () => {
    const yieldNum = parseFloat(yieldInput.value);
    if (!Number.isFinite(yieldNum) || yieldNum < 0) {
      alert('Please enter a dry yield value (grams). Use 0 if no usable yield.');
      yieldInput.focus();
      return;
    }
    _saveOutcome(store, plant.id, {
      dryYieldGrams: yieldNum,
      qualityRating: parseInt(qualityInput.value, 10),
      terpeneNotes: terpenesInput.value.trim(),
      effectNotes: effectInput.value.trim(),
      growAgain: Object.entries(radioMap).find(([, r]) => r.checked)?.[0] || 'maybe',
      lessonsLearned: lessonsInput.value.trim(),
    });
    // Re-render — will now show summary
    renderFinish(container, store);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => navigate('/'));

  actions.appendChild(submitBtn);
  actions.appendChild(cancelBtn);
  wrapper.appendChild(actions);

  container.appendChild(wrapper);
}

function _renderSummary(container, plant) {
  const wrapper = document.createElement('div');
  wrapper.style.maxWidth = '600px';
  wrapper.style.margin = '24px auto';
  wrapper.style.padding = '24px';
  wrapper.style.textAlign = 'center';

  const h1 = document.createElement('h1');
  h1.textContent = '🎉 Grow complete!';
  wrapper.appendChild(h1);

  const card = document.createElement('div');
  card.className = 'card';
  card.style.padding = '24px';
  card.style.marginTop = '16px';
  card.style.background = 'var(--bg-elevated, #fafafa)';
  card.style.borderRadius = '12px';
  card.style.textAlign = 'left';

  const strainName = plant.strainCustom?.name || plant.name;
  const summary = document.createElement('h3');
  summary.textContent = `${strainName} — ${plant.outcome.dryYieldGrams}g, ${plant.outcome.qualityRating}/10`;
  summary.style.marginTop = '0';
  card.appendChild(summary);

  if (plant.outcome.terpeneNotes) {
    const t = document.createElement('p');
    t.innerHTML = '<strong>Terpenes:</strong> ';
    t.appendChild(document.createTextNode(plant.outcome.terpeneNotes));
    card.appendChild(t);
  }
  if (plant.outcome.effectNotes) {
    const e = document.createElement('p');
    e.innerHTML = '<strong>Effects:</strong> ';
    e.appendChild(document.createTextNode(plant.outcome.effectNotes));
    card.appendChild(e);
  }
  if (plant.outcome.growAgain) {
    const g = document.createElement('p');
    g.innerHTML = '<strong>Would grow again:</strong> ';
    g.appendChild(document.createTextNode(plant.outcome.growAgain));
    card.appendChild(g);
  }
  if (plant.outcome.lessonsLearned) {
    const l = document.createElement('p');
    l.innerHTML = '<strong>Lessons learned:</strong> ';
    l.appendChild(document.createTextNode(plant.outcome.lessonsLearned));
    card.appendChild(l);
  }

  wrapper.appendChild(card);

  const back = document.createElement('button');
  back.className = 'btn btn-primary';
  back.textContent = 'Back to dashboard';
  back.style.marginTop = '24px';
  back.addEventListener('click', () => navigate('/'));
  wrapper.appendChild(back);

  container.appendChild(wrapper);
}

function _saveOutcome(store, plantId, outcome) {
  const growSnap = store.getSnapshot().grow;
  const plant = growSnap.plants.find(p => p.id === plantId);
  if (!plant) return;
  plant.outcome = outcome;
  plant.stage = 'done';
  plant.finishedDate = localDate();
  store.commit('grow', growSnap);
}

function _field(labelText) {
  const group = document.createElement('div');
  group.style.marginTop = '16px';
  const label = document.createElement('label');
  label.style.display = 'block';
  label.style.fontSize = '0.85rem';
  label.style.color = 'var(--text-muted)';
  label.style.marginBottom = '4px';
  label.textContent = labelText;
  group.appendChild(label);
  return group;
}
