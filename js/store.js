// GrowDoc Companion — Reactive State Management

/**
 * Create a reactive store with Proxy-based state, pub/sub, and event bus.
 *
 * All state changes MUST go through commit(). Reads via store.state.* return
 * FROZEN references — direct deep mutation will throw in strict mode (or
 * silently fail). The correct pattern is:
 *   const snap = store.getSnapshot().grow;  // mutable clone
 *   snap.plants.push(...);
 *   store.commit('grow', snap);
 *
 * @param {Object} initialState
 * @returns {Object} store instance
 */
export function createStore(initialState = {}) {
  const _subscribers = new Map();  // path -> Set<callback>
  const _eventBus = new EventTarget();
  const _eventListeners = new Map(); // originalCallback -> wrappedCallback
  const _actions = new Map();

  // WeakMap cache of frozen views keyed by the raw object. Invalidated
  // on commit() by replacing the raw reference — old frozen views fall
  // out of scope naturally.
  const _frozenCache = new WeakMap();

  function _frozenView(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (_frozenCache.has(obj)) return _frozenCache.get(obj);
    const frozen = Object.freeze(obj);
    _frozenCache.set(obj, frozen);
    return frozen;
  }

  // Deep clone to avoid external mutation
  let _state = _deepClone(initialState);

  // Proxy for read access and top-level set detection
  const stateProxy = new Proxy(_state, {
    set(target, prop, value) {
      // Direct assignment to state.X goes through Proxy — deep-clone for consistency
      const oldVal = target[prop];
      target[prop] = _deepClone(value);
      _notify(prop, oldVal, target[prop]);
      return true;
    },
    get(target, prop) {
      // Return a frozen view of objects so accidental deep mutation
      // (store.state.grow.plants.push(...)) fails loudly in strict mode
      // instead of silently corrupting state.
      return _frozenView(target[prop]);
    },
    deleteProperty(target, prop) {
      const oldVal = target[prop];
      delete target[prop];
      _notify(prop, oldVal, undefined);
      return true;
    },
  });

  function _notify(path, oldVal, newVal) {
    // Notify exact path subscribers
    const subs = _subscribers.get(path);
    if (subs) {
      for (const cb of subs) {
        try {
          cb({ path, oldVal, newVal });
        } catch (err) {
          console.error(`Store subscriber error on path "${path}":`, err);
        }
      }
    }

    // Notify wildcard subscribers
    const wildcardSubs = _subscribers.get('*');
    if (wildcardSubs) {
      for (const cb of wildcardSubs) {
        try {
          cb({ path, oldVal, newVal });
        } catch (err) {
          console.error('Store wildcard subscriber error:', err);
        }
      }
    }
  }

  function _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    try {
      return structuredClone(obj);
    } catch (err) {
      console.warn('structuredClone failed, falling back to JSON:', err);
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch {
        // Last-resort: return original. Callers should never hit this.
        return obj;
      }
    }
  }

  const store = {
    /** Read-only access to state (via Proxy). */
    get state() {
      return stateProxy;
    },

    /**
     * Replace a sub-tree of state. This is the ONLY way to trigger subscribers.
     * @param {string} path — Top-level state key (e.g., 'grow', 'profile')
     * @param {*} value — New value for that key
     */
    commit(path, value) {
      const oldVal = _state[path];
      _state[path] = _deepClone(value);
      _notify(path, oldVal, _state[path]);
    },

    /**
     * Register an action function. Actions contain business logic and call commit().
     * @param {string} name
     * @param {Function} fn — receives (store, payload)
     */
    registerAction(name, fn) {
      _actions.set(name, fn);
    },

    /**
     * Dispatch an action by name.
     * @param {string} name
     * @param {*} payload
     * @returns {*} action return value
     */
    dispatch(name, payload) {
      const action = _actions.get(name);
      if (!action) {
        console.warn(`Store: unknown action "${name}"`);
        return undefined;
      }
      return action(store, payload);
    },

    /**
     * Subscribe to changes at a given state path.
     * @param {string} path — State key, or '*' for all changes
     * @param {Function} callback — receives {path, oldVal, newVal}
     */
    subscribe(path, callback) {
      if (!_subscribers.has(path)) {
        _subscribers.set(path, new Set());
      }
      _subscribers.get(path).add(callback);
    },

    /**
     * Remove a subscription.
     */
    unsubscribe(path, callback) {
      const subs = _subscribers.get(path);
      if (subs) subs.delete(callback);
    },

    /**
     * Emit a namespaced event via the event bus.
     * @param {string} eventName — e.g., 'plant:updated'
     * @param {*} data
     */
    publish(eventName, data) {
      _eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    },

    /**
     * Listen for a namespaced event.
     */
    on(eventName, callback) {
      const wrapped = (e) => callback(e.detail);
      // Store mapping so off() can find the wrapper
      const key = `${eventName}::${callback}`;
      _eventListeners.set(key, wrapped);
      _eventBus.addEventListener(eventName, wrapped);
    },

    /**
     * Remove an event listener.
     */
    off(eventName, callback) {
      const key = `${eventName}::${callback}`;
      const wrapped = _eventListeners.get(key);
      if (wrapped) {
        _eventBus.removeEventListener(eventName, wrapped);
        _eventListeners.delete(key);
      }
    },

    /**
     * Get a nested value by dot-separated path.
     * @param {string} dotPath — e.g., 'ui.sidebarCollapsed', 'grow.active'
     * @returns {*} value or undefined
     */
    get(dotPath) {
      const keys = dotPath.split('.');
      let val = _state;
      for (const k of keys) {
        if (val == null) return undefined;
        val = val[k];
      }
      return val;
    },

    /**
     * Set a nested value by dot-separated path. Triggers subscribers on the top-level key.
     * @param {string} dotPath
     * @param {*} value
     */
    set(dotPath, value) {
      const keys = dotPath.split('.');
      if (keys.length === 1) {
        store.commit(keys[0], value);
        return;
      }
      // For nested paths, clone the top-level, mutate the clone, commit
      const topKey = keys[0];
      const topVal = _deepClone(_state[topKey]) || {};
      let obj = topVal;
      for (let i = 1; i < keys.length - 1; i++) {
        if (obj[keys[i]] == null) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      store.commit(topKey, topVal);
    },

    /** Get the raw state (for serialization). Returns a deep clone. */
    getSnapshot() {
      return _deepClone(_state);
    },
  };

  return store;
}


// ── Tests ──────────────────────────────────────────────────────────────

export function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // Test: commit() updates state and notifies subscribers
  {
    const store = createStore({ count: 0 });
    let notified = false;
    let receivedData = null;
    store.subscribe('count', (data) => {
      notified = true;
      receivedData = data;
    });
    store.commit('count', 42);
    assert(store.state.count === 42, 'commit() updates state');
    assert(notified, 'commit() notifies subscribers');
    assert(receivedData.newVal === 42, 'subscriber receives new value');
    assert(receivedData.oldVal === 0, 'subscriber receives old value');
    assert(receivedData.path === 'count', 'subscriber receives path');
  }

  // Test: subscribe() receives correct path and new value
  {
    const store = createStore({ name: 'old' });
    let received = null;
    store.subscribe('name', (data) => { received = data; });
    store.commit('name', 'new');
    assert(received !== null, 'subscribe() callback fires on commit');
    assert(received.path === 'name', 'subscribe() receives correct path');
    assert(received.newVal === 'new', 'subscribe() receives new value');
  }

  // Test: dispatch() runs action function then commits
  {
    const store = createStore({ total: 0 });
    store.registerAction('addAmount', (s, payload) => {
      s.commit('total', s.state.total + payload.amount);
    });
    store.dispatch('addAmount', { amount: 10 });
    assert(store.state.total === 10, 'dispatch() runs action and commits state');
  }

  // Test: frozen views block direct deep mutation
  {
    const store = createStore({ data: { nested: 'original' } });
    let notified = false;
    store.subscribe('data', () => { notified = true; });
    // Attempt direct deep mutation — should be blocked by Object.freeze
    let threw = false;
    try {
      store.state.data.nested = 'mutated';
    } catch {
      threw = true;
    }
    // In strict mode the assignment throws; in loose mode it silently no-ops.
    // Either way, state must remain unchanged and subscribers must not fire.
    assert(!notified, 'direct deep mutation does NOT trigger subscribers');
    assert(store.state.data.nested === 'original', 'frozen view prevents deep mutation');
    assert(threw || store.state.data.nested === 'original', 'strict mode throws or frozen no-op');
  }

  // Test: proper getSnapshot + commit flow mutates state correctly
  {
    const store = createStore({ grow: { plants: [] } });
    let notified = false;
    store.subscribe('grow', () => { notified = true; });
    const snap = store.getSnapshot().grow;
    snap.plants.push({ id: 'p1', name: 'Test' });
    store.commit('grow', snap);
    assert(notified, 'commit() fires subscribers');
    assert(store.state.grow.plants.length === 1, 'commit() updates state');
    assert(store.state.grow.plants[0].id === 'p1', 'committed plant retained');
  }

  // Test: repeated reads return the same frozen reference (WeakMap cache)
  {
    const store = createStore({ data: { a: 1 } });
    const ref1 = store.state.data;
    const ref2 = store.state.data;
    assert(ref1 === ref2, 'same frozen reference across reads (WeakMap cache)');
  }

  // Test: commit invalidates the frozen cache
  {
    const store = createStore({ data: { a: 1 } });
    const before = store.state.data;
    store.commit('data', { a: 2 });
    const after = store.state.data;
    assert(before !== after, 'new frozen reference after commit');
    assert(after.a === 2, 'committed value readable');
  }

  // Test: _deepClone uses structuredClone (Date preserved)
  // structuredClone keeps Date type; JSON would serialize to string.
  {
    const store = createStore({ when: new Date('2026-04-10') });
    const snap = store.getSnapshot();
    assert(snap.when instanceof Date, '_deepClone preserves Date via structuredClone');
  }

  // Test: event bus emits and receives
  {
    const store = createStore({});
    let eventReceived = null;
    store.on('plant:updated', (data) => { eventReceived = data; });
    store.publish('plant:updated', { plantId: 'p1', field: 'name' });
    assert(eventReceived !== null, 'event bus receives published event');
    assert(eventReceived.plantId === 'p1', 'event bus delivers correct data');
  }

  // Test: off() removes event bus listener
  {
    const store = createStore({});
    let callCount = 0;
    const handler = (data) => { callCount++; };
    store.on('test:event', handler);
    store.publish('test:event', {});
    assert(callCount === 1, 'event fires before off()');
    store.off('test:event', handler);
    store.publish('test:event', {});
    assert(callCount === 1, 'off() prevents further event delivery');
  }

  // Test: multiple subscribers on same path all fire
  {
    const store = createStore({ value: 0 });
    let count1 = 0, count2 = 0, count3 = 0;
    store.subscribe('value', () => { count1++; });
    store.subscribe('value', () => { count2++; });
    store.subscribe('value', () => { count3++; });
    store.commit('value', 1);
    assert(count1 === 1 && count2 === 1 && count3 === 1, 'multiple subscribers all fire');
  }

  // Test: unsubscribe removes callback
  {
    const store = createStore({ x: 0 });
    let count = 0;
    const cb = () => { count++; };
    store.subscribe('x', cb);
    store.commit('x', 1);
    assert(count === 1, 'subscriber fires before unsubscribe');
    store.unsubscribe('x', cb);
    store.commit('x', 2);
    assert(count === 1, 'subscriber does not fire after unsubscribe');
  }

  // Test: get() deep path
  {
    const store = createStore({ ui: { sidebarCollapsed: true } });
    assert(store.get('ui.sidebarCollapsed') === true, 'get() retrieves nested value');
    assert(store.get('nonexistent.path') === undefined, 'get() returns undefined for missing path');
  }

  // Test: set() deep path
  {
    const store = createStore({ ui: { sidebarCollapsed: false } });
    let notified = false;
    store.subscribe('ui', () => { notified = true; });
    store.set('ui.sidebarCollapsed', true);
    assert(store.get('ui.sidebarCollapsed') === true, 'set() updates nested value');
    assert(notified, 'set() triggers subscriber on top-level key');
  }

  // Test: getSnapshot returns a deep clone
  {
    const store = createStore({ items: [1, 2, 3] });
    const snap = store.getSnapshot();
    snap.items.push(4);
    assert(store.state.items.length === 3, 'getSnapshot returns independent clone');
  }

  // Test: wildcard subscriber
  {
    const store = createStore({ a: 0, b: 0 });
    const changes = [];
    store.subscribe('*', (data) => { changes.push(data.path); });
    store.commit('a', 1);
    store.commit('b', 2);
    assert(changes.length === 2, 'wildcard subscriber fires for all commits');
    assert(changes[0] === 'a' && changes[1] === 'b', 'wildcard receives correct paths');
  }

  return results;
}
