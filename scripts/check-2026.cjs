const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const edition = path.join(root, '2026');
const contributorsDir = path.join(edition, 'data', 'contributors');
const read = file => fs.readFileSync(path.join(edition, file), 'utf8').replace(/^\uFEFF/, '');
const html = read('index.html');
const names = JSON.parse(read('data/contributors/index.json'));
const files = fs.readdirSync(contributorsDir);
const contributorFiles = files.filter(file => file.endsWith('.json') && file !== '_template.json' && file !== 'index.json');
const script = read('assets/2026.js');
const styles = read('assets/2026.css');

const pageUrl = 'https://hacktoberwall.formen.cc/2026/';
const head = html.split('</head>')[0];
function metadata(pattern, expected) {
  const matches = [...head.matchAll(pattern)];
  assert.equal(matches.length, 1, `Expected one ${pattern}`);
  assert.equal(matches[0][1], expected);
}
const title = 'HacktoberWall 2026';
const description = 'Join HacktoberWall 2026, an open-source contributor wall for first contributions, community contributors, and builders.';
const imageUrl = 'https://hacktoberwall.formen.cc/assets/social.png';
const imageAlt = 'HacktoberWall: 2024, a pause in 2025, and the return in 2026.';
metadata(/<title>([^<]+)<\/title>/g, title);
metadata(/<link rel="canonical" href="([^"]+)"/g, pageUrl);
metadata(/<link rel="icon" href="([^"]+)" type="image\/svg\+xml"/g, '../assets/favicon.svg');
for (const [key, value] of Object.entries({
  description, 'twitter:card': 'summary_large_image', 'twitter:title': title,
  'twitter:description': description, 'twitter:image': imageUrl, 'twitter:image:alt': imageAlt
})) metadata(new RegExp(`<meta name="${key}" content="([^"]+)"`, 'g'), value);
for (const [key, value] of Object.entries({
  type: 'website', site_name: 'HacktoberWall', title, description, url: pageUrl,
  image: imageUrl, 'image:width': '1200', 'image:height': '630', 'image:alt': imageAlt
})) metadata(new RegExp(`<meta property="og:${key}" content="([^"]+)"`, 'g'), value);
for (const asset of [imageUrl, new URL('../assets/favicon.svg', pageUrl).href]) {
  const url = new URL(asset);
  assert.equal(url.origin, new URL(pageUrl).origin, 'Sharing assets should use the canonical host');
  assert(fs.existsSync(path.join(root, url.pathname)), `Missing repository-owned asset: ${asset}`);
}
const image = fs.readFileSync(path.join(root, 'assets/social.png'));
assert.equal(image.readUInt32BE(16), 1200, 'Open Graph image width should match the asset');
assert.equal(image.readUInt32BE(20), 630, 'Open Graph image height should match the asset');

assert.equal((html.match(/<h1\b/g) || []).length, 1, '2026 page should have one h1');
assert(script.includes('data/contributors/index.json'), '2026 script should load the generated contributor index');
assert(script.includes("avatar.addEventListener('error'"), 'avatars should handle failed image requests');
assert(script.includes('avatar.hidden = true'), 'failed avatar images should be hidden');
assert(script.includes('fallback.hidden = false'), 'failed avatar images should reveal a fallback');
assert(script.includes("fallback.setAttribute('aria-label'"), 'avatar fallbacks should have accessible text');
assert.match(styles, /\.avatar\s*{[^}]*width:\s*64px;[^}]*height:\s*64px;/s, 'avatar containers should preserve their dimensions');
assert.match(styles, /\.avatar-image\[hidden\][^{]*{[^}]*display:\s*none;/s, 'failed avatar images should not remain visible');
assert(Array.isArray(names), 'generated index should be an array of contributor names');
assert(!names.includes('your-github-username'), 'template must not be rendered');
assert.equal(names.length, contributorFiles.length, 'generated contributor count should match real JSON files');
assert(names.includes('jollyjolli'), 'JollyJolli example profile should be listed');

for (const name of names) {
  assert.match(name, /^[a-z0-9-]+$/, `${name} should be a safe JSON filename`);
  const profile = JSON.parse(fs.readFileSync(path.join(contributorsDir, `${name}.json`), 'utf8'));
  assert.equal(profile.github.toLowerCase(), name, `${name}.json must match the github field`);
  assert(profile.github && profile.name && profile.role && profile.message, `${name}.json is missing required fields`);
  assert(['first-contribution', 'contributor', 'builder'].includes(profile.role), `${name}.json has an unsupported role`);
  assert.equal(profile.links.github, `https://github.com/${profile.github}`);
}

for (const file of ['assets/2026.js']) execFileSync(process.execPath, ['--check', path.join(edition, file)]);
assert.equal(execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', '2024/'], { cwd: root, encoding: 'utf8' }).trim(), '', 'Protected 2024 edition changed');
console.log('PASS: 2026 contributor names index, JSON profiles, page wiring, JS syntax, and 2024 integrity.');

assert.match(html, /<p id="contributor-stats" class="meta" role="status" hidden><\/p>/);
assert(html.indexOf('id="contributor-stats"') < html.indexOf('id="contributors"'), 'Statistics should be above the Wall');

async function checkStatistics() {
  const vm = require('node:vm');
  // Run the page script with a minimal DOM, including its real loading and filter handlers.
  class Element {
    constructor(tagName = 'div') {
      this.tagName = tagName;
      this.children = []; this.listeners = {}; this.textContent = ''; this.hidden = false;
      this.classNames = new Set();
      this.classList = {
        add: name => this.classNames.add(name),
        remove: name => this.classNames.delete(name),
        contains: name => this.classNames.has(name)
      };
      this.dataset = {}; this.attributes = {};
    }
    append(...children) {
      this.children.push(...children);
      if (this.tagName === 'select' && !this.value && children.length) this.value = children[0].value;
    }
    replaceChildren(...children) {
      this.children = children;
      if (this.tagName === 'select') this.value = children[0]?.value || '';
    }
    set innerHTML(value) { assert.equal(value, ''); this.children = []; }
    get innerHTML() { return this.children.length ? 'content' : ''; }
    setAttribute(name, value) { this.attributes[name] = value; this[name] = value; }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    insertAdjacentElement(position, element) { this.inserted = element; }
    scrollIntoView(options) { this.scrollOptions = options; }
  }
  async function load(data, fail = false) {
    const elements = Object.fromEntries(['contributors', 'status', 'contributors-title', 'contributor-stats', 'theme-toggle', 'retry-loading'].map(id => [`#${id}`, new Element()]));
    elements['#contributor-stats'].hidden = true;
    const root = new Element();
    const requests = [];
    const timers = [];
    const windowListeners = {};
    const window = {
      location: { hash: '' },
      addEventListener: (name, handler) => { (windowListeners[name] ||= []).push(handler); },
      matchMedia: () => ({ matches: true })
    };
    vm.runInNewContext(script, {
      document: { querySelector: selector => elements[selector], createElement: tagName => new Element(tagName), documentElement: root },
      localStorage: { setItem() {} },
      console,
      window,
      setTimeout: callback => { timers.push(callback); },
      fetch: async url => {
        requests.push(url);
        if (fail === true || fail === url) throw new Error('Load failed');
        if (url.endsWith('/index.json')) return { json: async () => data.map((_, i) => String(i)) };
        return { json: async () => data[Number(url.match(/(\d+)\.json$/)[1])] };
      }
    });
    await new Promise(setImmediate);
    return { elements, root, requests, timers, window, windowListeners, statistics: elements['#contributor-stats'] };
  }
  const data = names.map(name => JSON.parse(fs.readFileSync(path.join(contributorsDir, `${name}.json`), 'utf8')));
  const loaded = await load(data);
  assert(loaded.statistics.textContent.startsWith(`${data.length} contributor`), `Totals must follow the current contributor index: ${loaded.elements['#status'].textContent}`);
  assert.equal(loaded.statistics.hidden, false);
  assert.equal(loaded.elements['#contributors'].children.length, data.length);
  assert.equal(loaded.requests.length, data.length + 1, 'Statistics must not make extra requests');
  const summary = loaded.statistics.textContent;
  const search = loaded.elements['#contributors-title'].inserted;
  const sort = search.inserted;
  const role = sort.inserted;
  const country = role.inserted;
  const random = country.inserted;
  assert.equal(search.attributes['aria-label'], 'Search contributors');
  assert.equal(sort.attributes['aria-label'], 'Sort contributors');
  assert.equal(role.attributes['aria-label'], 'Filter contributors by role');
  assert.equal(country.attributes['aria-label'], 'Filter contributors by country');
  assert.deepEqual(country.children.map(option => option.textContent), ['All countries', 'Brasil', 'India', 'Mexico']);
  assert.deepEqual(role.children.map(option => option.textContent), ['All roles', 'First contribution', 'Contributor', 'Builder']);
  for (const value of ['NO SUCH CONTRIBUTOR', data[0].github.toUpperCase(), '']) {
    search.value = value;
    search.listeners.keyup({ target: search });
    assert.equal(loaded.statistics.textContent, summary, 'Search must not change the full-Wall totals');
    if (value === 'NO SUCH CONTRIBUTOR') assert.equal(loaded.elements['#contributors'].children[0].textContent, 'No contributors found.');
    else if (value) assert.equal(loaded.elements['#contributors'].children[0].className, 'card', 'Username search should still match regardless of case');
  }
  assert.equal(loaded.elements['#contributors'].children.length, data.length, 'Clearing search restores cards');
  country.value = 'mexico';
  country.listeners.change();
  assert.deepEqual(loaded.elements['#contributors'].children.map(card => card.dataset.id.toLowerCase()), ['jollyjolli'], 'Slash-separated countries should match either represented country');
  assert.equal(country.dataset.active, 'true', 'A selected country should be visibly marked active');
  role.value = 'builder';
  role.listeners.change();
  assert.deepEqual(loaded.elements['#contributors'].children.map(card => card.dataset.id.toLowerCase()), ['jollyjolli'], 'Country and role filters should compose');
  search.value = 'Jolly';
  search.listeners.keyup({ target: search });
  assert.equal(loaded.elements['#contributors'].children[0].dataset.id.toLowerCase(), 'jollyjolli', 'Search should compose with both filters');
  random.listeners.click();
  assert.equal(loaded.elements['#contributors'].children[0].scrollOptions.behavior, 'instant', 'Random selection should use the current combined result set');
  assert(loaded.elements['#contributors'].children[0].classList.contains('glowingEffect'), 'Random selection should briefly highlight its matching card');
  loaded.timers.at(-1)();
  assert(!loaded.elements['#contributors'].children[0].classList.contains('glowingEffect'), 'Random highlight should clear after its timeout');
  search.value = 'India';
  search.listeners.keyup({ target: search });
  assert.equal(loaded.elements['#contributors'].children[0].textContent, 'No contributors found.');
  random.listeners.click();
  country.value = 'all';
  country.listeners.change();
  role.value = 'all';
  role.listeners.change();
  search.value = '';
  search.listeners.keyup({ target: search });
  assert.equal(loaded.elements['#contributors'].children.length, data.length, 'All roles and countries should restore every loaded profile');
  assert.equal(role.dataset.active, 'false');
  assert.equal(country.dataset.active, 'false');
  country.value = 'india';
  country.listeners.change();
  sort.value = 'Names A-Z';
  sort.listeners.change();
  assert.equal(loaded.elements['#contributors'].children.length, 3, 'Sorting should preserve the country filter');
  assert.deepEqual(loaded.elements['#contributors'].children.map(card => card.dataset.id.toLowerCase()), ['asif-hash786', 'gopikrishnamahalingam', 'udayakrishnanm']);
  role.value = 'first-contribution';
  role.listeners.change();
  assert.equal(loaded.elements['#contributors'].children.length, 2, 'Role filtering should compose with country and sort');
  search.value = 'gopi';
  search.listeners.keyup({ target: search });
  assert.equal(loaded.elements['#contributors'].children.length, 1, 'Search should narrow combined filters');
  await loaded.elements['#retry-loading'].listeners.click();
  await new Promise(setImmediate);
  assert.equal(loaded.elements['#contributors'].children.length, 1, 'Reload should preserve active filters and search');
  assert.equal(country.value, 'india');
  assert.equal(role.value, 'first-contribution');
  assert.equal(sort.value, 'Names A-Z');
  assert.equal(search.value, 'gopi');

  const hashPage = await load(data);
  const hashSearch = hashPage.elements['#contributors-title'].inserted;
  const hashSort = hashSearch.inserted;
  const hashRole = hashSort.inserted;
  const hashCountry = hashRole.inserted;
  const hashChanged = () => hashPage.windowListeners.hashchange.forEach(handler => handler());
  hashCountry.value = 'mexico';
  hashCountry.listeners.change();
  hashRole.value = 'builder';
  hashRole.listeners.change();
  hashSearch.value = 'Jolly';
  hashSearch.listeners.keyup({ target: hashSearch });
  hashSort.value = 'Names Z-A';
  hashSort.listeners.change();
  hashPage.window.location.hash = '#JollyJolli';
  hashChanged();
  assert.equal(hashPage.elements['#contributors'].children[0].dataset.id, 'JollyJolli', 'A rendered hash target should remain visible');
  assert.equal(hashCountry.value, 'mexico');
  assert.equal(hashRole.value, 'builder');
  assert.equal(hashSearch.value, 'Jolly');

  for (const [reason, configure] of [
    ['search', () => { hashSearch.value = 'Asif'; hashSearch.listeners.keyup({ target: hashSearch }); }],
    ['role', () => { hashRole.value = 'first-contribution'; hashRole.listeners.change(); }],
    ['country', () => { hashCountry.value = 'india'; hashCountry.listeners.change(); }]
  ]) {
    hashPage.window.location.hash = '';
    hashChanged();
    configure();
    assert(!hashPage.elements['#contributors'].children.some(card => card.dataset.id === 'JollyJolli'), `${reason} should hide the contributor before navigation`);
    hashPage.window.location.hash = '#JollyJolli';
    hashChanged();
    assert(hashPage.elements['#contributors'].children.some(card => card.dataset.id === 'JollyJolli'), `A valid hash should reveal a contributor hidden by ${reason}`);
    assert.equal(hashCountry.value, 'all', `${reason} recovery should reset country`);
    assert.equal(hashRole.value, 'all', `${reason} recovery should reset role`);
    assert.equal(hashSearch.value, '', `${reason} recovery should clear search`);
    assert.equal(hashSort.value, 'Names Z-A', `${reason} recovery should preserve sorting`);
  }

  hashPage.window.location.hash = '';
  hashCountry.value = 'india';
  hashCountry.listeners.change();
  hashRole.value = 'first-contribution';
  hashRole.listeners.change();
  hashSearch.value = 'Asif';
  hashSearch.listeners.keyup({ target: hashSearch });
  for (const invalidHash of ['#unknown-user', '#bad%ZZ', '']) {
    const previous = [hashSearch.value, hashRole.value, hashCountry.value];
    hashPage.window.location.hash = invalidHash;
    hashChanged();
    assert.deepEqual([hashSearch.value, hashRole.value, hashCountry.value], previous, `Invalid or absent hash ${invalidHash} must not alter filters`);
  }
  loaded.elements['#theme-toggle'].listeners.click();
  assert.equal(loaded.root.dataset.theme, 'dark');
  loaded.elements['#theme-toggle'].listeners.click();
  assert.equal(loaded.root.dataset.theme, 'light');
  const profile = { github: 'example', name: 'Example', message: 'Hello', links: { github: 'https://github.com/example' } };
  const fixture = [
    { ...profile, country: 'India', role: 'first-contribution' },
    { ...profile, country: 'India', role: 'first-contribution' },
    { ...profile, country: 'Mexico/Brasil', role: 'builder' },
    { ...profile, country: 'India', role: 'contributor' }
  ];
  assert.equal((await load(fixture)).statistics.textContent, '4 contributors · 3 countries · 2 first contributions · 1 contributor-role profile · 1 builder');
  const expanded = await load([...fixture, { ...profile, role: 'builder' }]);
  assert.equal(expanded.statistics.textContent, '5 contributors · 3 countries · 2 first contributions · 1 contributor-role profile · 2 builders');
  const variants = [undefined, null, '', '  ', ' India ', 'INDIA', 'New   Zealand', 'new zealand', ' Mexico / Brasil / '];
  const mixed = await load(variants.map(country => ({ ...profile, country, role: 'builder' })));
  assert.equal(mixed.statistics.textContent, '9 contributors · 4 countries · 0 first contributions · 0 contributor-role profiles · 9 builders');
  // Mexico/Brasil is deliberately two represented countries, not a third country name.
  const single = await load([{ ...profile, country: 'Mexico/Brasil', role: 'contributor' }]);
  assert.equal(single.statistics.textContent, '1 contributor · 2 countries · 0 first contributions · 1 contributor-role profile · 0 builders');
  assert.equal((await load([fixture[0]])).statistics.textContent, '1 contributor · 1 country · 1 first contribution · 0 contributor-role profiles · 0 builders');
  const empty = await load([]);
  assert.equal(empty.statistics.textContent, '0 contributors · 0 countries · 0 first contributions · 0 contributor-role profiles · 0 builders');
  const failed = await load(data, true);
  assert.equal(failed.statistics.hidden, true, 'Failed loads must not display misleading zero totals');
  assert.equal(failed.elements['#status'].textContent, 'Could not load contributors.');
  const failedProfile = await load(fixture, 'data/contributors/0.json');
  assert.equal(failedProfile.statistics.hidden, true, 'Partial profile loads must not show complete totals');
  assert.equal(failedProfile.elements['#status'].textContent, 'Loaded 3 of 4 contributors. 1 profile could not be loaded.');
  const filterFixtures = [
    { ...profile, github: 'india-one', country: ' India ', role: 'first-contribution' },
    { ...profile, github: 'india-two', country: 'INDIA', role: 'builder' },
    { ...profile, github: 'split-country', country: 'Mexico / Brasil', role: 'contributor' },
    { ...profile, github: 'no-country', country: null, role: 'builder' },
    { ...profile, github: 'empty-country', country: '  ', role: 'builder' }
  ];
  const normalized = await load(filterFixtures);
  const normalizedSearch = normalized.elements['#contributors-title'].inserted;
  const normalizedSort = normalizedSearch.inserted;
  const normalizedRole = normalizedSort.inserted;
  const normalizedCountry = normalizedRole.inserted;
  assert.deepEqual(normalizedCountry.children.map(option => option.textContent), ['All countries', 'Brasil', 'India', 'Mexico'], 'Country options should trim, normalize, split, and deduplicate country values');
  normalizedCountry.value = 'india';
  normalizedCountry.listeners.change();
  assert.deepEqual(normalized.elements['#contributors'].children.map(card => card.dataset.id), ['india-one', 'india-two']);
  normalizedCountry.value = 'brasil';
  normalizedCountry.listeners.change();
  assert.deepEqual(normalized.elements['#contributors'].children.map(card => card.dataset.id), ['split-country']);
  console.log('PASS: contributor stats, filters, hash recovery, search, sorting, random selection, empty/retry states, and theme handlers.');
}
checkStatistics().catch(error => { console.error(error); process.exitCode = 1; });
