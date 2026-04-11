// GrowDoc Companion — Parsed Signal Strip (section-02 placeholder)
//
// Section-02 ships the scaffold and the literal placeholder "[parsing soon…]".
// Section-08 upgrades `refresh()` to render real parsed keyword chips from
// the observation index. Section-08 has a regression test asserting the
// placeholder string is gone — do NOT remove the canary in section-02 tests.
//
// This module deliberately does NOT import from js/data/note-contextualizer/*
// or js/data/observation-schema.js. Section-01 may ship in parallel, and the
// strip must not care whether the schema module has landed yet.

/**
 * Mount a parsed-signal strip immediately after the anchor element.
 *
 * @param {HTMLElement} anchor    Element to insert the strip after.
 * @param {Object}       [_options] Reserved for section-08.
 * @returns {{ element: HTMLElement, refresh: () => void, destroy: () => void }}
 */
export function mountParsedSignalStrip(anchor, _options = {}) {
  const strip = document.createElement('div');
  strip.className = 'nc-parsed-strip';
  strip.dataset.placeholder = 'true';
  strip.textContent = '[parsing soon…]';

  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(strip, anchor.nextSibling);
  }

  function refresh() {
    // No-op until section-08. Keeping the stable export surface so
    // callers can install once at mount time and never check versions.
  }

  function destroy() {
    if (strip.parentNode) strip.parentNode.removeChild(strip);
  }

  return { element: strip, refresh, destroy };
}
