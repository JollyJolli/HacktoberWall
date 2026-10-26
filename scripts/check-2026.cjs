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
  // Run the page script with a minimal DOM, including its real loading and search handlers.
  class Element {
    constructor() {
      this.children = []; this.listeners = {}; this.textContent = ''; this.hidden = false;
      this.classNames = new Set();
      this.classList = {
        add: name => this.classNames.add(name),
        remove: name => this.classNames.delete(name),
        contains: name => this.classNames.has(name)
      };
      this.dataset = {}; this.attributes = {};
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    set innerHTML(value) { assert.equal(value, ''); this.children = []; }
    get innerHTML() { return this.children.length ? 'content' : ''; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    insertAdjacentElement(position, element) { this.inserted = element; }
    scrollIntoView(options) { this.scrollOptions = options; }
  }
  async function load(data, fail = false, hash = '') {
    const elements = Object.fromEntries(['contributors', 'status', 'contributors-title', 'contributor-stats', 'theme-toggle'].map(id => [`#${id}`, new Element()]));
    elements['#contributor-stats'].hidden = true;
    const root = new Element();
    const requests = [];
    const timers = [];
    const windowListeners = {};
    const window = {
      location: { hash },
      addEventListener: (name, handler) => { windowListeners[name] = handler; },
      matchMedia: () => ({ matches: false })
    };
    vm.runInNewContext(script, {
      document: {
        querySelector: selector => elements[selector],
        getElementById: id => elements['#contributors'].children.find(child => child.id === id) || null,
        createElement: () => new Element(), documentElement: root
      },
      localStorage: { setItem() {} },
      window,
      setTimeout(callback) { timers.push(callback); return timers.length; },
      fetch: async url => {
        requests.push(url);
        if (fail === true || fail === url) throw new Error('Load failed');
        return { json: async () => url.endsWith('/index.json') ? data.map((_, i) => String(i)) : data[Number(url.match(/(\d+)\.json$/)[1])] };
      }
    });
    await new Promise(setImmediate);
    return { elements, root, requests, statistics: elements['#contributor-stats'], window, windowListeners, timers };
  }
  const data = names.map(name => JSON.parse(fs.readFileSync(path.join(contributorsDir, `${name}.json`), 'utf8')));
  const loaded = await load(data);
  assert(loaded.statistics.textContent.startsWith(`${data.length} contributor`), 'Totals must follow the current contributor index');
  assert.equal(loaded.statistics.hidden, false);
  assert.equal(loaded.elements['#contributors'].children.length, data.length);
  const jolly = loaded.elements['#contributors'].children.find(card => card.id === 'contributor-jollyjolli');
  assert(jolly, 'Contributor cards should have stable IDs derived from usernames');
  const links = jolly.children.find(child => child.className === 'links');
  const shareLink = links.children.find(child => child.textContent === 'Share profile');
  assert.equal(shareLink.href, '#JollyJolli', 'Each card should expose a copyable, openable contributor URL');
  assert.equal(shareLink.attributes['aria-label'], "Share JollyJolli's profile");
  assert.equal(loaded.requests.length, data.length + 1, 'Statistics must not make extra requests');
  const summary = loaded.statistics.textContent;
  for (const value of ['NO SUCH CONTRIBUTOR', data[0].github.toUpperCase(), '']) {
    const input = loaded.elements['#contributors-title'].inserted;
    input.value = value;
    input.listeners.keyup({ target: input });
    assert.equal(loaded.statistics.textContent, summary, 'Search must not change the full-Wall totals');
    if (value === 'NO SUCH CONTRIBUTOR') assert.equal(loaded.elements['#contributors'].children[0], 'No contributors found.');
    else if (value) assert.equal(loaded.elements['#contributors'].children[0].className, 'card', 'Username search should still match regardless of case');
  }
  assert.equal(loaded.elements['#contributors'].children.length, data.length, 'Clearing search restores cards');
  const navigated = await load(data, false, '#JollyJolli');
  const navigatedCard = navigated.elements['#contributors'].children.find(card => card.id === 'contributor-jollyjolli');
  assert.equal(navigatedCard.scrollOptions.block, 'center');
  assert.equal(navigatedCard.scrollOptions.behavior, 'smooth', 'A valid initial hash should scroll to its card');
  assert(navigatedCard.classList.contains('glowingEffect'), 'A valid initial hash should briefly highlight its card');
  navigated.timers[0]();
  assert(!navigatedCard.classList.contains('glowingEffect'), 'The temporary highlight should clear after its timeout');
  const hashSearch = navigated.elements['#contributors-title'].inserted;
  hashSearch.value = 'Jolly';
  hashSearch.listeners.keyup({ target: hashSearch });
  assert.equal(navigated.elements['#contributors'].children.length, 1, 'Search should still filter cards when a share hash is present');
  assert.equal(navigated.elements['#contributors'].children[0].id, 'contributor-jollyjolli');
  const hashSort = hashSearch.inserted;
  hashSort.value = 'Names Z-A';
  hashSort.listeners.change();
  assert.equal(navigated.elements['#contributors'].children[0].id, 'contributor-jollyjolli', 'Sorting should preserve the filtered share target');
  assert(navigated.elements['#contributors'].children[0].scrollOptions, 'The share target should remain navigable after re-rendering');
  const missingHash = await load(data, false, '#not-a-contributor');
  assert(missingHash.elements['#contributors'].children.every(card => !card.scrollOptions), 'Unknown valid usernames should be ignored');
  const invalidHash = await load(data, false, '#bad%21user');
  assert.equal(invalidHash.elements['#contributors'].children.every(card => !card.scrollOptions), true, 'Invalid usernames should be ignored safely');
  const malformedHash = await load(data, false, '#bad%ZZ');
  assert.equal(malformedHash.elements['#contributors'].children.every(card => !card.scrollOptions), true, 'Malformed encoded hashes should not throw');
  assert(loaded.elements['#contributors'].children.every(card => !card.scrollOptions), 'An absent hash should leave normal page behavior unchanged');
  const changedHash = await load(data);
  changedHash.window.location.hash = '#jollyjolli';
  changedHash.windowListeners.hashchange();
  assert(changedHash.elements['#contributors'].children.find(card => card.id === 'contributor-jollyjolli').scrollOptions, 'Hash changes should navigate to the contributor');
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
  console.log('PASS: loaded-profile statistics, optional countries, roles, empty/error states, search, share URLs, hash navigation, and theme handlers.');
}
checkStatistics().catch(error => { console.error(error); process.exitCode = 1; });
