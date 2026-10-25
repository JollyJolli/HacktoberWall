const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, '2026/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, '2026/assets/2026.js'), 'utf8');

assert.match(html, /id="status"[^>]*role="status"[^>]*aria-live="polite"/);
assert.match(html, /id="retry-loading"[^>]*type="button"[^>]*hidden/);

class Element {
  constructor() {
    this.children = [];
    this.listeners = {};
    this.attributes = {};
    this.hidden = false;
    this.disabled = false;
    this.dataset = {};
    this.className = '';
    this.textContent = '';
    this.classList = { add: value => { this.className += ` ${value}`; } };
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  set innerHTML(value) { assert.equal(value, ''); this.children = []; }
  get innerHTML() { return this.children.length ? 'content' : ''; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  insertAdjacentElement(position, element) { this.inserted = element; }
}

async function createPage({ names = [], failedProfiles = [], failIndex = false } = {}) {
  const elements = Object.fromEntries(['contributors', 'status', 'retry-loading', 'contributors-title', 'theme-toggle', 'contributor-stats'].map(id => [`#${id}`, new Element()]));
  elements['#retry-loading'].hidden = true;
  const rootElement = new Element();
  const failed = new Set(failedProfiles);
  let currentNames = names;
  let indexFails = failIndex;
  const profileRequests = {};
  const profiles = {
    alice: { github: 'alice', name: 'Alice', role: 'builder', message: 'Hello', links: { github: 'https://github.com/alice' } },
    bob: { github: 'bob', name: 'Bob', role: 'contributor', message: 'Hi', links: { github: 'https://github.com/bob' } }
  };
  vm.runInNewContext(script, {
    document: { querySelector: selector => elements[selector], createElement: () => new Element(), documentElement: rootElement },
    localStorage: { setItem() {} },
    fetch: async url => {
      if (url.endsWith('/index.json')) {
        if (indexFails) throw new Error('list request failed');
        return { ok: true, json: async () => currentNames };
      }
      const name = path.basename(url, '.json');
      profileRequests[name] = (profileRequests[name] || 0) + 1;
      if (failed.has(name)) return { ok: false, json: async () => { throw new Error('failed response must not be parsed'); } };
      return { ok: true, json: async () => profiles[name] };
    }
  });
  await new Promise(setImmediate);
  return {
    elements, failed, profileRequests,
    get names() { return currentNames; }, set names(value) { currentNames = value; },
    get indexFails() { return indexFails; }, set indexFails(value) { indexFails = value; },
    get statistics() { return elements['#contributor-stats'].textContent; },
    async retry() { await elements['#retry-loading'].listeners.click(); }
  };
}

async function main() {
  const empty = await createPage();
  assert.equal(empty.elements['#status'].textContent, 'No contributors yet.');
  assert.equal(empty.elements['#retry-loading'].hidden, true);
  assert.equal(empty.elements['#contributors'].attributes['aria-busy'], 'false');
  assert.match(empty.statistics, /^0 contributors/);

  const partial = await createPage({ names: ['alice', 'bob'], failedProfiles: ['bob'] });
  assert.match(partial.elements['#status'].textContent, /Loaded 1 of 2 contributors\. 1 profile could not be loaded\./);
  assert.equal(partial.elements['#contributors'].children.length, 1, 'Successful cards survive a partial failure');
  assert.equal(partial.elements['#contributors'].children[0].children[1].textContent, 'Alice');
  assert.equal(partial.elements['#retry-loading'].hidden, false);
  assert.equal(partial.elements['#retry-loading'].disabled, false);
  assert.equal(partial.elements['#contributors'].attributes['aria-busy'], 'false');
  assert.equal(partial.elements['#contributor-stats'].hidden, true, 'Partial data must not produce misleading complete statistics');

  partial.failed.delete('bob');
  await partial.retry();
  assert.equal(partial.profileRequests.alice, 1, 'A retry should not refetch a successful profile');
  assert.equal(partial.profileRequests.bob, 2, 'A retry should request the missing profile again');
  assert.equal(partial.elements['#contributors'].children.length, 2);
  assert.equal(partial.elements['#status'].textContent, '2 total contributors');
  assert.equal(partial.elements['#retry-loading'].hidden, true);
  assert.match(partial.statistics, /^2 contributors/);

  const cardsBeforeListFailure = partial.elements['#contributors'].children;
  partial.indexFails = true;
  await partial.retry();
  assert.match(partial.elements['#status'].textContent, /2 loaded profiles remain visible/);
  assert.equal(partial.elements['#contributors'].children, cardsBeforeListFailure, 'A failed list refresh preserves visible cards');
  assert.equal(partial.elements['#retry-loading'].hidden, false);

  partial.indexFails = false;
  partial.names = [];
  await partial.retry();
  assert.equal(partial.elements['#status'].textContent, 'No contributors yet.');
  assert.equal(partial.elements['#contributors'].children.length, 0, 'A successful empty list clears stale cards');
  assert.match(partial.statistics, /^0 contributors/);

  const fullFailure = await createPage({ names: ['alice', 'bob'], failedProfiles: ['alice', 'bob'] });
  assert.equal(fullFailure.elements['#status'].textContent, 'Could not load contributors.');
  assert.equal(fullFailure.elements['#contributors'].children.length, 0);
  assert.equal(fullFailure.elements['#retry-loading'].hidden, false);

  const listFailure = await createPage({ failIndex: true });
  assert.equal(listFailure.elements['#status'].textContent, 'Could not load contributors.');
  assert.equal(listFailure.elements['#retry-loading'].hidden, false);
  console.log('PASS: contributor loading, empty/partial/full failures, retry, retained cards, accessible status, and statistics hook.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
