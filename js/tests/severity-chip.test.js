// GrowDoc Companion — Severity Chip Tests (section-02)
//
// DOM tests use scratch containers per case, torn down between tests.
// Canary: the "parsing soon…" placeholder string MUST match the one
// section-08 rewrites, so updating it here without updating that test
// will break the regression fence.

import {
  mountSeverityChip,
  autoInferSeverity,
} from '../components/severity-chip.js';
import { mountParsedSignalStrip } from '../components/parsed-signal-strip.js';

function scratch() {
  const d = document.createElement('div');
  document.body.appendChild(d);
  return d;
}

function cleanup(...els) {
  for (const el of els) if (el && el.parentNode) el.parentNode.removeChild(el);
}

export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };

  // 1 — renders three chips in DOM order: info, watch, alert
  {
    const box = scratch();
    mountSeverityChip(box, {});
    const chips = box.querySelectorAll('.nc-severity-chip');
    assert(chips.length === 3, 'severity-chip: renders 3 chips');
    assert(chips[0].textContent === 'info', 'severity-chip: order[0] === info');
    assert(chips[1].textContent === 'watch', 'severity-chip: order[1] === watch');
    assert(chips[2].textContent === 'alert', 'severity-chip: order[2] === alert');
    cleanup(box);
  }

  // 2 — clicking alert writes 'urgent' to target
  {
    const box = scratch();
    const target = {};
    mountSeverityChip(box, { target, targetKey: 'severity' });
    box.querySelector('.nc-severity-chip-alert').click();
    assert(target.severity === 'urgent', 'click alert → target.severity === urgent');
    cleanup(box);
  }

  // 3 — clicking watch writes 'concern'
  {
    const box = scratch();
    const target = {};
    mountSeverityChip(box, { target });
    box.querySelector('.nc-severity-chip-watch').click();
    assert(target.severity === 'concern', 'click watch → target.severity === concern');
    cleanup(box);
  }

  // 4 — clicking info writes null
  {
    const box = scratch();
    const target = { severity: 'urgent' };
    mountSeverityChip(box, { target, initial: 'urgent' });
    box.querySelector('.nc-severity-chip-info').click();
    assert(target.severity === null, 'click info → target.severity === null');
    cleanup(box);
  }

  // 5 — autoInferSeverity: 'dying' → urgent
  {
    assert(autoInferSeverity('the plant is dying') === 'urgent', "autoInferSeverity('dying') → urgent");
  }

  // 6 — autoInferSeverity: 'looks fine' → null
  {
    assert(autoInferSeverity('looks fine') === null, "autoInferSeverity('looks fine') → null");
  }

  // 7 — auto-infer via textarea blur sets severityAutoInferred flag
  {
    const box = scratch();
    const ta = document.createElement('textarea');
    box.appendChild(ta);
    const target = {};
    const chip = mountSeverityChip(box, { target, autoInferFrom: ta });
    ta.value = 'the plant is dying';
    ta.dispatchEvent(new Event('blur'));
    assert(chip.getValue() === 'urgent', 'auto-infer on blur: urgent detected');
    assert(chip.isAutoInferred() === true, 'auto-infer on blur: flag set');
    assert(target.severity === 'urgent', 'auto-infer on blur: target updated');
    assert(chip.element.dataset.autoInferred === 'true', 'auto-infer on blur: data attribute set');
    cleanup(box);
  }

  // 8 — user override clears severityAutoInferred flag
  {
    const box = scratch();
    const ta = document.createElement('textarea');
    box.appendChild(ta);
    const chip = mountSeverityChip(box, { target: {}, autoInferFrom: ta });
    ta.value = 'rotting at the base';
    ta.dispatchEvent(new Event('blur'));
    assert(chip.isAutoInferred() === true, 'pre-override: flag set');
    box.querySelector('.nc-severity-chip-watch').click();
    assert(chip.isAutoInferred() === false, 'manual click clears autoInferred flag');
    assert(chip.element.dataset.autoInferred === undefined, 'manual click removes data attribute');
    cleanup(box);
  }

  // 9 — initial='urgent' hydrates alert as aria-checked
  {
    const box = scratch();
    mountSeverityChip(box, { initial: 'urgent' });
    const alertBtn = box.querySelector('.nc-severity-chip-alert');
    assert(alertBtn.getAttribute('aria-checked') === 'true', 'initial=urgent hydrates alert button');
    cleanup(box);
  }

  // 10 — mountParsedSignalStrip renders the literal placeholder canary
  //      Section-08 has a regression test that asserts this string is GONE.
  {
    const box = scratch();
    const anchor = document.createElement('textarea');
    box.appendChild(anchor);
    const strip = mountParsedSignalStrip(anchor);
    assert(strip.element.textContent === '[parsing soon…]', 'parsed-signal-strip: placeholder text canary');
    assert(strip.element.dataset.placeholder === 'true', 'parsed-signal-strip: placeholder data attr');
    strip.destroy();
    assert(!strip.element.parentNode, 'parsed-signal-strip: destroy removes from DOM');
    cleanup(box);
  }

  // 11 — mount twice in the same container: independent instances
  {
    const box = scratch();
    const t1 = {};
    const t2 = {};
    mountSeverityChip(box, { target: t1 });
    mountSeverityChip(box, { target: t2 });
    const rows = box.querySelectorAll('.nc-severity-chip-row');
    assert(rows.length === 2, 'two mounts create two rows');
    rows[0].querySelector('.nc-severity-chip-alert').click();
    rows[1].querySelector('.nc-severity-chip-watch').click();
    assert(t1.severity === 'urgent', 'first mount writes to first target');
    assert(t2.severity === 'concern', 'second mount writes to second target');
    cleanup(box);
  }

  return results;
}
