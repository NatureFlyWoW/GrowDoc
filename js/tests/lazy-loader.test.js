import { generateTasks } from '../components/task-engine.js';
import { getActiveEdgeCases } from '../main.js';

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  assert(typeof window.__growdocStore === 'object', 'boot() ran synchronously — store is set');

  const ecResult = getActiveEdgeCases({ plant: {}, grow: {} });
  assert(!(ecResult instanceof Promise), 'getActiveEdgeCases returns array not Promise');
  assert(Array.isArray(ecResult), 'getActiveEdgeCases returns [] when engine not ready');

  const minPlant = {
    id: 'test-lazy', name: 'Test', stage: 'seedling',
    stageStartDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    logs: [],
  };
  const minGrow = { medium: 'soil', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } };

  const tasks = await generateTasks(minPlant, minGrow);
  assert(Array.isArray(tasks), 'generateTasks works without engine (fallback)');

  const tasks2 = await generateTasks(minPlant, minGrow);
  assert(Array.isArray(tasks2), 'generateTasks works with loaded engine');

  return results;
}
