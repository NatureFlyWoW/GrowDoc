// GrowDoc Companion — Strain Database & Picker Tests

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // ── DATABASE INTEGRITY ─────────────────────────────────────────────────

  let STRAINS;
  try {
    const mod = await import('../data/strain-database.js');
    STRAINS = mod.STRAINS;
    assert(true, 'strain-database.js loaded successfully');
  } catch (err) {
    assert(false, `strain-database.js failed to load: ${err.message}`);
    return results;
  }

  const ids = Object.keys(STRAINS);
  assert(ids.length >= 500, `Database has 500+ strains (got ${ids.length})`);

  // Required fields
  const validTypes = ['indica-dom', 'hybrid', 'sativa-dom'];
  let missingFields = 0;
  for (const id of ids) {
    const s = STRAINS[id];
    if (!s.name || !s.flowerWeeks || !s.type) missingFields++;
  }
  assert(missingFields === 0, `All strains have required fields (name, flowerWeeks, type) — ${missingFields} missing`);

  // Flower week ranges (raised to 20 for pure sativa landraces)
  let badFlowerWeeks = 0;
  for (const id of ids) {
    const fw = STRAINS[id].flowerWeeks;
    if (!fw || fw.min > fw.max || fw.min < 4 || fw.max > 20) badFlowerWeeks++;
  }
  assert(badFlowerWeeks === 0, `All flower week ranges valid (min<=max, 4-20 weeks) — ${badFlowerWeeks} invalid`);

  // Stretch ratio ranges
  let badStretch = 0;
  for (const id of ids) {
    const sr = STRAINS[id].stretchRatio;
    if (sr && (sr.min > sr.max || sr.min < 1.0 || sr.max > 5.0)) badStretch++;
  }
  assert(badStretch === 0, `All stretch ratios in plausible range (1.0-5.0) — ${badStretch} invalid`);

  // Autoflower entries have isAuto and totalDays
  const autos = ids.filter(id => STRAINS[id].isAuto);
  assert(autos.length >= 50, `Database has 50+ autoflower entries (got ${autos.length})`);
  let badAutos = 0;
  for (const id of autos) {
    const s = STRAINS[id];
    if (!s.totalDays || s.totalDays.min > s.totalDays.max || s.totalDays.min < 50) badAutos++;
  }
  assert(badAutos === 0, `All autoflowers have valid totalDays — ${badAutos} invalid`);

  // No duplicate IDs (inherent in object keys, but check names)
  const names = ids.map(id => STRAINS[id].name.toLowerCase());
  const uniqueNames = new Set(names);
  assert(uniqueNames.size === names.length, `No duplicate strain names (${names.length} total, ${uniqueNames.size} unique)`);

  // Valid type values
  let badTypes = 0;
  for (const id of ids) {
    if (!validTypes.includes(STRAINS[id].type)) badTypes++;
  }
  assert(badTypes === 0, `All strains have valid type (indica-dom/hybrid/sativa-dom) — ${badTypes} invalid`);

  // Sensitivities are arrays
  let badSensitivities = 0;
  for (const id of ids) {
    if (!Array.isArray(STRAINS[id].sensitivities)) badSensitivities++;
  }
  assert(badSensitivities === 0, `All strains have sensitivities array — ${badSensitivities} missing`);

  // ID format: kebab-case
  let badIds = 0;
  for (const id of ids) {
    if (id !== id.toLowerCase() || /[^a-z0-9-]/.test(id)) badIds++;
  }
  assert(badIds === 0, `All strain IDs are kebab-case — ${badIds} invalid`);

  // ── STRAIN PICKER ──────────────────────────────────────────────────────

  let renderStrainPicker, searchStrains, loadStrainDatabase;
  try {
    const pickerMod = await import('../components/strain-picker.js');
    renderStrainPicker = pickerMod.renderStrainPicker;
    searchStrains = pickerMod.searchStrains;
    loadStrainDatabase = pickerMod.loadStrainDatabase;
    assert(true, 'strain-picker.js loaded successfully');
  } catch (err) {
    assert(false, `strain-picker.js failed to load: ${err.message}`);
    return results;
  }

  assert(typeof renderStrainPicker === 'function', 'renderStrainPicker is exported function');
  assert(typeof searchStrains === 'function', 'searchStrains is exported function');
  assert(typeof loadStrainDatabase === 'function', 'loadStrainDatabase is exported function');

  // Lazy loading test
  const db = await loadStrainDatabase();
  assert(db !== null && Object.keys(db).length >= 500, 'loadStrainDatabase returns 500+ strains');

  // Search filtering: case-insensitive
  const blueResults = searchStrains('blue', db);
  assert(blueResults.length > 0, 'Search "blue" returns results');
  assert(blueResults.every(([, s]) => s.name.toLowerCase().includes('blue') ||
    (s.breeder && s.breeder.toLowerCase().includes('blue'))),
    'Search results match query case-insensitively');

  // Search filtering: partial match
  const ogResults = searchStrains('og', db);
  assert(ogResults.length > 0, 'Search "og" returns results');

  // Empty search returns all
  const allResults = searchStrains('', db);
  assert(allResults.length === Object.keys(db).length, 'Empty search returns all strains');

  // Render test (DOM)
  const container = document.createElement('div');
  let selectedId = null;
  renderStrainPicker(container, {
    onSelect: (id) => { selectedId = id; },
    onCustom: () => {}
  });
  assert(container.querySelector('input') !== null, 'Picker renders search input');
  assert(container.querySelector('[role="listbox"]') !== null || container.children.length > 0,
    'Picker renders result container');

  return results;
}
