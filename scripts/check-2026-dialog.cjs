const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, '2026/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, '2026/assets/2026.js'), 'utf8');
assert.match(html, /<dialog id="contributor-dialog"[^>]*aria-labelledby="contributor-dialog-title"/);
assert.match(html, /<button(?=[^>]*id="contributor-dialog-close")(?=[^>]*aria-label="Close contributor details")[^>]*>/);

class Element {
  constructor(owner) {
    this.owner = owner; this.children = []; this.listeners = {}; this.attributes = {};
    this.hidden = false; this.disabled = false; this.value = ''; this.dataset = {}; this.className = ''; this.isConnected = false; this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
  }
  append(...children) { for (const child of children) { child.isConnected = true; this.children.push(child); } }
  replaceChildren(...children) {
    for (const child of this.children) child.isConnected = false;
    this.children = [];
    this.append(...children);
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  querySelector(selector) { for (const child of this.children) { if (selector.startsWith('.') && child.className.split(/\s+/).includes(selector.slice(1))) return child; const found = child.querySelector?.(selector); if (found) return found; } return null; }
  scrollIntoView(options) { this.scrollOptions = options; }
  setAttribute(name, value) { this.attributes[name] = value; }
  insertAdjacentElement(position, element) { element.isConnected = true; this.inserted = element; }
  focus() { this.owner.activeElement = this; }
  showModal() { this.open = true; }
  close() { this.open = false; this.listeners.close?.(); }
  set innerHTML(value) { assert.equal(value, ''); this.replaceChildren(); }
  get innerHTML() { return this.children.length ? 'content' : ''; }
}

async function main() {
  const owner = { activeElement: null };
  const ids = ['contributors', 'status', 'search', 'sort', 'role', 'country', 'random', 'random-status', 'empty', 'filters', 'theme-toggle', 'contributor-dialog', 'contributor-dialog-title', 'contributor-dialog-content', 'contributor-dialog-close', 'contributor-stats', 'retry-loading'];
  const elements = Object.fromEntries(ids.map(id => [`#${id}`, new Element(owner)]));
  const profiles = [
    { github: 'alice', name: 'Alice Example', role: 'builder', country: 'Canada', message: 'Builds useful things.', bio: 'A contributor bio.', learned: ['JavaScript'], links: { github: 'https://github.com/alice', website: 'javascript:alert(1)', linkedin: null } },
    { github: 'bob', name: 'Bob Example', role: 'contributor', country: null, message: 'Hello.', links: { github: 'https://github.com/bob', website: null, linkedin: null } }
  ];
  elements['#sort'].value = 'Default'; elements['#role'].value = 'all'; elements['#country'].value = 'all';
  const window = { location: { hash: '' }, addEventListener() {}, matchMedia: () => ({ matches: true }), setTimeout() {} };
  const document = {
    get activeElement() { return owner.activeElement; },
    addEventListener() {},
    querySelector: selector => elements[selector],
    createElement: () => new Element(owner),
    documentElement: new Element(owner)
  };
  vm.runInNewContext(script, {
    document, URL, window, localStorage: { setItem() {} },
    fetch: async url => ({
      ok: true,
      json: async () => url.endsWith('/index.json') ? ['alice', 'bob'] : profiles.find(profile => url.endsWith(`/${profile.github}.json`))
    })
  });
  await new Promise(setImmediate);

  const cards = elements['#contributors'].children;
  assert.equal(cards.length, 2);
  assert(cards[0].querySelector('.stone-content'));
  assert(cards[0].querySelector('.stone-identity'));
  const actions = cards[0].querySelector('.stone-actions');
  assert.equal(actions.children.length, 2, 'Share and details stay inside the fixed action zone');
  const aliceButton = cards[0].querySelector('.detail');
  assert(aliceButton, 'Every rendered contributor has a native details button');
  assert.equal(aliceButton.type, 'button');
  assert.equal(aliceButton.attributes['aria-haspopup'], 'dialog');
  aliceButton.listeners.click();
  const dialog = elements['#contributor-dialog'];
  assert.equal(dialog.open, true);
  assert.equal(document.activeElement, elements['#contributor-dialog-title']);
  assert.equal(elements['#contributor-dialog-title'].textContent, 'Alice Example');
  const content = elements['#contributor-dialog-content'];
  assert(content.children.some(node => node.textContent === 'A contributor bio.'));
  const allNodes = [];
  const collectNodes = node => { allNodes.push(node); for (const child of node.children || []) collectNodes(child); };
  content.children.forEach(collectNodes);
  assert(allNodes.some(node => node.textContent === 'JavaScript'));
  const externalLinks = [];
  const collectLinks = node => { if (node.href) externalLinks.push(node); for (const child of node.children || []) collectLinks(child); };
  content.children.forEach(collectLinks);
  assert.deepEqual(externalLinks.map(link => link.href), ['https://github.com/alice']);
  assert.equal(externalLinks[0].rel, 'noopener noreferrer');

  elements['#contributor-dialog-close'].listeners.click();
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, aliceButton, 'Closing returns focus to the invoking control');

  const search = elements['#search'];
  search.value = 'bob';
  search.listeners.input();
  assert.equal(elements['#contributors'].children.length, 1);
  const bobButton = elements['#contributors'].children[0].querySelector('.detail');
  assert(bobButton, 'Cards rendered again by search retain their dialog control');
  bobButton.listeners.click();
  assert.equal(elements['#contributor-dialog-title'].textContent, 'Bob Example');
  elements['#contributor-dialog-close'].listeners.click();
  assert.equal(document.activeElement, bobButton);
  console.log('PASS: dialog content, safe links, focus entry/return, and search-rendered card controls.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
