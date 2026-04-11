// GrowDoc Companion — Landing Page & Onboarding Wizard

import { navigate } from '../router.js';
import { generateId } from '../utils.js';
import { POT_SIZES } from '../data/constants.js';
import { renderStarRating, renderEffectSelector } from '../components/star-rating.js';
import { parseProfileNotes, NOTE_PLACEHOLDERS } from '../data/profile-context-rules.js';

// ── Stage Options ──────────────────────────────────────────────────────

const STAGES = [
  { id: 'germination', label: 'Germination' },
  { id: 'seedling', label: 'Seedling' },
  { id: 'early-veg', label: 'Early Veg' },
  { id: 'late-veg', label: 'Late Veg' },
  { id: 'transition', label: 'Transition' },
  { id: 'early-flower', label: 'Early Flower' },
  { id: 'mid-flower', label: 'Mid Flower' },
  { id: 'late-flower', label: 'Late Flower' },
  { id: 'ripening', label: 'Ripening' },
  { id: 'harvest', label: 'Harvest' },
  { id: 'drying', label: 'Drying' },
  { id: 'curing', label: 'Curing' },
  { id: 'planning', label: 'Planning / Not started' },
];

const MEDIUMS = [
  { id: 'soil', label: 'Soil', desc: 'Traditional, forgiving, organic-friendly' },
  { id: 'coco', label: 'Coco', desc: 'Fast growth, good drainage, frequent feeding' },
  { id: 'hydro', label: 'Hydro', desc: 'Maximum control, fastest growth' },
  { id: 'soilless', label: 'Soilless', desc: 'Peat/perlite mix, hybrid approach' },
];

const LIGHTS = [
  { id: 'led', label: 'LED' },
  { id: 'hps', label: 'HPS' },
  { id: 'cfl', label: 'CFL' },
  { id: 'fluorescent', label: 'Fluorescent' },
];

const EXPERIENCE_LEVELS = [
  { id: 'first-grow', label: 'First Grow', desc: 'Brand new to growing' },
  { id: 'beginner', label: 'Beginner', desc: 'A grow or two under your belt' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable with the basics' },
  { id: 'advanced', label: 'Advanced', desc: 'Dialing in for optimal results' },
  { id: 'expert', label: 'Expert', desc: 'You could write the guides' },
];

const TOTAL_STEPS = 10;

// ── Landing Page ───────────────────────────────────────────────────────

export function renderLanding(container) {
  container.innerHTML = '';

  const landing = document.createElement('div');
  landing.className = 'landing';

  const brand = document.createElement('h1');
  brand.className = 'landing-brand';
  brand.textContent = 'GrowDoc';
  landing.appendChild(brand);

  const tagline = document.createElement('p');
  tagline.className = 'landing-tagline';
  tagline.textContent = 'Your daily cannabis grow companion';
  landing.appendChild(tagline);

  const features = document.createElement('div');
  features.className = 'landing-features';

  const featureData = [
    { title: 'Daily Task Engine', desc: 'Know exactly what to do each day based on your grow stage, plants, and priorities.' },
    { title: 'Environment Optimization', desc: 'VPD, DLI, and nutrient targets tuned to your setup and medium.' },
    { title: 'Diagnostic Tools', desc: 'Identify and fix plant problems fast with evidence-based advice.' },
  ];

  for (const f of featureData) {
    const card = document.createElement('div');
    card.className = 'landing-feature';
    const title = document.createElement('div');
    title.className = 'landing-feature-title';
    title.textContent = f.title;
    const desc = document.createElement('div');
    desc.className = 'landing-feature-desc';
    desc.textContent = f.desc;
    card.appendChild(title);
    card.appendChild(desc);
    features.appendChild(card);
  }
  landing.appendChild(features);

  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = 'Get Started';
  btn.style.fontSize = '1.1rem';
  btn.style.padding = '12px 32px';
  btn.addEventListener('click', () => navigate('/setup'));
  landing.appendChild(btn);

  container.appendChild(landing);
}

// ── Onboarding Wizard ──────────────────────────────────────────────────

let _store = null;

const _defaultState = () => ({
  step: 1,
  stage: null,
  medium: null,
  lighting: null,
  lightWattage: null,
  plantCount: 3,
  potSize: null,
  strainName: '',
  strainPerPlant: false,
  strainNames: [],
  spaceL: null,
  spaceW: null,
  spaceH: null,
  experience: null,
  priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 },
  targetEffect: null,
  notes: { stage: '', medium: '', lighting: '', strain: '', space: '', priorities: '' },
});

let _wizardState = _defaultState();

export function renderOnboarding(container, store) {
  _store = store || window.__growdocStore;
  _wizardState = _defaultState();
  _renderWizard(container);
}

function _renderWizard(container) {
  container.innerHTML = '';

  const wizard = document.createElement('div');
  wizard.className = 'wizard';

  // Progress dots
  const progress = document.createElement('div');
  progress.className = 'wizard-progress';
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const dot = document.createElement('div');
    dot.className = 'wizard-dot';
    if (i < _wizardState.step) dot.classList.add('completed');
    if (i === _wizardState.step) dot.classList.add('current');
    progress.appendChild(dot);
  }
  wizard.appendChild(progress);

  // Step content
  const stepDiv = document.createElement('div');
  stepDiv.className = 'wizard-step';
  _renderStep(stepDiv, _wizardState.step);
  wizard.appendChild(stepDiv);

  // Navigation
  const nav = document.createElement('div');
  nav.className = 'wizard-nav';

  if (_wizardState.step > 1) {
    const backBtn = document.createElement('button');
    backBtn.className = 'btn';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', () => {
      _wizardState.step--;
      _renderWizard(container);
    });
    nav.appendChild(backBtn);
  } else {
    nav.appendChild(document.createElement('span'));
  }

  if (_wizardState.step < TOTAL_STEPS) {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', () => {
      const validation = _validateStep(_wizardState.step);
      if (!validation.valid) {
        _showStepError(stepDiv, validation.error);
        return;
      }
      _wizardState.step++;
      _renderWizard(container);
    });
    nav.appendChild(nextBtn);
  }

  wizard.appendChild(nav);
  container.appendChild(wizard);

  // Keyboard navigation
  container.onkeydown = (e) => {
    // Don't intercept Enter on form elements
    const tag = e.target.tagName;
    if (e.key === 'Enter' && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) return;

    if (e.key === 'Enter' && _wizardState.step < TOTAL_STEPS) {
      const validation = _validateStep(_wizardState.step);
      if (validation.valid) {
        _wizardState.step++;
        _renderWizard(container);
      }
    } else if (e.key === 'Escape' && _wizardState.step > 1 && _wizardState.step < TOTAL_STEPS) {
      _wizardState.step--;
      _renderWizard(container);
    }
  };
}

function _showStepError(stepDiv, msg) {
  let errEl = stepDiv.querySelector('.step-error');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'step-error';
    errEl.style.color = 'var(--status-urgent)';
    errEl.style.fontSize = '0.85rem';
    errEl.style.marginTop = 'var(--space-2)';
    stepDiv.appendChild(errEl);
  }
  errEl.textContent = msg;
}

// ── Step Renderers ─────────────────────────────────────────────────────

function _renderStep(container, step) {
  const renderers = {
    1: _renderStageStep,
    2: _renderMediumStep,
    3: _renderLightingStep,
    4: _renderPlantCountStep,
    5: _renderPotSizeStep,
    6: _renderStrainStep,
    7: _renderSpaceStep,
    8: _renderExperienceStep,
    9: _renderPriorityStep,
    10: _renderSummaryStep,
  };
  const render = renderers[step];
  if (render) render(container);
}

function _renderSelectionCards(container, title, options, currentValue, onSelect) {
  const h2 = document.createElement('h2');
  h2.textContent = title;
  container.appendChild(h2);

  const cards = document.createElement('div');
  cards.className = 'selection-cards';
  cards.setAttribute('role', 'radiogroup');
  cards.setAttribute('aria-label', title);

  for (const opt of options) {
    const card = document.createElement('div');
    card.className = 'selection-card' + (currentValue === opt.id ? ' selected' : '');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', String(currentValue === opt.id));

    const label = document.createElement('div');
    label.className = 'selection-card-label';
    label.textContent = opt.label;
    card.appendChild(label);

    if (opt.desc) {
      const desc = document.createElement('div');
      desc.className = 'selection-card-desc';
      desc.textContent = opt.desc;
      card.appendChild(desc);
    }

    card.addEventListener('click', () => onSelect(opt.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(opt.id);
      }
    });
    cards.appendChild(card);
  }
  container.appendChild(cards);
}

function _renderContextNotes(container, stepKey) {
  const placeholder = NOTE_PLACEHOLDERS[stepKey] || 'Add any relevant context...';
  const details = document.createElement('details');
  details.className = 'context-notes';

  const summary = document.createElement('summary');
  summary.textContent = 'Add context (optional)';
  details.appendChild(summary);

  const textarea = document.createElement('textarea');
  textarea.className = 'input context-notes-input';
  textarea.rows = 2;
  textarea.placeholder = placeholder;
  textarea.value = _wizardState.notes[stepKey] || '';
  textarea.addEventListener('input', () => {
    _wizardState.notes[stepKey] = textarea.value;
  });
  details.appendChild(textarea);

  const hint = document.createElement('div');
  hint.className = 'text-muted';
  hint.style.fontSize = '0.75rem';
  hint.style.marginTop = 'var(--space-1)';
  hint.textContent = 'Helps personalize your recommendations';
  details.appendChild(hint);

  // Auto-open if already has content
  if (_wizardState.notes[stepKey]) details.open = true;

  container.appendChild(details);
}

function _renderStageStep(container) {
  _renderSelectionCards(container, 'What stage is your grow?', STAGES, _wizardState.stage, (id) => {
    _wizardState.stage = id;
    container.innerHTML = '';
    _renderStageStep(container);
  });
  _renderContextNotes(container, 'stage');
}

function _renderMediumStep(container) {
  _renderSelectionCards(container, "What's your growing medium?", MEDIUMS, _wizardState.medium, (id) => {
    _wizardState.medium = id;
    container.innerHTML = '';
    _renderMediumStep(container);
  });
  _renderContextNotes(container, 'medium');
}

function _renderLightingStep(container) {
  _renderSelectionCards(container, 'What lighting are you using?', LIGHTS, _wizardState.lighting, (id) => {
    _wizardState.lighting = id;
    container.innerHTML = '';
    _renderLightingStep(container);
  });

  // Optional wattage field
  const field = document.createElement('div');
  field.className = 'wizard-field';
  const label = document.createElement('label');
  label.textContent = 'Wattage (optional)';
  label.setAttribute('for', 'wattage-input');
  const input = document.createElement('input');
  input.type = 'number';
  input.id = 'wattage-input';
  input.className = 'input';
  input.placeholder = 'e.g., 300';
  input.min = '1';
  input.value = _wizardState.lightWattage || '';
  input.addEventListener('input', () => {
    _wizardState.lightWattage = input.value ? parseInt(input.value, 10) : null;
  });
  field.appendChild(label);
  field.appendChild(input);
  container.appendChild(field);
  _renderContextNotes(container, 'lighting');
}

function _renderPlantCountStep(container) {
  const h2 = document.createElement('h2');
  h2.textContent = 'How many plants?';
  container.appendChild(h2);

  const field = document.createElement('div');
  field.className = 'wizard-field';
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'input';
  input.min = '1';
  input.max = '20';
  input.value = _wizardState.plantCount;
  input.style.maxWidth = '120px';
  input.style.fontSize = '1.2rem';
  input.style.textAlign = 'center';
  input.addEventListener('input', () => {
    _wizardState.plantCount = parseInt(input.value, 10) || 0;
  });
  field.appendChild(input);
  container.appendChild(field);
}

function _renderPotSizeStep(container) {
  const h2 = document.createElement('h2');
  h2.textContent = 'What pot size?';
  container.appendChild(h2);

  const cards = document.createElement('div');
  cards.className = 'selection-cards';
  for (const size of POT_SIZES) {
    const card = document.createElement('div');
    card.className = 'selection-card' + (_wizardState.potSize === size ? ' selected' : '');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', String(_wizardState.potSize === size));
    card.textContent = size >= 20 ? '20L+' : size + 'L';
    card.addEventListener('click', () => {
      _wizardState.potSize = size;
      container.innerHTML = '';
      _renderPotSizeStep(container);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        _wizardState.potSize = size;
        container.innerHTML = '';
        _renderPotSizeStep(container);
      }
    });
    cards.appendChild(card);
  }
  container.appendChild(cards);
}

function _renderStrainStep(container) {
  const h2 = document.createElement('h2');
  h2.textContent = 'What strain(s)?';
  container.appendChild(h2);

  // Fallback: simple text input (strain picker from section 05 not yet available)
  const field = document.createElement('div');
  field.className = 'wizard-field';
  const label = document.createElement('label');
  label.textContent = 'Strain name';
  label.setAttribute('for', 'strain-input');
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'strain-input';
  input.className = 'input';
  input.placeholder = 'e.g., Northern Lights, Blue Dream';
  input.value = _wizardState.strainName;
  input.addEventListener('input', () => {
    _wizardState.strainName = input.value;
  });
  field.appendChild(label);
  field.appendChild(input);
  container.appendChild(field);

  const hint = document.createElement('p');
  hint.className = 'text-muted';
  hint.style.fontSize = '0.82rem';
  hint.textContent = 'You can add more strains and assign per-plant later.';
  container.appendChild(hint);
  _renderContextNotes(container, 'strain');
}

function _renderSpaceStep(container) {
  const h2 = document.createElement('h2');
  h2.textContent = 'How big is your grow space?';
  container.appendChild(h2);

  const hint = document.createElement('p');
  hint.className = 'text-muted';
  hint.style.marginBottom = 'var(--space-4)';
  hint.textContent = 'Optional — helps calculate DLI and plant density.';
  container.appendChild(hint);

  const dims = [
    { key: 'spaceL', label: 'Length (cm)' },
    { key: 'spaceW', label: 'Width (cm)' },
    { key: 'spaceH', label: 'Height (cm)' },
  ];

  for (const dim of dims) {
    const field = document.createElement('div');
    field.className = 'wizard-field';
    const label = document.createElement('label');
    label.textContent = dim.label;
    label.setAttribute('for', `space-${dim.key}`);
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `space-${dim.key}`;
    input.className = 'input';
    input.placeholder = 'cm';
    input.min = '1';
    input.style.maxWidth = '140px';
    input.value = _wizardState[dim.key] || '';
    input.addEventListener('input', () => {
      _wizardState[dim.key] = input.value ? parseInt(input.value, 10) : null;
    });
    field.appendChild(label);
    field.appendChild(input);
    container.appendChild(field);
  }
  _renderContextNotes(container, 'space');
}

function _renderExperienceStep(container) {
  _renderSelectionCards(container, "What's your experience level?", EXPERIENCE_LEVELS, _wizardState.experience, (id) => {
    _wizardState.experience = id;
    container.innerHTML = '';
    _renderExperienceStep(container);
  });
}

function _renderPriorityStep(container) {
  const h2 = document.createElement('h2');
  h2.textContent = 'What are your priorities?';
  container.appendChild(h2);

  const priorities = [
    { key: 'yield', label: 'Yield', color: 'var(--priority-yield)' },
    { key: 'quality', label: 'Quality', color: 'var(--priority-quality)' },
    { key: 'terpenes', label: 'Terpenes', color: 'var(--priority-terpenes)' },
    { key: 'effect', label: 'Effect', color: 'var(--priority-effect)' },
  ];

  // Effect selector (created first so we can wire it to the Effect star rating)
  let effectSelector = null;

  for (const p of priorities) {
    const group = document.createElement('div');
    group.className = 'priority-group-onboarding';

    renderStarRating(group, {
      name: p.key,
      label: p.label,
      color: p.color,
      value: _wizardState.priorities[p.key],
      onChange: (v) => {
        _wizardState.priorities[p.key] = v;
        // Show/hide effect selector based on Effect rating
        if (p.key === 'effect' && effectSelector) {
          if (v >= 3) {
            effectSelector.show();
          } else {
            effectSelector.hide();
            _wizardState.targetEffect = null;
          }
        }
      },
    });

    container.appendChild(group);
  }

  // Effect type selector
  effectSelector = renderEffectSelector(container, {
    value: _wizardState.targetEffect,
    onChange: (v) => { _wizardState.targetEffect = v; },
    visible: _wizardState.priorities.effect >= 3,
  });

  _renderContextNotes(container, 'priorities');
}

function _renderSummaryStep(container) {
  const h2 = document.createElement('h2');
  h2.textContent = 'Your Grow Setup';
  container.appendChild(h2);

  const sections = [
    { label: 'Stage', value: STAGES.find(s => s.id === _wizardState.stage)?.label || 'Not set', editStep: 1 },
    { label: 'Medium', value: MEDIUMS.find(m => m.id === _wizardState.medium)?.label || 'Not set', editStep: 2 },
    { label: 'Lighting', value: (LIGHTS.find(l => l.id === _wizardState.lighting)?.label || 'Not set') + (_wizardState.lightWattage ? ` (${_wizardState.lightWattage}W)` : ''), editStep: 3 },
    { label: 'Plants', value: `${_wizardState.plantCount} plant${_wizardState.plantCount !== 1 ? 's' : ''}`, editStep: 4 },
    { label: 'Pot Size', value: _wizardState.potSize ? (_wizardState.potSize >= 20 ? '20L+' : _wizardState.potSize + 'L') : 'Not set', editStep: 5 },
    { label: 'Strain', value: _wizardState.strainName || 'Not specified', editStep: 6 },
    { label: 'Space', value: _wizardState.spaceL ? `${_wizardState.spaceL} x ${_wizardState.spaceW} x ${_wizardState.spaceH} cm` : 'Not specified', editStep: 7 },
    { label: 'Experience', value: EXPERIENCE_LEVELS.find(e => e.id === _wizardState.experience)?.label || 'Not set', editStep: 8 },
    { label: 'Priorities', value: `Y:${_wizardState.priorities.yield} Q:${_wizardState.priorities.quality} T:${_wizardState.priorities.terpenes} E:${_wizardState.priorities.effect}`, editStep: 9 },
  ];

  if (_wizardState.targetEffect) {
    sections.push({ label: 'Target Effect', value: _wizardState.targetEffect.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), editStep: 9 });
  }

  for (const s of sections) {
    const row = document.createElement('div');
    row.className = 'summary-section';

    const left = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'summary-label';
    label.textContent = s.label;
    const value = document.createElement('div');
    value.className = 'summary-value';
    value.textContent = s.value;
    left.appendChild(label);
    left.appendChild(value);

    const editBtn = document.createElement('button');
    editBtn.className = 'summary-edit';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      _wizardState.step = s.editStep;
      _renderWizard(container.closest('.wizard')?.parentElement || container.parentElement);
    });

    row.appendChild(left);
    row.appendChild(editBtn);
    container.appendChild(row);
  }

  // Complete button
  const completeBtn = document.createElement('button');
  completeBtn.className = 'btn btn-primary';
  completeBtn.style.width = '100%';
  completeBtn.style.marginTop = 'var(--space-6)';
  completeBtn.style.padding = '12px';
  completeBtn.style.fontSize = '1.05rem';
  completeBtn.textContent = 'Looks good? Start Growing';
  completeBtn.addEventListener('click', () => _completeOnboarding());
  container.appendChild(completeBtn);
}

// ── Validation ─────────────────────────────────────────────────────────

function _validateStep(step) {
  switch (step) {
    case 1:
      return _wizardState.stage ? { valid: true } : { valid: false, error: 'Please select a grow stage.' };
    case 2:
      return _wizardState.medium ? { valid: true } : { valid: false, error: 'Please select a growing medium.' };
    case 3:
      return _wizardState.lighting ? { valid: true } : { valid: false, error: 'Please select a lighting type.' };
    case 4: {
      const c = _wizardState.plantCount;
      if (!c || c < 1 || c > 20 || !Number.isInteger(c)) {
        return { valid: false, error: 'Plant count must be 1-20.' };
      }
      return { valid: true };
    }
    case 5:
      return _wizardState.potSize ? { valid: true } : { valid: false, error: 'Please select a pot size.' };
    case 6:
      return { valid: true }; // Strain is optional
    case 7:
      return { valid: true }; // Space is optional
    case 8:
      return _wizardState.experience ? { valid: true } : { valid: false, error: 'Please select your experience level.' };
    case 9:
      return { valid: true }; // Priorities have defaults
    default:
      return { valid: true };
  }
}

// ── Completion ─────────────────────────────────────────────────────────

function _completeOnboarding({ skipNavigate = false } = {}) {
  const store = _store || window.__growdocStore;
  if (!store) {
    console.error('Store not available');
    return;
  }

  const w = _wizardState;

  // 1. Create profile with parsed context notes
  // Raw text — escaping happens at innerHTML insertion points, not storage.
  const rawNotes = {};
  for (const [key, val] of Object.entries(w.notes)) {
    rawNotes[key] = val || '';
  }
  const context = parseProfileNotes(rawNotes);

  const profile = {
    version: 1,
    medium: w.medium,
    lighting: w.lighting,
    lightWattage: w.lightWattage,
    spaceL: w.spaceL,
    spaceW: w.spaceW,
    spaceH: w.spaceH,
    experience: w.experience,
    priorities: { ...w.priorities },
    targetEffect: w.targetEffect,
    notes: rawNotes,
    context,
  };
  store.commit('profile', profile);

  // 2. Generate initial plants
  const plants = [];
  for (let i = 0; i < w.plantCount; i++) {
    plants.push({
      id: generateId(),
      name: w.plantCount === 1 ? 'My Plant' : `Plant ${i + 1}`,
      strainId: null,
      strainCustom: w.strainName ? { name: w.strainName } : null,
      potSize: w.potSize,
      stage: w.stage,
      stageStartDate: new Date().toISOString(),
      logs: [],
      diagnoses: [],
      training: { method: 'none', milestones: [] },
    });
  }

  // 3. Create grow
  const grow = {
    id: generateId(),
    active: true,
    startDate: new Date().toISOString(),
    currentStage: w.stage,
    stageHistory: [{ stage: w.stage, startDate: new Date().toISOString(), endDate: null }],
    plants,
    tasks: [],
  };
  store.commit('grow', grow);

  // 4. Save to localStorage (auto-save via store subscribers handles this)
  // 5. Also persist profile key for router's first-visit detection
  try {
    localStorage.setItem('growdoc-companion-profile', JSON.stringify(profile));
  } catch { /* handled by store auto-save */ }

  // 6. Redirect to dashboard
  if (!skipNavigate) navigate('/dashboard');
}

// ── Exports for test access ────────────────────────────────────────────

export { _validateStep as validateStep, _wizardState, _defaultState, STAGES, MEDIUMS, LIGHTS, EXPERIENCE_LEVELS, POT_SIZES, TOTAL_STEPS };


// ── Tests ──────────────────────────────────────────────────────────────

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // ── Wizard Navigation Tests ──

  // Starts at step 1
  {
    const state = _defaultState();
    assert(state.step === 1, 'wizard starts at step 1');
  }

  // Progress dots reflect current step
  {
    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);

    _wizardState = _defaultState();
    _wizardState.stage = 'veg'; // need valid selection for step 1
    _renderWizard(testContainer);

    const dots = testContainer.querySelectorAll('.wizard-dot');
    assert(dots.length === TOTAL_STEPS, `progress dots count is ${TOTAL_STEPS}`);
    assert(dots[0].classList.contains('current'), 'first dot is current at step 1');

    testContainer.remove();
  }

  // Back button returns to previous step
  {
    const state = _defaultState();
    state.step = 3;
    state.stage = 'veg';
    state.medium = 'soil';
    _wizardState = state;

    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);
    _renderWizard(testContainer);

    const backBtn = testContainer.querySelector('.wizard-nav .btn:not(.btn-primary)');
    assert(backBtn !== null, 'back button exists at step 3');
    assert(backBtn.textContent === 'Back', 'back button has correct label');

    testContainer.remove();
  }

  // ── Validation Tests ──

  // Plant count range
  {
    _wizardState = _defaultState();
    _wizardState.plantCount = 0;
    assert(!_validateStep(4).valid, 'plant count 0 is invalid');

    _wizardState.plantCount = 21;
    assert(!_validateStep(4).valid, 'plant count 21 is invalid');

    _wizardState.plantCount = 5;
    assert(_validateStep(4).valid, 'plant count 5 is valid');

    _wizardState.plantCount = 1;
    assert(_validateStep(4).valid, 'plant count 1 is valid');

    _wizardState.plantCount = 20;
    assert(_validateStep(4).valid, 'plant count 20 is valid');
  }

  // Pot size required
  {
    _wizardState = _defaultState();
    _wizardState.potSize = null;
    assert(!_validateStep(5).valid, 'pot size null is invalid');

    _wizardState.potSize = 5;
    assert(_validateStep(5).valid, 'pot size 5 is valid');
  }

  // Priority defaults
  {
    const state = _defaultState();
    assert(state.priorities.yield === 3, 'yield priority defaults to 3');
    assert(state.priorities.quality === 3, 'quality priority defaults to 3');
    assert(state.priorities.terpenes === 3, 'terpenes priority defaults to 3');
    assert(state.priorities.effect === 3, 'effect priority defaults to 3');
  }

  // Effect type conditional
  {
    _wizardState = _defaultState();
    _wizardState.priorities.effect = 2;

    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);
    _renderPriorityStep(testContainer);

    const effectField = testContainer.querySelector('.effect-selector');
    assert(effectField !== null && effectField.style.display === 'none', 'effect type selector hidden when effect < 3');

    testContainer.innerHTML = '';
    _wizardState.priorities.effect = 3;
    _renderPriorityStep(testContainer);

    const effectField2 = testContainer.querySelector('.effect-selector');
    assert(effectField2 !== null && effectField2.style.display !== 'none', 'effect type selector shown when effect >= 3');

    testContainer.remove();
  }

  // Skip forward works for optional fields
  {
    _wizardState = _defaultState();
    assert(_validateStep(6).valid, 'strain step allows skip (optional)');
    assert(_validateStep(7).valid, 'space step allows skip (optional)');
  }

  // ── Profile Creation Tests ──

  // Completing all steps creates profile in store
  {
    const { createStore } = await import('../store.js');
    const testStore = createStore({});
    _store = testStore;

    _wizardState = _defaultState();
    _wizardState.stage = 'early-veg';
    _wizardState.medium = 'soil';
    _wizardState.lighting = 'led';
    _wizardState.plantCount = 2;
    _wizardState.potSize = 7;
    _wizardState.strainName = 'Northern Lights';
    _wizardState.experience = 'beginner';
    _wizardState.priorities = { yield: 4, quality: 3, terpenes: 2, effect: 5 };
    _wizardState.targetEffect = 'relaxing';

    _completeOnboarding({ skipNavigate: true });

    assert(testStore.state.profile !== undefined, 'profile created in store');
    assert(testStore.state.profile.medium === 'soil', 'profile has correct medium');
    assert(testStore.state.profile.lighting === 'led', 'profile has correct lighting');
    assert(testStore.state.profile.experience === 'beginner', 'profile has correct experience');
    assert(testStore.state.profile.priorities.yield === 4, 'profile has correct yield priority');

    // Plants generated
    assert(testStore.state.grow !== undefined, 'grow created in store');
    assert(testStore.state.grow.plants.length === 2, 'correct number of plants generated');
    assert(testStore.state.grow.plants[0].potSize === 7, 'plant has correct pot size');
    assert(testStore.state.grow.plants[0].stage === 'early-veg', 'plant has correct stage');
    assert(testStore.state.grow.active === true, 'grow is active');

    // Cleanup
    _store = null;
    localStorage.removeItem('growdoc-companion-profile');
  }

  // Summary screen shows selections
  {
    _wizardState = _defaultState();
    _wizardState.step = 10;
    _wizardState.stage = 'late-veg';
    _wizardState.medium = 'coco';
    _wizardState.lighting = 'hps';
    _wizardState.plantCount = 4;
    _wizardState.potSize = 10;
    _wizardState.experience = 'intermediate';

    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);
    _renderSummaryStep(testContainer);

    const summaryText = testContainer.textContent;
    assert(summaryText.includes('Late Veg'), 'summary shows stage');
    assert(summaryText.includes('Coco'), 'summary shows medium');
    assert(summaryText.includes('HPS'), 'summary shows lighting');
    assert(summaryText.includes('4 plants'), 'summary shows plant count');
    assert(summaryText.includes('10L'), 'summary shows pot size');

    const editBtns = testContainer.querySelectorAll('.summary-edit');
    assert(editBtns.length > 0, 'summary has edit buttons');

    testContainer.remove();
  }

  // Reset wizard state
  _wizardState = _defaultState();
  _store = null;

  return results;
}
