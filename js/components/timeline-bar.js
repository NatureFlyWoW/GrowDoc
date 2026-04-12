// GrowDoc Companion — Stage Timeline Bar & Dry/Cure Views

import { STAGES, STAGE_TRANSITIONS, getDaysInStage, getStageById, getStageIndex, getCureBurpSchedule, DRYING_TARGETS, CURING_TARGETS, SMELL_OPTIONS_DRYING, SMELL_OPTIONS_CURING } from '../data/stage-rules.js';
import { getStageContent, getMilestoneContent } from '../data/stage-content.js';
import { getRandomPlaceholder } from '../data/stage-note-placeholders.js';
import { getQuestionStarters } from '../data/stage-question-starters.js';
import { createStageNote, createStageQuestion, getStageObservations, markQuestionAnswered, dismissQuestion } from '../data/note-contextualizer/stage-sources.js';
import { getStageDeepDive } from '../data/knowledge-deep-dives.js';
import { getStrainClassAdjustments, getStrainClass } from '../data/strain-class-adjustments.js';
import { generateId } from '../utils.js';
import { answerQuestion } from '../data/question-matcher.js';
import { navigate } from '../router.js';

// Edge-case engine — may not exist yet; fall back to empty array on load failure
let getActiveEdgeCases = null;
try {
  const mod = await import('../data/edge-case-engine.js');
  getActiveEdgeCases = mod.getActiveEdgeCases ?? null;
} catch {
  // file not yet created — silently skip
}

/**
 * renderTimeline(container, options) — Renders a horizontal progress bar timeline.
 *   options.currentStage  — Current stage ID
 *   options.daysInStage   — Days elapsed in current stage
 *   options.stageHistory  — Array of {stage, startDate, endDate}
 *   options.mode          — 'compact' | 'full' (default: 'compact')
 *   options.onStageClick(stageId) — Callback when stage is clicked (full mode)
 *   options.onAdvance(nextStage)  — Callback to advance stage
 */
export function renderTimeline(container, options) {
  const { currentStage, daysInStage = 0, stageHistory = [], mode = 'compact', onStageClick, onAdvance } = options;

  const currentIdx = getStageIndex(currentStage);
  const totalTypical = STAGES.reduce((sum, s) => sum + s.typicalDays, 0);

  const wrapper = document.createElement('div');
  wrapper.className = `timeline timeline-${mode}`;

  // Header: current stage name + day count
  if (mode === 'compact') {
    const header = document.createElement('div');
    header.className = 'timeline-header';
    const stageDef = getStageById(currentStage);
    header.textContent = `${stageDef ? stageDef.name : currentStage} — Day ${daysInStage}`;
    wrapper.appendChild(header);
  }

  // Bar container with ARIA
  const bar = document.createElement('div');
  bar.className = 'timeline-bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', `Growth timeline — ${currentStage.replace(/-/g, ' ')}, day ${daysInStage}`);
  const totalStages = STAGES.length;
  const progressPct = Math.round(((currentIdx + (daysInStage / (getStageById(currentStage)?.typicalDays || 1))) / totalStages) * 100);
  bar.setAttribute('aria-valuenow', String(Math.min(progressPct, 100)));
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');

  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const widthPct = (stage.typicalDays / totalTypical) * 100;

    const segment = document.createElement('div');
    segment.className = 'timeline-segment';
    segment.style.width = `${widthPct}%`;
    segment.dataset.stage = stage.id;

    if (i < currentIdx) {
      segment.classList.add('completed');
    } else if (i === currentIdx) {
      segment.classList.add('current');
      // Position marker within current stage
      const progress = Math.min(daysInStage / stage.typicalDays, 1);
      const marker = document.createElement('div');
      marker.className = 'timeline-marker';
      marker.style.left = `${progress * 100}%`;
      segment.appendChild(marker);
    } else {
      segment.classList.add('future');
    }

    // Milestone markers
    for (const m of stage.milestones) {
      const mPos = m.triggerDay / stage.typicalDays;
      const mEl = document.createElement('div');
      mEl.className = 'timeline-milestone';
      mEl.style.left = `${mPos * 100}%`;
      mEl.title = m.name;
      mEl.textContent = _milestoneIcon(m.icon);
      segment.appendChild(mEl);
    }

    // Label (full mode only)
    if (mode === 'full') {
      const label = document.createElement('div');
      label.className = 'timeline-label';
      label.textContent = stage.name;
      segment.appendChild(label);

      segment.style.cursor = 'pointer';
      segment.addEventListener('click', () => {
        if (onStageClick) onStageClick(stage.id);
      });
    }

    bar.appendChild(segment);
  }

  wrapper.appendChild(bar);

  // Auto-advance prompt (if applicable)
  if (currentIdx >= 0) {
    const transition = STAGE_TRANSITIONS[currentStage];
    if (transition && daysInStage >= transition.triggerDays) {
      const prompt = document.createElement('div');
      prompt.className = 'timeline-advance-prompt';

      const msg = document.createElement('span');
      msg.textContent = transition.confirmMessage;
      prompt.appendChild(msg);

      // Decision notes field
      const notesRow = document.createElement('div');
      notesRow.className = 'decision-notes';
      const notesToggle = document.createElement('button');
      notesToggle.className = 'decision-notes-toggle';
      notesToggle.textContent = '+ Add context';
      const notesInput = document.createElement('textarea');
      notesInput.className = 'input decision-notes-input';
      notesInput.rows = 2;
      notesInput.placeholder = 'e.g., just transplanted, plant looks stressed, want to wait for recovery...';
      notesInput.style.display = 'none';
      notesToggle.addEventListener('click', () => {
        notesInput.style.display = notesInput.style.display === 'none' ? '' : 'none';
        if (notesInput.style.display !== 'none') notesInput.focus();
      });
      notesRow.appendChild(notesToggle);
      notesRow.appendChild(notesInput);
      prompt.appendChild(notesRow);

      const btnRow = document.createElement('div');
      btnRow.className = 'decision-btn-row';

      const yesBtn = document.createElement('button');
      yesBtn.className = 'btn btn-primary btn-sm';
      yesBtn.textContent = 'Yes, advance';
      yesBtn.addEventListener('click', () => {
        // Save the decision note as a log entry
        const note = notesInput.value.trim();
        if (note && options.plantId) {
          _logDecisionNote(options.plantId, 'stage-advance', `Advanced to ${transition.next}`, note, options._store);
        }
        if (onAdvance) onAdvance(transition.next);
        prompt.remove();
      });

      const noBtn = document.createElement('button');
      noBtn.className = 'btn btn-sm';
      noBtn.textContent = 'Not yet';
      noBtn.addEventListener('click', () => {
        const note = notesInput.value.trim();
        if (note && options.plantId) {
          _logDecisionNote(options.plantId, 'stage-decline', `Declined advance to ${transition.next}`, note, options._store);
        }
        prompt.remove();
      });

      btnRow.appendChild(yesBtn);
      btnRow.appendChild(noBtn);
      prompt.appendChild(btnRow);
      wrapper.appendChild(prompt);
    }
  }

  container.appendChild(wrapper);

  return { element: wrapper };
}

/**
 * renderStageDetail(container, stageId, options) — Expanded detail panel for a stage.
 *
 * @param {HTMLElement} container
 * @param {string} stageId
 * @param {object} [options]
 * @param {object}   [options.plant]         - Full plant object for notes scoping
 * @param {object}   [options.store]         - Store for commit/publish
 * @param {string}   [options.currentStage]  - Plant's current stage ID
 * @param {Function} [options.onAdvance]     - Callback(nextStageId)
 * @param {Function} [options.onStageChange] - Callback(stageId)
 * @param {string}   [options.panelState]    - 'past'|'current'|'future' (auto-derived if omitted)
 * @param {Array}    [options.edgeCases]     - Active edge cases from engine
 */
export function renderStageDetail(container, stageId, options = {}) {
  const stage = getStageById(stageId);
  if (!stage) return;

  const {
    plant = null,
    store = null,
    currentStage = null,
    onAdvance = null,
    onStageChange = null,
    edgeCases: edgeCasesOpt = null,
  } = options;

  // ── Derive panel variant ──────────────────────────────────────────
  let variant = options.panelState || null;
  if (!variant && currentStage) {
    const currentIdx = getStageIndex(currentStage);
    const thisIdx = getStageIndex(stageId);
    if (thisIdx < currentIdx) variant = 'past';
    else if (thisIdx === currentIdx) variant = 'current';
    else variant = 'future';
  }
  if (!variant) variant = 'current';

  // ── Content data ──────────────────────────────────────────────────
  const content = getStageContent(stageId);
  const deepDive = getStageDeepDive(stageId);
  const strainClassKey = plant?.strainClass || null;
  const classEntry = strainClassKey ? getStrainClass(strainClassKey) : null;
  const classOverride = strainClassKey ? getStrainClassAdjustments(strainClassKey, stageId) : null;

  // Edge cases: use provided or try engine
  let edgeCases = [];
  if (Array.isArray(edgeCasesOpt)) {
    edgeCases = edgeCasesOpt;
  } else if (getActiveEdgeCases && plant) {
    try { edgeCases = getActiveEdgeCases(plant) || []; } catch { edgeCases = []; }
  }

  // Stage history for past variant
  let completedDate = null;
  let lastedDays = null;
  if (variant === 'past' && plant) {
    const histEntry = (plant.stageHistory || []).find(h => h.stage === stageId && h.endDate);
    if (histEntry) {
      completedDate = new Date(histEntry.endDate).toLocaleDateString();
      const start = new Date(histEntry.startDate);
      const end = new Date(histEntry.endDate);
      lastedDays = Math.max(0, Math.round((end - start) / 86400000));
    }
  }

  // ── Build panel ───────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.className = `stage-detail-panel stage-detail-panel--${variant}`;

  // ── Header ────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'stage-detail-header';

  const titleRow = document.createElement('h3');
  titleRow.className = 'stage-detail-title';
  titleRow.textContent = stage.name;

  if (variant === 'past') {
    const badge = document.createElement('span');
    badge.className = 'stage-completed-badge';
    badge.textContent = 'COMPLETED';
    titleRow.appendChild(badge);
  } else if (variant === 'future') {
    const badge = document.createElement('span');
    badge.className = 'stage-upcoming-badge';
    badge.textContent = 'UPCOMING';
    titleRow.appendChild(badge);
  }
  header.appendChild(titleRow);

  const meta = document.createElement('div');
  meta.className = 'stage-detail-meta';
  if (variant === 'past' && completedDate) {
    const completed = document.createElement('span');
    completed.textContent = `Completed ${completedDate}, lasted ${lastedDays} day${lastedDays === 1 ? '' : 's'}`;
    meta.appendChild(completed);
  } else {
    const typical = document.createElement('span');
    typical.textContent = `Typical ${stage.typicalDays} days`;
    meta.appendChild(typical);
    const range = document.createElement('span');
    range.textContent = `Range ${stage.minDays}–${stage.maxDays}`;
    meta.appendChild(range);
  }
  header.appendChild(meta);
  panel.appendChild(header);

  // ── Ready callout (current only) ──────────────────────────────────
  if (variant === 'current' && content?.readyToAdvance) {
    const callout = document.createElement('div');
    callout.className = 'stage-ready-callout';
    callout.textContent = content.readyToAdvance;
    panel.appendChild(callout);
  }

  // ── What's happening paragraph ────────────────────────────────────
  if (content?.whatsHappening && variant !== 'future') {
    const desc = document.createElement('div');
    desc.className = 'stage-whats-happening';
    desc.textContent = content.whatsHappening;
    panel.appendChild(desc);
  } else if (content?.whatsHappening && variant === 'future') {
    const desc = document.createElement('div');
    desc.className = 'stage-whats-happening stage-whats-happening--dimmed';
    desc.textContent = content.whatsHappening;
    panel.appendChild(desc);
  }

  // ── Edge case warnings ────────────────────────────────────────────
  const warningEdges = edgeCases.filter(e => e?.severity === 'urgent' || e?.severity === 'warning' || e?.severity === 'info');
  if (warningEdges.length > 0) {
    const edgeWrap = document.createElement('div');
    edgeWrap.className = 'stage-edge-warnings';
    for (const ec of warningEdges) {
      const item = document.createElement('div');
      item.className = `stage-edge-warning stage-edge-warning--${ec.severity || 'info'}`;
      item.textContent = ec.message || ec.label || '';
      edgeWrap.appendChild(item);
    }
    panel.appendChild(edgeWrap);
  }

  // ── Accordions ────────────────────────────────────────────────────
  if (content && variant !== 'future') {
    const accordions = document.createElement('div');
    accordions.className = 'stage-accordions';

    const whatToDo = classOverride?.replaceWhatToDo ?? content.whatToDo ?? [];
    if (whatToDo.length > 0) {
      const det = document.createElement('details');
      det.className = 'stage-accordion';
      if (variant === 'current') det.open = true;
      const sum = document.createElement('summary');
      sum.textContent = 'What to do';
      det.appendChild(sum);
      const ul = document.createElement('ul');
      ul.className = 'stage-whatToDo-list';
      for (const item of whatToDo) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      }
      det.appendChild(ul);
      accordions.appendChild(det);
    }

    const watchFor = [...(content.whatToWatch ?? []), ...(classOverride?.addWhatToWatch ?? [])];
    if (watchFor.length > 0) {
      const det = document.createElement('details');
      det.className = 'stage-accordion';
      const sum = document.createElement('summary');
      sum.textContent = 'Watch for';
      det.appendChild(sum);
      const ul = document.createElement('ul');
      ul.className = 'stage-watchFor-list';
      for (const item of watchFor) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      }
      det.appendChild(ul);
      accordions.appendChild(det);
    }

    const mistakes = content.commonMistakes ?? [];
    if (mistakes.length > 0) {
      const det = document.createElement('details');
      det.className = 'stage-accordion';
      const sum = document.createElement('summary');
      sum.textContent = 'Common mistakes';
      det.appendChild(sum);
      const ul = document.createElement('ul');
      ul.className = 'stage-mistakes-list';
      for (const item of mistakes) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      }
      det.appendChild(ul);
      accordions.appendChild(det);
    }

    panel.appendChild(accordions);
  } else if (content && variant === 'future') {
    // Future: only show "What to avoid" from commonMistakes
    const mistakes = content.commonMistakes ?? [];
    if (mistakes.length > 0) {
      const accordions = document.createElement('div');
      accordions.className = 'stage-accordions';
      const det = document.createElement('details');
      det.className = 'stage-accordion';
      const sum = document.createElement('summary');
      sum.textContent = 'What to avoid when you get here';
      det.appendChild(sum);
      const ul = document.createElement('ul');
      ul.className = 'stage-mistakes-list';
      for (const item of mistakes) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      }
      det.appendChild(ul);
      accordions.appendChild(det);
      panel.appendChild(accordions);
    }
  }

  // ── Milestones ────────────────────────────────────────────────────
  if (stage.milestones.length > 0) {
    const milestonesWrap = document.createElement('div');
    milestonesWrap.className = 'stage-milestones';
    const mTitle = document.createElement('h4');
    mTitle.textContent = 'Milestones';
    milestonesWrap.appendChild(mTitle);

    const ul = document.createElement('ul');
    ul.className = 'stage-milestone-list';

    let expandedMilestoneId = null;

    for (const m of stage.milestones) {
      const li = document.createElement('li');
      li.className = 'stage-milestone-item';
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');
      li.dataset.milestoneId = m.id;

      const labelRow = document.createElement('div');
      labelRow.className = 'stage-milestone-label-row';
      const dayChip = document.createElement('span');
      dayChip.className = 'stage-milestone-day';
      dayChip.textContent = `Day ${m.triggerDay}`;
      const nameSpan = document.createElement('span');
      nameSpan.textContent = m.name;
      labelRow.appendChild(dayChip);
      labelRow.appendChild(nameSpan);
      li.appendChild(labelRow);

      const milestoneContent = getMilestoneContent(stageId, m.id);
      if (milestoneContent) {
        const detail = document.createElement('div');
        detail.className = 'stage-milestone-detail';
        detail.hidden = true;
        const detailText = document.createElement('p');
        detailText.textContent = milestoneContent.detail;
        detail.appendChild(detailText);
        if (milestoneContent.tip) {
          const tip = document.createElement('div');
          tip.className = 'stage-milestone-tip';
          tip.textContent = milestoneContent.tip;
          detail.appendChild(tip);
        }
        li.appendChild(detail);

        const toggleMilestone = (targetLi) => {
          const isOpen = targetLi.classList.contains('stage-milestone-item--expanded');
          // Collapse all
          ul.querySelectorAll('.stage-milestone-item--expanded').forEach(el => {
            el.classList.remove('stage-milestone-item--expanded');
            const d = el.querySelector('.stage-milestone-detail');
            if (d) d.hidden = true;
          });
          if (!isOpen) {
            targetLi.classList.add('stage-milestone-item--expanded');
            detail.hidden = false;
          }
        };

        li.addEventListener('click', () => toggleMilestone(li));
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMilestone(li); }
        });
      }

      ul.appendChild(li);
    }

    milestonesWrap.appendChild(ul);
    panel.appendChild(milestonesWrap);
  }

  // ── Deep Dive ─────────────────────────────────────────────────────
  if (deepDive) {
    const ddWrap = document.createElement('div');
    ddWrap.className = 'stage-deep-dive';

    const ddToggle = document.createElement('button');
    ddToggle.className = 'btn btn-sm stage-deep-dive-toggle';
    ddToggle.setAttribute('aria-expanded', 'false');
    ddToggle.textContent = `Deep dive: ${deepDive.title} (${deepDive.readingTime})`;

    const ddBody = document.createElement('div');
    ddBody.className = 'stage-deep-dive-body';
    ddBody.hidden = true;

    // Render body blocks
    for (const block of (deepDive.body || [])) {
      if (block.type === 'paragraph') {
        const p = document.createElement('p');
        p.textContent = block.text;
        ddBody.appendChild(p);
      } else if (block.type === 'heading') {
        const h = document.createElement('h5');
        h.textContent = block.text;
        ddBody.appendChild(h);
      } else if (block.type === 'bullet-list') {
        const ul = document.createElement('ul');
        for (const it of (block.items || [])) {
          const li = document.createElement('li');
          li.textContent = it;
          ul.appendChild(li);
        }
        ddBody.appendChild(ul);
      } else if (block.type === 'callout') {
        const callout = document.createElement('div');
        callout.className = `stage-deep-dive-callout stage-deep-dive-callout--${block.kind || 'info'}`;
        callout.textContent = block.text;
        ddBody.appendChild(callout);
      }
    }

    if (deepDive.sources?.length) {
      const srcDiv = document.createElement('div');
      srcDiv.className = 'stage-deep-dive-sources';
      const srcLabel = document.createElement('span');
      srcLabel.textContent = 'Sources: ';
      srcDiv.appendChild(srcLabel);
      for (const src of deepDive.sources) {
        const s = document.createElement('span');
        s.textContent = src.label;
        srcDiv.appendChild(s);
      }
      ddBody.appendChild(srcDiv);
    }

    ddToggle.addEventListener('click', () => {
      const isExpanded = ddToggle.getAttribute('aria-expanded') === 'true';
      ddToggle.setAttribute('aria-expanded', String(!isExpanded));
      ddBody.hidden = isExpanded;
      ddWrap.classList.toggle('stage-deep-dive--expanded', !isExpanded);
    });

    ddWrap.appendChild(ddToggle);
    ddWrap.appendChild(ddBody);
    panel.appendChild(ddWrap);
  }

  // ── Notes & Questions (hidden for future) ─────────────────────────
  if (variant !== 'future' && plant && store) {
    const obsData = getStageObservations(store, { plantId: plant.id, stageId });
    const notesListId = `stage-notes-list-${stageId}-${plant.id}`;
    const questionsListId = `stage-open-questions-${stageId}-${plant.id}`;

    const nqSection = document.createElement('section');
    nqSection.className = 'stage-notes-and-questions';

    // ── Notes lane ────────────────────────────────────────────────
    const notesLane = document.createElement('div');
    notesLane.className = 'stage-notes-lane';

    const notesH4 = document.createElement('h4');
    notesH4.textContent = 'Observations';
    notesLane.appendChild(notesH4);

    const buildNotesList = (notes) => {
      const existing = document.getElementById(notesListId);
      const ul = existing ?? document.createElement('ul');
      ul.className = 'stage-notes-list';
      ul.id = notesListId;
      ul.innerHTML = '';
      if (notes.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'stage-empty';
        empty.textContent = 'No observations for this stage yet.';
        ul.appendChild(empty);
      } else {
        for (const note of notes) {
          const li = document.createElement('li');
          li.className = 'stage-note-item';
          const ts = document.createElement('span');
          ts.className = 'stage-note-timestamp';
          ts.textContent = new Date(note.timestamp || note.date).toLocaleDateString();
          li.appendChild(ts);
          if (note.details?.milestoneId) {
            const chip = document.createElement('span');
            chip.className = 'stage-milestone-chip';
            chip.textContent = note.details.milestoneId;
            li.appendChild(chip);
          }
          const body = document.createElement('div');
          body.className = 'stage-note-body';
          body.textContent = note.details?.notes || '';
          li.appendChild(body);
          ul.appendChild(li);
        }
      }
      return ul;
    };

    notesLane.appendChild(buildNotesList(obsData.notes));

    // Add observation form (past: hidden; current: shown)
    if (variant === 'current') {
      const addToggle = document.createElement('button');
      addToggle.className = 'btn btn-sm stage-add-note-toggle';
      addToggle.textContent = 'Add observation';
      notesLane.appendChild(addToggle);

      const addForm = document.createElement('div');
      addForm.className = 'stage-add-note-form';
      addForm.hidden = true;

      const textarea = document.createElement('textarea');
      textarea.className = 'input';
      textarea.rows = 3;
      textarea.placeholder = getRandomPlaceholder(stageId);
      addForm.appendChild(textarea);

      const formBtns = document.createElement('div');
      formBtns.className = 'decision-btn-row';

      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-primary btn-sm';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', () => {
        const text = textarea.value.trim();
        if (!text) return;
        createStageNote(store, { plantId: plant.id, stageId, text });
        textarea.value = '';
        addForm.hidden = true;
        addToggle.setAttribute('aria-expanded', 'false');
        // Patch only the notes list
        const freshObs = getStageObservations(store, { plantId: plant.id, stageId });
        const oldList = document.getElementById(notesListId);
        if (oldList) oldList.replaceWith(buildNotesList(freshObs.notes));
      });

      const cancelNoteBtn = document.createElement('button');
      cancelNoteBtn.className = 'btn btn-sm';
      cancelNoteBtn.textContent = 'Cancel';
      cancelNoteBtn.addEventListener('click', () => {
        addForm.hidden = true;
        addToggle.setAttribute('aria-expanded', 'false');
      });

      formBtns.appendChild(saveBtn);
      formBtns.appendChild(cancelNoteBtn);
      addForm.appendChild(formBtns);
      notesLane.appendChild(addForm);

      addToggle.setAttribute('aria-expanded', 'false');
      addToggle.addEventListener('click', () => {
        const open = addForm.hidden;
        addForm.hidden = !open;
        addToggle.setAttribute('aria-expanded', String(open));
        if (open) textarea.focus();
      });
    }

    nqSection.appendChild(notesLane);

    // ── Questions lane ────────────────────────────────────────────
    const qLane = document.createElement('div');
    qLane.className = 'stage-questions-lane';

    const qH4 = document.createElement('h4');
    qH4.textContent = 'Open questions';
    qLane.appendChild(qH4);

    const buildQuestionsList = (openQuestions) => {
      const existing = document.getElementById(questionsListId);
      const ul = existing ?? document.createElement('ul');
      ul.className = 'stage-open-questions';
      ul.id = questionsListId;
      ul.innerHTML = '';
      if (openQuestions.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'stage-empty';
        empty.textContent = 'No open questions for this stage.';
        ul.appendChild(empty);
      } else {
        for (const q of openQuestions) {
          const li = document.createElement('li');
          li.className = 'stage-question-chip';
          li.dataset.questionId = q.id;

          const qBody = document.createElement('div');
          qBody.textContent = q.details?.notes || '';
          li.appendChild(qBody);

          const qMeta = document.createElement('div');
          qMeta.className = 'stage-question-chip-meta';
          qMeta.textContent = 'Tap Answer to search GrowDoc\'s knowledge base';
          li.appendChild(qMeta);

          const qActions = document.createElement('div');
          qActions.className = 'stage-question-actions';

          // Answer button — searches local knowledge base inline
          const kbAnswerBtn = document.createElement('button');
          kbAnswerBtn.className = 'btn btn-sm btn-answer-question';
          kbAnswerBtn.textContent = 'Answer';
          kbAnswerBtn.setAttribute('aria-expanded', 'false');

          const answerPanel = document.createElement('div');
          answerPanel.className = 'stage-question-answer';
          answerPanel.hidden = true;

          kbAnswerBtn.addEventListener('click', () => {
            const alreadyOpen = kbAnswerBtn.getAttribute('aria-expanded') === 'true';
            if (alreadyOpen) {
              // Toggle hide
              answerPanel.hidden = true;
              kbAnswerBtn.textContent = 'Answer';
              kbAnswerBtn.setAttribute('aria-expanded', 'false');
              return;
            }

            // Mark expanded and disable re-search (show Hide toggle instead)
            kbAnswerBtn.setAttribute('aria-expanded', 'true');
            kbAnswerBtn.textContent = 'Hide';
            answerPanel.hidden = false;
            answerPanel.innerHTML = '';

            const questionText = q.details?.notes || '';
            const plantFlags = plant?.flags ?? [];
            const matches = answerQuestion(questionText, {
              currentStage: plant?.stage ?? null,
              plantFlags,
            });

            if (matches.length === 0) {
              const empty = document.createElement('div');
              empty.className = 'stage-question-answer-empty';
              empty.textContent = 'GrowDoc\'s knowledge base doesn\'t have a specific answer for this one yet.';
              answerPanel.appendChild(empty);
            } else {
              for (const item of matches) {
                const itemEl = document.createElement('div');
                itemEl.className = 'stage-question-answer-item';

                const sourceBadge = document.createElement('div');
                sourceBadge.className = 'stage-question-answer-source';
                sourceBadge.textContent = item.source;
                itemEl.appendChild(sourceBadge);

                const titleEl = document.createElement('h5');
                titleEl.className = 'stage-question-answer-title';
                titleEl.textContent = item.title;
                itemEl.appendChild(titleEl);

                const bodyEl = document.createElement('p');
                bodyEl.className = 'stage-question-answer-body';
                bodyEl.textContent = item.body;
                itemEl.appendChild(bodyEl);

                if (item.matchedTerms && item.matchedTerms.length > 0) {
                  const termsEl = document.createElement('div');
                  termsEl.className = 'stage-question-answer-matched-terms';
                  termsEl.textContent = 'matched: ' + item.matchedTerms.join(', ');
                  itemEl.appendChild(termsEl);
                }

                const helpfulBtn = document.createElement('button');
                helpfulBtn.className = 'btn btn-sm';
                helpfulBtn.textContent = 'Helpful';
                helpfulBtn.addEventListener('click', () => {
                  markQuestionAnswered(store, q.id, { answerObsId: 'matcher:' + item.id });
                  const freshObs = getStageObservations(store, { plantId: plant.id, stageId });
                  const oldList = document.getElementById(questionsListId);
                  if (oldList) oldList.replaceWith(buildQuestionsList(freshObs.openQuestions));
                });
                itemEl.appendChild(helpfulBtn);

                answerPanel.appendChild(itemEl);
              }
            }
          });

          const markAnsweredBtn = document.createElement('button');
          markAnsweredBtn.className = 'btn btn-sm';
          markAnsweredBtn.textContent = 'Mark answered';
          markAnsweredBtn.addEventListener('click', () => {
            markQuestionAnswered(store, q.id);
            const freshObs = getStageObservations(store, { plantId: plant.id, stageId });
            const oldList = document.getElementById(questionsListId);
            if (oldList) oldList.replaceWith(buildQuestionsList(freshObs.openQuestions));
          });

          const dismissBtn = document.createElement('button');
          dismissBtn.className = 'btn btn-sm';
          dismissBtn.textContent = 'Dismiss';
          dismissBtn.addEventListener('click', () => {
            dismissQuestion(store, q.id);
            const freshObs = getStageObservations(store, { plantId: plant.id, stageId });
            const oldList = document.getElementById(questionsListId);
            if (oldList) oldList.replaceWith(buildQuestionsList(freshObs.openQuestions));
          });

          qActions.appendChild(kbAnswerBtn);
          qActions.appendChild(markAnsweredBtn);
          qActions.appendChild(dismissBtn);
          li.appendChild(qActions);
          li.appendChild(answerPanel);
          ul.appendChild(li);
        }
      }
      return ul;
    };

    qLane.appendChild(buildQuestionsList(obsData.openQuestions));

    // Ask question form (current only)
    if (variant === 'current') {
      const askToggle = document.createElement('button');
      askToggle.className = 'btn btn-sm stage-ask-question-toggle';
      askToggle.setAttribute('aria-expanded', 'false');
      askToggle.textContent = 'Ask question';
      qLane.appendChild(askToggle);

      const askForm = document.createElement('div');
      askForm.className = 'stage-ask-question-form';
      askForm.hidden = true;

      const qTextarea = document.createElement('textarea');
      qTextarea.className = 'input';
      qTextarea.rows = 2;
      qTextarea.placeholder = 'Type your question...';
      askForm.appendChild(qTextarea);

      // Starter chips
      const starters = getQuestionStarters(stageId);
      if (starters.length > 0) {
        const startersWrap = document.createElement('div');
        startersWrap.className = 'stage-question-starters';
        for (const s of starters.slice(0, 5)) {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'stage-question-starter';
          chip.textContent = s.text;
          chip.addEventListener('click', () => {
            qTextarea.value = s.text;
            qTextarea.focus();
          });
          startersWrap.appendChild(chip);
        }
        askForm.appendChild(startersWrap);
      }

      const qFormBtns = document.createElement('div');
      qFormBtns.className = 'decision-btn-row';

      const qSaveBtn = document.createElement('button');
      qSaveBtn.className = 'btn btn-primary btn-sm';
      qSaveBtn.textContent = 'Save';
      qSaveBtn.addEventListener('click', () => {
        const text = qTextarea.value.trim();
        if (!text) return;
        createStageQuestion(store, { plantId: plant.id, stageId, text });
        qTextarea.value = '';
        askForm.hidden = true;
        askToggle.setAttribute('aria-expanded', 'false');
        const freshObs = getStageObservations(store, { plantId: plant.id, stageId });
        const oldList = document.getElementById(questionsListId);
        if (oldList) oldList.replaceWith(buildQuestionsList(freshObs.openQuestions));
      });

      const qCancelBtn = document.createElement('button');
      qCancelBtn.className = 'btn btn-sm';
      qCancelBtn.textContent = 'Cancel';
      qCancelBtn.addEventListener('click', () => {
        askForm.hidden = true;
        askToggle.setAttribute('aria-expanded', 'false');
      });

      qFormBtns.appendChild(qSaveBtn);
      qFormBtns.appendChild(qCancelBtn);
      askForm.appendChild(qFormBtns);
      qLane.appendChild(askForm);

      askToggle.addEventListener('click', () => {
        const open = askForm.hidden;
        askForm.hidden = !open;
        askToggle.setAttribute('aria-expanded', String(open));
        if (open) qTextarea.focus();
      });
    }

    nqSection.appendChild(qLane);
    panel.appendChild(nqSection);
  }

  // ── Strain adjustments callout ────────────────────────────────────
  if (classEntry && (classOverride || classEntry.globalNotes?.length)) {
    const saWrap = document.createElement('div');
    saWrap.className = 'stage-strain-adjustments';

    const saLabel = document.createElement('div');
    saLabel.className = 'stage-strain-adjustments-label';
    saLabel.textContent = `${classEntry.label} class adjustments`;
    saWrap.appendChild(saLabel);

    if (classOverride?.hardWarnings?.length) {
      for (const w of classOverride.hardWarnings) {
        const wEl = document.createElement('div');
        wEl.className = 'stage-edge-warning stage-edge-warning--urgent';
        wEl.textContent = w;
        saWrap.appendChild(wEl);
      }
    }

    if (classEntry.globalNotes?.length) {
      const gnDiv = document.createElement('div');
      gnDiv.className = 'stage-strain-global-notes';
      for (const note of classEntry.globalNotes) {
        const p = document.createElement('p');
        p.textContent = note;
        gnDiv.appendChild(p);
      }
      saWrap.appendChild(gnDiv);
    }

    panel.appendChild(saWrap);
  }

  // ── Controls (current + past only) ────────────────────────────────
  if (variant !== 'future') {
    // Advance button: current stage and next = this stage
    if (variant === 'current' && currentStage && onAdvance) {
      const transition = STAGE_TRANSITIONS[currentStage];
      if (transition && transition.next === stageId) {
        const advBtn = document.createElement('button');
        advBtn.className = 'btn btn-primary';
        advBtn.style.marginTop = 'var(--space-4)';
        advBtn.textContent = `Move to ${stage.name}`;
        advBtn.addEventListener('click', () => onAdvance(stageId));
        panel.appendChild(advBtn);
      }
    }

    // Change stage select
    if (currentStage && onStageChange) {
      const changeRow = document.createElement('div');
      changeRow.className = 'stage-change-row';
      changeRow.style.marginTop = 'var(--space-4)';

      const select = document.createElement('select');
      select.className = 'input';
      select.setAttribute('aria-label', 'Change growth stage');
      for (const s of STAGES) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        if (s.id === currentStage) opt.selected = true;
        select.appendChild(opt);
      }

      const changeBtn = document.createElement('button');
      changeBtn.className = 'btn btn-sm';
      changeBtn.textContent = 'Change Stage';
      changeBtn.addEventListener('click', () => {
        if (select.value !== currentStage) {
          onStageChange(select.value);
        }
      });

      changeRow.appendChild(select);
      changeRow.appendChild(changeBtn);
      panel.appendChild(changeRow);
    }
  }

  container.appendChild(panel);
}

/**
 * advancePlantStage(store, plantId, nextStageId) — Advance a plant to a new stage.
 * Updates store and emits stage:changed event.
 */
export function advancePlantStage(store, plantId, nextStageId) {
  const grow = store.getSnapshot().grow;
  if (!grow || !grow.plants) return;

  const plant = grow.plants.find(p => p.id === plantId);
  if (!plant) return;

  const now = new Date().toISOString();
  const oldStage = plant.stage;

  // Update plant
  plant.stage = nextStageId;
  plant.stageStartDate = now;

  // Update stage history
  if (!grow.stageHistory) grow.stageHistory = [];
  // End the previous stage entry
  const lastEntry = grow.stageHistory.find(h => h.stage === oldStage && !h.endDate);
  if (lastEntry) lastEntry.endDate = now;
  // Add new stage entry
  grow.stageHistory.push({ stage: nextStageId, startDate: now, endDate: null });

  store.commit('grow', grow);
  store.publish('stage:changed', { plantId, oldStage, newStage: nextStageId });
}

/**
 * renderDryCureView(container, store) — Dry/cure tracking view.
 */
export function renderDryCureView(container, store) {
  container.innerHTML = '';
  const grow = store.state.grow;
  if (!grow || !grow.plants) {
    container.textContent = 'No active grow.';
    return;
  }

  const dryCurePlants = grow.plants.filter(p => p.stage === 'drying' || p.stage === 'curing');
  if (dryCurePlants.length === 0) {
    container.innerHTML = '<p class="text-muted">No plants currently in drying or curing stage.</p>';
    return;
  }

  for (const plant of dryCurePlants) {
    const section = document.createElement('div');
    section.className = 'dry-cure-plant';

    const h3 = document.createElement('h3');
    h3.textContent = `${plant.name} — ${plant.stage === 'drying' ? 'Drying' : 'Curing'}`;
    section.appendChild(h3);

    const days = getDaysInStage(plant);
    const dayInfo = document.createElement('div');
    dayInfo.className = 'text-muted';
    dayInfo.textContent = `Day ${days}`;
    section.appendChild(dayInfo);

    if (plant.stage === 'drying') {
      _renderDryingForm(section, store, plant);
    } else {
      _renderCuringForm(section, store, plant);
    }

    // Log history
    _renderLogHistory(section, plant);

    container.appendChild(section);
  }
}

function _renderDryingForm(container, store, plant) {
  const form = document.createElement('div');
  form.className = 'dry-cure-form';

  // Target conditions
  const targets = document.createElement('div');
  targets.className = 'dry-cure-targets';
  targets.innerHTML = `<strong>Target:</strong> ${DRYING_TARGETS.temp.min}-${DRYING_TARGETS.temp.max}°C, ${DRYING_TARGETS.rh.min}-${DRYING_TARGETS.rh.max}% RH`;
  form.appendChild(targets);

  // Form fields (IDs scoped by plant)
  const pid = plant.id;
  const fields = [
    { id: `dry-temp-${pid}`, label: 'Temperature (°C)', type: 'number', placeholder: '18' },
    { id: `dry-rh-${pid}`, label: 'Humidity (%)', type: 'number', placeholder: '60' },
  ];

  for (const f of fields) {
    const group = _formField(f.id, f.label, f.type, f.placeholder);
    form.appendChild(group);
  }

  // Smell dropdown
  const smellGroup = _selectField(`dry-smell-${pid}`, 'Smell Assessment', SMELL_OPTIONS_DRYING);
  form.appendChild(smellGroup);

  // Snap test
  const snapGroup = document.createElement('div');
  snapGroup.className = 'form-field';
  const snapLabel = document.createElement('label');
  const snapCheck = document.createElement('input');
  snapCheck.type = 'checkbox';
  snapCheck.id = `dry-snap-${pid}`;
  snapLabel.appendChild(snapCheck);
  snapLabel.append(' Stems snap cleanly');
  snapGroup.appendChild(snapLabel);
  form.appendChild(snapGroup);

  // Log button
  const logBtn = document.createElement('button');
  logBtn.className = 'btn btn-primary';
  logBtn.textContent = 'Log Drying Entry';
  logBtn.addEventListener('click', () => {
    const entry = {
      date: new Date().toISOString(),
      type: 'drying',
      temp: parseFloat(document.getElementById(`dry-temp-${pid}`)?.value) || null,
      rh: parseFloat(document.getElementById(`dry-rh-${pid}`)?.value) || null,
      smell: document.getElementById(`dry-smell-${pid}`)?.value || null,
      snapTest: document.getElementById(`dry-snap-${pid}`)?.checked || false,
    };
    _addLog(store, plant.id, entry);
    renderDryCureView(container.closest('#content') || container.parentElement, store);
  });
  form.appendChild(logBtn);

  container.appendChild(form);
}

function _renderCuringForm(container, store, plant) {
  const form = document.createElement('div');
  form.className = 'dry-cure-form';
  const pid = plant.id;

  const days = getDaysInStage(plant);
  const burpSchedule = getCureBurpSchedule(days);

  // Target + burp info
  const targets = document.createElement('div');
  targets.className = 'dry-cure-targets';
  targets.innerHTML = `<strong>Target jar RH:</strong> ${CURING_TARGETS.jarRH.min}-${CURING_TARGETS.jarRH.max}%<br>` +
    `<strong>Burp schedule:</strong> ${burpSchedule.label}`;
  form.appendChild(targets);

  // Form fields (IDs scoped by plant)
  const rhGroup = _formField(`cure-rh-${pid}`, 'Jar RH (%)', 'number', '60');
  form.appendChild(rhGroup);

  const smellGroup = _selectField(`cure-smell-${pid}`, 'Smell Assessment', SMELL_OPTIONS_CURING);
  form.appendChild(smellGroup);

  const burpGroup = _formField(`cure-burps-${pid}`, 'Burps today', 'number', String(burpSchedule.perDay >= 1 ? Math.round(burpSchedule.perDay) : 1));
  form.appendChild(burpGroup);

  // Cure completion prompt (min 2 weeks)
  if (days >= CURING_TARGETS.minWeeks * 7) {
    const completionPrompt = document.createElement('div');
    completionPrompt.className = 'timeline-advance-prompt';
    completionPrompt.style.marginTop = 'var(--space-3)';
    const msg = document.createElement('span');
    msg.textContent = `${plant.name} has been curing for ${days} days. Finish curing?`;
    completionPrompt.appendChild(msg);

    // Decision notes for cure completion
    const cureNotesRow = document.createElement('div');
    cureNotesRow.className = 'decision-notes';
    const cureNotesToggle = document.createElement('button');
    cureNotesToggle.className = 'decision-notes-toggle';
    cureNotesToggle.textContent = '+ Add notes';
    const cureNotesInput = document.createElement('textarea');
    cureNotesInput.className = 'input decision-notes-input';
    cureNotesInput.rows = 2;
    cureNotesInput.placeholder = 'e.g., smells amazing, smooth test burn, jar RH stable at 62%...';
    cureNotesInput.style.display = 'none';
    cureNotesToggle.addEventListener('click', () => {
      cureNotesInput.style.display = cureNotesInput.style.display === 'none' ? '' : 'none';
      if (cureNotesInput.style.display !== 'none') cureNotesInput.focus();
    });
    cureNotesRow.appendChild(cureNotesToggle);
    cureNotesRow.appendChild(cureNotesInput);
    completionPrompt.appendChild(cureNotesRow);

    const finishBtn = document.createElement('button');
    finishBtn.className = 'btn btn-primary btn-sm';
    finishBtn.textContent = 'Finish Curing';
    finishBtn.addEventListener('click', () => {
      const note = cureNotesInput.value.trim();
      if (note) _logDecisionNote(plant.id, 'cure-complete', `Finished curing after ${days} days`, note, store);
      // Section 07: route to harvest outcome form instead of advancing
      // directly to 'done'. The finish view captures yield/quality/notes
      // and sets stage='done' on submit.
      navigate(`/finish?plantId=${encodeURIComponent(plant.id)}`);
    });
    completionPrompt.appendChild(finishBtn);
    form.appendChild(completionPrompt);
  }

  // Log button
  const logBtn = document.createElement('button');
  logBtn.className = 'btn btn-primary';
  logBtn.textContent = 'Log Curing Entry';
  logBtn.addEventListener('click', () => {
    const jarRH = parseFloat(document.getElementById(`cure-rh-${pid}`)?.value) || null;
    const entry = {
      date: new Date().toISOString(),
      type: 'curing',
      jarRH,
      smell: document.getElementById(`cure-smell-${pid}`)?.value || null,
      burpCount: parseInt(document.getElementById(`cure-burps-${pid}`)?.value, 10) || 0,
    };

    // RH warnings
    if (jarRH && jarRH > CURING_TARGETS.tooMoist) {
      entry.warning = 'Too moist — leave jars open for 30 minutes';
    } else if (jarRH && jarRH < CURING_TARGETS.tooDry) {
      entry.warning = 'Too dry — consider adding a humidity pack';
    }

    _addLog(store, plant.id, entry);
    renderDryCureView(container.closest('#content') || container.parentElement, store);
  });
  form.appendChild(logBtn);

  container.appendChild(form);
}

function _addLog(store, plantId, entry) {
  const grow = store.getSnapshot().grow;
  const plant = grow.plants.find(p => p.id === plantId);
  if (!plant) return;
  if (!plant.logs) plant.logs = [];
  plant.logs.push(entry);
  store.commit('grow', grow);
}

function _renderLogHistory(container, plant) {
  const logs = (plant.logs || []).filter(l => l.type === 'drying' || l.type === 'curing');
  if (logs.length === 0) return;

  const section = document.createElement('div');
  section.className = 'log-history';
  const title = document.createElement('h4');
  title.textContent = 'Log History';
  section.appendChild(title);

  // Show most recent 10
  const recent = logs.slice(-10).reverse();
  for (const log of recent) {
    const row = document.createElement('div');
    row.className = 'log-entry';
    const date = new Date(log.date).toLocaleDateString();
    let details = date;
    if (log.type === 'drying') {
      details += ` | ${log.temp ?? '-'}°C | ${log.rh ?? '-'}% RH | ${log.smell || '-'}`;
      if (log.snapTest) details += ' | Snap ✓';
    } else {
      details += ` | Jar ${log.jarRH ?? '-'}% | ${log.smell || '-'} | ${log.burpCount || 0} burps`;
      if (log.warning) details += ` | ⚠ ${log.warning}`;
    }
    row.textContent = details;
    section.appendChild(row);
  }
  container.appendChild(section);
}

function _formField(id, label, type, placeholder) {
  const group = document.createElement('div');
  group.className = 'form-field';
  const lbl = document.createElement('label');
  lbl.setAttribute('for', id);
  lbl.textContent = label;
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.className = 'input';
  input.placeholder = placeholder;
  input.style.maxWidth = '120px';
  group.appendChild(lbl);
  group.appendChild(input);
  return group;
}

function _selectField(id, label, options) {
  const group = document.createElement('div');
  group.className = 'form-field';
  const lbl = document.createElement('label');
  lbl.setAttribute('for', id);
  lbl.textContent = label;
  const select = document.createElement('select');
  select.id = id;
  select.className = 'input';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = 'Select...';
  select.appendChild(empty);
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = opt.toLowerCase().replace(/\s+/g, '-');
    o.textContent = opt;
    select.appendChild(o);
  }
  group.appendChild(lbl);
  group.appendChild(select);
  return group;
}

function _logDecisionNote(plantId, type, action, note, store) {
  if (!store || !note) return;
  const grow = store.getSnapshot().grow;
  const plant = grow.plants?.find(p => p.id === plantId);
  if (!plant) return;
  if (!plant.logs) plant.logs = [];
  plant.logs.push({
    id: generateId(),
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    type: 'decision',
    details: { action, note, decisionType: type },
  });
  store.commit('grow', grow);
}

function _milestoneIcon(icon) {
  const icons = {
    sprout: '🌱', leaf: '🍃', scissors: '✂', bend: '↪', canopy: '🌿',
    light: '💡', 'arrow-up': '↑', flower: '🌸', bud: '🌼',
    magnify: '🔍', water: '💧', harvest: '🌾', scale: '⚖',
    snap: '💥', jar: '🫙', check: '✓',
  };
  return icons[icon] || '•';
}
