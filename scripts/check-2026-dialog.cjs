const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, '2026/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, '2026/assets/2026.js'), 'utf8');
assert.match(html, /<dialog id="contributor-dialog"[^>]*aria-labelledby="contributor-dialog-title"/);
assert.match(html, /<button id="contributor-dialog-close"[^>]*aria-label="Close contributor details"/);

class Element {
  constructor(owner) {
    this.owner = owner; this.children = []; this.listeners = {}; this.attributes = {};
    this.hidden = false; this.dataset = {}; this.classList = { add() {} }; this.isConnected = false;
  }
  append(...children) { for (const child of children) { child.isConnected = true; this.children.push(child); } }
  replaceChildren(...children) {
    for (const child of this.children) child.isConnected = false;
    this.children = [];
    this.append(...children);
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
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
  const ids = ['contributors', 'status', 'contributors-title', 'theme-toggle', 'contributor-dialog', 'contributor-dialog-title', 'contributor-dialog-content', 'contributor-dialog-close', 'contributor-stats'];
  const elements = Object.fromEntries(ids.map(id => [`#${id}`, new Element(owner)]));
  const profiles = [
    { github: 'alice', name: 'Alice Example', role: 'builder', country: 'Canada', message: 'Builds useful things.', bio: 'A contributor bio.', learned: ['JavaScript'], links: { github: 'https://github.com/alice', website: 'javascript:alert(1)', linkedin: null } },
    { github: 'bob', name: 'Bob Example', role: 'contributor', country: null, message: 'Hello.', links: { github: 'https://github.com/bob', website: null, linkedin: null } }
  ];
  const document = {
    get activeElement() { return owner.activeElement; },
    querySelector: selector => elements[selector],
    createElement: () => new Element(owner),
    documentElement: new Element(owner)
  };
  vm.runInNewContext(script, {
    document, URL, localStorage: { setItem() {} },
    fetch: async url => ({
      ok: true,
      json: async () => url.endsWith('/index.json') ? ['alice', 'bob'] : profiles.find(profile => url.endsWith(`/${profile.github}.json`))
    })
  });
  await new Promise(setImmediate);

  const cards = elements['#contributors'].children;
  assert.equal(cards.length, 2);
  const aliceButton = cards[0].children.find(child => child.textContent === 'View details');
  assert(aliceButton, 'Every rendered contributor has a native details button');
  assert.equal(aliceButton.type, 'button');
  assert.equal(aliceButton.attributes['aria-haspopup'], 'dialog');
  aliceButton.listeners.click();
  const dialog = elements['#contributor-dialog'];
  assert.equal(dialog.open, true);
  assert.equal(document.activeElement, elements['#contributor-dialog-title']);
  assert.equal(elements['#contributor-dialog-title'].textContent, 'Alice Example details');
  const content = elements['#contributor-dialog-content'];
  assert(content.children.some(node => node.textContent === 'A contributor bio.'));
  assert(content.children.some(node => node.children?.some(item => item.textContent === 'JavaScript')));
  const externalLinks = content.children.flatMap(node => node.children || []).filter(node => node.href);
  assert.deepEqual(externalLinks.map(link => link.href), ['https://github.com/alice']);
  assert.equal(externalLinks[0].rel, 'noopener noreferrer');

  elements['#contributor-dialog-close'].listeners.click();
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, aliceButton, 'Closing returns focus to the invoking control');

  const search = elements['#contributors-title'].inserted;
  search.value = 'bob';
  search.listeners.keyup({ target: search });
  assert.equal(elements['#contributors'].children.length, 1);
  const bobButton = elements['#contributors'].children[0].children.find(child => child.textContent === 'View details');
  assert(bobButton, 'Cards rendered again by search retain their dialog control');
  bobButton.listeners.click();
  assert.equal(elements['#contributor-dialog-title'].textContent, 'Bob Example details');
  elements['#contributor-dialog-close'].listeners.click();
  assert.equal(document.activeElement, bobButton);
  console.log('PASS: dialog content, safe links, focus entry/return, and search-rendered card controls.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
