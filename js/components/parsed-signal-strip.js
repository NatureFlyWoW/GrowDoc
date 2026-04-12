// GrowDoc Companion — Parsed Signal Strip (section-08 upgrade)
//
// Upgraded from the section-02 placeholder to render real parsed keyword
// chips. The strip binds to an optional source textarea and refreshes on
// blur (not keystroke) by running the draft text through a synthetic
// Observation and calling parseObservation from the contextualizer.
//
// The regression canary: an empty draft renders nothing, a non-empty draft
// NEVER renders the literal '[parsing soon…]' string. Section-02's test
// still verifies the placeholder string lives at mount time to catch
// accidental reversals.

import { parseObservation } from '../data/note-contextualizer/index.js';

const MAX_CHIPS = 3;

/**
 * Mount a parsed-signal strip immediately after the anchor element.
 *
 * @param {HTMLElement} anchor    Element to insert the strip after.
 * @param {{ textarea?: HTMLTextAreaElement|HTMLInputElement }} [options]
 * @returns {{ element: HTMLElement, refresh: (draftText?:string) => void, destroy: () => void }}
 */
export function mountParsedSignalStrip(anchor, options = {}) {
  const strip = document.createElement('div');
  strip.className = 'nc-parsed-strip';
  strip.dataset.placeholder = 'true';
  strip.textContent = '[parsing soon…]';

  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(strip, anchor.nextSibling);
  }

  function renderChips(keywords) {
    strip.innerHTML = '';
    if (!Array.isArray(keywords) || keywords.length === 0) {
      delete strip.dataset.placeholder;
      return;
    }
    delete strip.dataset.placeholder;
    const top = keywords.slice(0, MAX_CHIPS);
    for (const kw of top) {
      const chip = document.createElement('span');
      chip.className = 'nc-keyword-chip';
      chip.textContent = kw;
      strip.appendChild(chip);
    }
  }

  function refresh(draftText) {
    const text = typeof draftText === 'string'
      ? draftText
      : (options.textarea && options.textarea.value) || '';
    if (!text.trim()) {
      strip.innerHTML = '';
      delete strip.dataset.placeholder;
      return;
    }
    const obs = {
      id: 'draft',
      createdAt: new Date().toISOString(),
      observedAt: new Date().toISOString(),
      source: 'log',
      sourceRefId: 'draft',
      domains: [],
      severityRaw: null,
      severity: 'info',
      severityAutoInferred: false,
      rawText: text,
      parsed: null,
      tags: [],
    };
    try {
      parseObservation(obs);
      const kws = (obs.parsed && Array.isArray(obs.parsed.keywords)) ? obs.parsed.keywords : [];
      renderChips(kws);
    } catch (err) {
      console.error('[signal-strip:parse]', err);
      strip.innerHTML = '';
      delete strip.dataset.placeholder;
    }
  }

  // If a source textarea was provided, refresh on blur (not keystroke).
  if (options.textarea && typeof options.textarea.addEventListener === 'function') {
    options.textarea.addEventListener('blur', () => refresh());
  }

  function destroy() {
    if (strip.parentNode) strip.parentNode.removeChild(strip);
  }

  return { element: strip, refresh, destroy };
}
