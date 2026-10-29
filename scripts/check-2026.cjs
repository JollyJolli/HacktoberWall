const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');

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
const credits = read('ASSET-CREDITS.md');

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
for (const [key, value] of Object.entries({ description, 'twitter:card': 'summary_large_image', 'twitter:title': title,
  'twitter:description': description, 'twitter:image': imageUrl, 'twitter:image:alt': imageAlt })) {
  metadata(new RegExp(`<meta name="${key}" content="([^"]+)"`, 'g'), value);
}
for (const [key, value] of Object.entries({ type: 'website', site_name: 'HacktoberWall', title, description, url: pageUrl,
  image: imageUrl, 'image:width': '1200', 'image:height': '630', 'image:alt': imageAlt })) {
  metadata(new RegExp(`<meta property="og:${key}" content="([^"]+)"`, 'g'), value);
}
for (const asset of [imageUrl, new URL('../assets/favicon.svg', pageUrl).href]) {
  const url = new URL(asset);
  assert.equal(url.origin, new URL(pageUrl).origin);
  assert(fs.existsSync(path.join(root, url.pathname)), `Missing repository-owned asset: ${asset}`);
}
const socialImage = fs.readFileSync(path.join(root, 'assets/social.png'));
assert.equal(socialImage.readUInt32BE(16), 1200);
assert.equal(socialImage.readUInt32BE(20), 630);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert(script.includes('data/contributors/index.json'));
for (const field of ['profile.country', 'profile.bio', 'profile.learned', 'profile.links']) assert(script.includes(field), `Renderer must map ${field}`);
assert.match(html, /<form class="controls"[^>]*role="search"/);
assert.match(html, /<div class="filter-toolbar">\s*<form class="controls" id="filters" role="search">[\s\S]*<button class="filter-toggle" id="filter-toggle" type="button" aria-controls="filter-fields" aria-expanded="false"[\s\S]*<div class="filter-group" id="filter-fields">[\s\S]*id="search"[\s\S]*id="sort"[\s\S]*id="role"[\s\S]*id="country"[\s\S]*<\/form>\s*<div class="random-action">\s*<button class="random" id="random" type="button">Random Soul<\/button>\s*<\/div>\s*<\/div>/, 'Filters and the independent Random Soul action must share one visual toolbar panel');
assert.match(html, /id="filter-count"[^>]*hidden/, 'Active-filter count starts hidden');
assert.match(styles, /@media \(max-width: 430px\)[\s\S]*\.controls\.filters-open \.filter-group/s, 'Only mobile widths receive the collapsible filter region');
assert.match(html, /id="contributor-stats" class="wall-summary visually-hidden"/,
  'Contributor totals should remain available without changing the approved I15 composition');
assert.doesNotMatch(html, /id="contributor-stats"[^>]*aria-label=/,
  'Avoid a prohibited accessible-name attribute on the paragraph element');
for (const [id, label] of [['search', 'Search the wall'], ['sort', 'Sort'], ['role', 'Role'], ['country', 'Country']]) {
  assert.match(html, new RegExp(`<label for="${id}">${label}</label>`), `${id} must have a visible label`);
}
assert.match(styles, /select\.control\s*\{[^}]*padding-left:\s*16px/s, 'I16 select text inset must remain 16px');
assert.match(styles, /\.select-wrap::after\s*\{[^}]*right:\s*18\.5px/s, 'I16 arrow inset must remain aligned');
assert.match(styles, /\.top\s*\{\s*margin:\s*0 auto;?\s*\}/, 'Header geometry must not shift with loading wall height');
assert.match(styles, /\.theme-toggle\s*\{[^}]*height:\s*44px[^}]*\}/s, 'Theme toggle hit box must remain at least 44px high');
assert.match(styles, /\.share-link\s*\{[^}]*height:\s*44px[^}]*\}/s, 'Share hit box must remain at least 44px high');
assert.match(styles, /\.detail\s*\{[^}]*height:\s*44px[^}]*\}/s, 'Details hit box must remain at least 44px high');
assert.match(styles, /\.stone h3\s*\{[^}]*-webkit-line-clamp:\s*2/s, 'Long names must retain two visible lines inside the stone');
assert.match(styles, /\.stone \.handle\s*\{[^}]*-webkit-line-clamp:\s*3[^}]*overflow-wrap:\s*anywhere/s, 'Long handles must wrap safely across up to three visible lines');
assert.match(styles, /\.stone \.meta\s*\{[^}]*-webkit-line-clamp:\s*1/s, 'Metadata must remain contained in the stone');
assert.match(styles, /\.stone \.inscription\s*\{[^}]*-webkit-line-clamp:\s*2/s, 'Long card messages must remain contained in the stone');
assert.match(styles, /\.stone\s*\{[^}]*height:\s*326px[^}]*min-height:\s*0/s, 'Desktop gravestones must keep their fixed approved height');
assert.match(styles, /@media\(max-width:690px\)\s*\{\s*\.stone\s*\{\s*height:\s*280px/s, 'Tablet and mobile gravestones must keep their fixed approved height');
assert.match(styles, /@media\(max-width:390px\)\s*\{\s*\.stone\s*\{\s*height:\s*274px/s, 'Narrow mobile gravestones must keep their fixed approved height');
assert.match(styles, /\.stone-actions\s*\{[^}]*gap:\s*8px/s, 'Stone actions must keep a stable visible gap');
assert.match(script, /function fitStoneInscription\s*\(/, 'Inscription lines must adapt to remaining stone space');
assert.match(styles, /\.avatar-image\.is-loaded\s*\{[^}]*visibility:\s*visible/s, 'Loaded remote avatars must become visible');
assert.match(styles, /\.avatar-fallback:not\(\[hidden\]\)\s*\{[^}]*position:\s*absolute/s, 'Initials must fill the avatar while its remote image is pending or failed');
assert.match(script, /avatar\.addEventListener\('load'/, 'Successful avatar requests must replace the initials fallback');
assert.match(styles, /\.light \.scene\s*\{[^}]*chambers-mount-auburn\.webp/s);
assert.match(styles, /prefers-reduced-motion\s*:\s*reduce/);
assert(credits.includes('GreyFrogGames') && credits.includes('Halloween Pumpkin') && credits.includes('CC0') &&
  credits.includes('https://opengameart.org/content/halloween-pumpkin-1'),
  'Pumpkin assets must retain the verified GreyFrogGames CC0 source credit');
assert.match(html, /<div class="dialog-header">\s*<h2 id="contributor-dialog-title"[^>]*>/,
  'Contributor name and Close button must use the non-overlapping dialog header');
assert.match(script, /dialogTitle\.textContent\s*=\s*profile\.name;/, 'Dialog title should contain only the contributor name');
assert.match(styles, /dialog#contributor-dialog #contributor-dialog-title:focus\{outline:none/s,
  'The programmatically focused dialog heading should not draw a focus outline');
assert(credits.includes('LumioLab') && credits.includes('CC BY 4.0') && credits.includes('https://lumiolab.itch.io'));
const visualAssets = ['bat.png', 'chambers-mount-auburn.webp', 'cornerweb_bl.png', 'cornerweb_tl.png', 'ghost.png',
  'gravestone_round.png', 'halloween-background.webp', 'plat_spider_spritesheet.png', 'pumpkin_dark_eyes.png', 'pumpkin_yellow_eyes.png'];
for (const asset of visualAssets) assert(fs.existsSync(path.join(edition, 'assets', asset)), `Missing approved art: ${asset}`);
for (const asset of ['halloween-background.webp', 'chambers-mount-auburn.webp']) {
  const image = fs.readFileSync(path.join(edition, 'assets', asset));
  assert.equal(image.toString('ascii', 0, 4), 'RIFF', `${asset} must be a WebP RIFF file`);
  assert.equal(image.toString('ascii', 8, 12), 'WEBP', `${asset} must have a WebP signature`);
}
assert(!fs.existsSync(path.join(edition, 'assets', 'avatars')), 'Preview-only avatars must not enter production');
assert(Array.isArray(names));
assert(!names.includes('your-github-username'));
assert.equal(names.length, contributorFiles.length);
assert(names.includes('jollyjolli'));
for (const name of names) {
  assert.match(name, /^[a-z0-9-]+$/);
  const profile = JSON.parse(fs.readFileSync(path.join(contributorsDir, `${name}.json`), 'utf8'));
  assert.equal(profile.github.toLowerCase(), name);
  assert(profile.github && profile.name && profile.role && profile.message);
  assert(['first-contribution', 'contributor', 'builder'].includes(profile.role));
  assert.equal(profile.links.github, `https://github.com/${profile.github}`);
}
for (const file of ['assets/2026.js']) execFileSync(process.execPath, ['--check', path.join(edition, file)]);
assert.equal(execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', '2024/'], { cwd: root, encoding: 'utf8' }).trim(), '', 'Protected 2024 edition changed');
console.log('PASS: 2026 metadata, approved assets/credits, visible controls, select insets, source data, JavaScript syntax, and 2024 integrity.');

class Element {
  constructor(tagName = 'div') {
    this.tagName = tagName; this.children = []; this.listeners = {}; this.textContent = ''; this.hidden = false;
    this.className = ''; this.classNames = new Set(); this.dataset = {}; this.attributes = {}; this.value = '';
    this.classList = {
      add: name => { this.classNames.add(name); this.syncClassName(); },
      remove: name => { this.classNames.delete(name); this.syncClassName(); },
      contains: name => this.classNames.has(name),
      toggle: (name, force) => {
        const active = force === undefined ? !this.classNames.has(name) : Boolean(force);
        if (active) this.classNames.add(name); else this.classNames.delete(name);
        this.syncClassName(); return active;
      }
    };
  }
  syncClassName() { this.className = [...this.classNames].join(' '); }
  append(...children) {
    for (const child of children) { child.isConnected = true; child.parent = this; this.children.push(child); }
    if (this.tagName === 'select' && this.children.length && !this.children.some(child => child.value === this.value)) this.value = this.children[0].value;
  }
  replaceChildren(...children) {
    for (const child of this.children) child.isConnected = false;
    this.children = [];
    this.append(...children);
    if (this.tagName === 'select' && !this.children.some(child => child.value === this.value)) this.value = this.children[0]?.value || '';
  }
  set innerHTML(value) { assert.equal(value, ''); this.replaceChildren(); }
  get innerHTML() { return this.children.length ? 'content' : ''; }
  setAttribute(name, value) { this.attributes[name] = value; this[name] = value; }
  addEventListener(name, handler) { (this.listeners[name] ||= []).push(handler); }
  dispatch(name, event = {}) { for (const handler of this.listeners[name] || []) handler(event); }
  scrollIntoView(options) { this.scrollOptions = options; }
  focus() { this.owner.activeElement = this; }
  querySelector(selector) {
    for (const child of this.children) {
      if (selector.startsWith('.') && child.className.split(/\s+/).includes(selector.slice(1))) return child;
      const nested = child.querySelector?.(selector);
      if (nested) return nested;
    }
    return null;
  }
  showModal() { this.open = true; }
  close() { this.open = false; this.dispatch('close'); }
}

async function runInteractionChecks() {
  const data = names.map(name => JSON.parse(fs.readFileSync(path.join(contributorsDir, `${name}.json`), 'utf8')));
  async function load(profiles = data, failure = null, mobile = true, initialHash = '', prefersReducedMotion = true) {
    const owner = { activeElement: null };
    const ids = ['contributors', 'status', 'search', 'sort', 'role', 'country', 'random', 'random-status', 'empty', 'filters', 'filter-toggle', 'filter-count', 'filter-fields',
      'contributor-dialog', 'contributor-dialog-title', 'contributor-dialog-content', 'contributor-dialog-close', 'contributor-stats', 'theme-toggle', 'retry-loading'];
    const elements = Object.fromEntries(ids.map(id => [`#${id}`, new Element()]));
    for (const element of Object.values(elements)) element.owner = owner;
    elements['#sort'].value = 'Default'; elements['#role'].value = 'all'; elements['#country'].value = 'all';
    for (const [value, text] of [['all', 'All roles'], ['first-contribution', 'First contribution'], ['contributor', 'Contributor'], ['builder', 'Builder']]) {
      const option = new Element('option'); option.value = value; option.textContent = text; elements['#role'].append(option);
    }
    elements['#sort'].append(Object.assign(new Element('option'), { value: 'Default', textContent: 'Default' }));
    elements['#empty'].hidden = true; elements['#retry-loading'].hidden = true; elements['#filter-count'].hidden = true;
    const rootElement = new Element(); rootElement.owner = owner; rootElement.dataset = { theme: 'light' };
    const requests = []; const timers = []; const windowListeners = {}; const documentListeners = {}; const stored = {};
    const window = {
      location: { hash: initialHash },
      addEventListener: (name, handler) => { (windowListeners[name] ||= []).push(handler); },
      matchMedia: query => ({ matches: query === '(max-width: 430px)' ? mobile : query === '(prefers-reduced-motion: reduce)' && prefersReducedMotion, addEventListener() {}, addListener() {} }),
      setTimeout: callback => { timers.push(callback); }
    };
    const document = {
      activeElement: null,
      addEventListener: (name, handler) => { (documentListeners[name] ||= []).push(handler); },
      querySelector: selector => elements[selector],
      createElement: tagName => { const element = new Element(tagName); element.owner = owner; return element; },
      documentElement: rootElement
    };
    Object.defineProperty(document, 'activeElement', { get: () => owner.activeElement });
    vm.runInNewContext(script, {
      document, URL, window, localStorage: { setItem: (key, value) => { stored[key] = value; } },
      fetch: async url => {
        requests.push(url);
        if (failure === true || failure === url) throw new Error('Load failed');
        if (url.endsWith('/index.json')) return { ok: true, json: async () => profiles.map(profile => profile.github) };
        const username = path.basename(url, '.json');
        if (failure === username) return { ok: false, json: async () => { throw new Error('failed response must not be parsed'); } };
        const profile = profiles.find(item => item.github.toLowerCase() === username.toLowerCase());
        return { ok: Boolean(profile), json: async () => profile };
      }
    });
    await new Promise(setImmediate);
    return { elements, rootElement, owner, window, windowListeners, documentListeners, timers, requests, stored, data: profiles };
  }

  const page = await load();
  const el = page.elements;
  page.documentListeners.pointerdown[0]();
  assert.equal(page.rootElement.dataset.inputModality, 'pointer', 'Pointer interaction should suppress select focus outlines');
  page.documentListeners.keydown[0]({ key: 'Shift' });
  assert.equal(page.rootElement.dataset.inputModality, 'pointer', 'Modifier keys should not reset input modality');
  page.documentListeners.keydown[0]({ key: 'ArrowDown' });
  assert.equal(page.rootElement.dataset.inputModality, undefined, 'Keyboard navigation should restore select focus outlines');
  assert.equal(el['#filter-toggle'].attributes['aria-expanded'], 'false', 'Mobile filters start collapsed');
  assert.equal(el['#filter-toggle'].hidden, false, 'Mobile disclosure is available');
  el['#filter-toggle'].dispatch('click');
  assert.equal(el['#filter-toggle'].attributes['aria-expanded'], 'true');
  assert(el['#filters'].classList.contains('filters-open'));
  el['#search'].value = 'Asif'; el['#role'].value = 'first-contribution';
  el['#filter-toggle'].dispatch('click');
  assert.equal(el['#filter-toggle'].attributes['aria-expanded'], 'false');
  assert.equal(el['#search'].value, 'Asif', 'Collapsing preserves search');
  assert.equal(el['#role'].value, 'first-contribution', 'Collapsing preserves role');
  el['#search'].value = ''; el['#role'].value = 'all';
  const desktopPage = await load(data, null, false);
  assert.equal(desktopPage.elements['#filter-toggle'].hidden, true, 'Desktop has no collapse control');
  assert.equal(desktopPage.elements['#filter-toggle'].attributes['aria-expanded'], 'true', 'Desktop filters stay expanded');
  assert(desktopPage.elements['#filters'].classList.contains('filters-open'));
  assert.equal(el['#contributors'].children.length, data.length);
  assert.equal(el['#contributors'].attributes['aria-busy'], 'false');
  assert.equal(el['#contributor-stats'].hidden, false);
  assert.match(el['#contributor-stats'].textContent, new RegExp(`^${data.length} contributors`));
  assert.deepEqual(el['#country'].children.map(item => item.textContent), ['All countries', 'Brasil', 'India', 'Mexico']);
  assert.deepEqual(el['#role'].children.map(item => item.textContent), ['All roles', 'First contribution', 'Contributor', 'Builder']);
  assert(el['#contributors'].children.every(card => card.className === 'stone'));
  assert(el['#contributors'].classList.contains('compact-wall'), 'Fewer than seven profiles should use the compact wall composition');
  assert(el['#contributors'].children.some(card => card.querySelector('.share-link')));

  const loadedAvatar = el['#contributors'].children[0].querySelector('.avatar-image');
  const loadedFallback = el['#contributors'].children[0].querySelector('.avatar-fallback');
  assert.equal(loadedFallback.hidden, false, 'Contributor initials should show while a remote avatar is pending');
  assert.equal(loadedAvatar.attributes['aria-hidden'], 'true', 'A pending image stays out of the accessibility tree');
  loadedAvatar.dispatch('load');
  assert.equal(loadedFallback.hidden, true, 'Successful image load should replace the initials');
  assert.equal(loadedAvatar.attributes['aria-hidden'], 'false', 'Loaded image exposes its alternative text');

  const failedAvatar = el['#contributors'].children[1].querySelector('.avatar-image');
  const failedFallback = el['#contributors'].children[1].querySelector('.avatar-fallback');
  failedAvatar.dispatch('error');
  assert.equal(failedAvatar.hidden, true, 'A failed remote image should be hidden');
  assert.equal(failedFallback.hidden, false, 'Initials should remain visible after an image failure');

  const longDirectory = await load(Array.from({ length: 11 }, (_, index) => {
    const source = data[index % data.length];
    const github = `${source.github}-fixture${index + 1}`;
    return { ...source, github, name: `${source.name} Fixture ${index + 1}`, links: { ...source.links, github: `https://github.com/${github}` } };
  }));
  assert.equal(longDirectory.elements['#contributors'].children.length, 11);
  assert(longDirectory.elements['#contributors'].classList.contains('wide-wall'), 'Seven or more profiles should use the wide wall composition');
  assert(!longDirectory.elements['#contributors'].classList.contains('compact-wall'));

  el['#search'].value = 'COMMUNITY-FIRST'; el['#search'].dispatch('input');
  assert(el['#contributors'].children.length > 0, 'Search should include learned items and ignore case');
  el['#search'].value = 'No such contributor'; el['#search'].dispatch('input');
  assert.equal(el['#empty'].hidden, false, 'No results should show the recovery prompt');
  assert.equal(el['#contributors'].children.length, 0);
  el['#search'].value = ''; el['#search'].dispatch('input');
  assert.equal(el['#contributors'].children.length, data.length);

  el['#country'].value = 'mexico'; el['#country'].dispatch('change');
  assert.deepEqual(el['#contributors'].children.map(card => card.dataset.id.toLowerCase()), ['jollyjolli']);
  el['#role'].value = 'builder'; el['#role'].dispatch('change');
  el['#search'].value = 'Back for the 2026 edition'; el['#search'].dispatch('input');
  assert.equal(el['#contributors'].children.length, 1, 'Search, role, and country filters should compose');
  assert.equal(el['#filter-count'].textContent, '3', 'Search, role, and country are counted as active filters');
  assert.equal(el['#filter-count'].hidden, false);
  assert.equal(el['#filter-toggle'].attributes['aria-label'], 'Filters, 3 active filters');
  el['#sort'].value = 'Names Z-A'; el['#sort'].dispatch('change');
  el['#random'].dispatch('click');
  const randomTarget = el['#contributors'].children[0];
  assert.equal(randomTarget.scrollOptions.behavior, 'auto');
  assert(randomTarget.classList.contains('spotlight'));
  assert.equal(page.owner.activeElement, randomTarget.querySelector('.detail'));
  assert.match(el['#random-status'].textContent, /Selected JollyJolli/);
  page.timers.at(-1)();
  assert(!randomTarget.classList.contains('spotlight'));

  el['#search'].value = ''; el['#role'].value = 'all'; el['#country'].value = 'all'; el['#sort'].value = 'Country';
  el['#sort'].dispatch('change');
  assert.equal(el['#contributors'].children.length, data.length);
  assert.equal(el['#sort'].dataset.active, 'true');
  assert.equal(el['#role'].dataset.active, 'false');
  assert.equal(el['#country'].dataset.active, 'false');
  assert.equal(el['#filter-count'].hidden, true, 'Count hides after active filters clear');
  assert.equal(el['#filter-toggle'].attributes['aria-label'], 'Filters');

  const share = el['#contributors'].children.find(card => card.dataset.id === 'JollyJolli').querySelector('.share-link');
  assert.equal(share.href, '#JollyJolli');
  assert.match(share.attributes['aria-label'], /^Share profile\b/, 'Share link accessible name should include its visible text');
  page.window.location.hash = '#JollyJolli';
  el['#country'].value = 'india'; el['#country'].dispatch('change');
  page.windowListeners.hashchange.forEach(handler => handler());
  assert.equal(el['#country'].value, 'all', 'Share hashes should reveal profiles hidden by filters');
  assert(el['#contributors'].children.some(card => card.id === 'contributor-jollyjolli'));
  assert(el['#contributors'].children.find(card => card.id === 'contributor-jollyjolli').scrollOptions);

  const initialHashPage = await load(data, null, true, '#JollyJolli', false);
  const initialHashCard = initialHashPage.elements['#contributors'].children.find(card => card.id === 'contributor-jollyjolli');
  assert(initialHashCard, 'A direct profile URL should render its contributor');
  assert.equal(initialHashCard.scrollOptions.block, 'center');
  assert.equal(initialHashCard.scrollOptions.behavior, 'smooth');
  assert(initialHashCard.classList.contains('spotlight'), 'A direct profile URL should highlight its contributor');
  initialHashPage.timers[0]();
  assert(!initialHashCard.classList.contains('spotlight'), 'The direct-link highlight should clear after its timer');

  const changedHashPage = await load();
  changedHashPage.window.location.hash = '#jollyjolli';
  changedHashPage.windowListeners.hashchange.forEach(handler => handler());
  const changedHashCard = changedHashPage.elements['#contributors'].children.find(card => card.id === 'contributor-jollyjolli');
  assert(changedHashCard.scrollOptions, 'Changing the profile hash should navigate to its contributor');
  assert(changedHashCard.classList.contains('spotlight'), 'Changing the profile hash should highlight its contributor');

  const invalidHashPage = await load();
  const invalidHashElements = invalidHashPage.elements;
  invalidHashElements['#search'].value = 'Asif'; invalidHashElements['#search'].dispatch('input');
  invalidHashElements['#role'].value = 'first-contribution'; invalidHashElements['#role'].dispatch('change');
  invalidHashElements['#country'].value = 'india'; invalidHashElements['#country'].dispatch('change');
  for (const invalidHash of ['#unknown-user', '#bad%ZZ', '']) {
    invalidHashPage.window.location.hash = invalidHash;
    invalidHashPage.windowListeners.hashchange.forEach(handler => handler());
    assert.deepEqual(
      [invalidHashElements['#search'].value, invalidHashElements['#role'].value, invalidHashElements['#country'].value],
      ['Asif', 'first-contribution', 'india'],
      `Invalid or absent hash ${invalidHash} must not alter filters`
    );
  }

  el['#search'].value = 'Asif'; el['#search'].dispatch('input');
  assert.equal(el['#contributors'].children.length, 1);
  el['#search'].value = 'India'; el['#search'].dispatch('input');
  assert(el['#contributors'].children.length > 0, 'Search includes country');
  el['#theme-toggle'].dispatch('click');
  assert.equal(page.rootElement.dataset.theme, 'dark');
  assert.equal(page.rootElement.classList.contains('light'), false);
  assert.equal(page.stored.theme, 'dark');

  const empty = await load([]);
  assert.equal(empty.elements['#status'].textContent, 'No contributors yet.');
  assert.equal(empty.elements['#retry-loading'].hidden, true);
  assert.equal(empty.elements['#contributors'].children.length, 0);
  const failed = await load(data, true);
  assert.equal(failed.elements['#status'].textContent, 'Could not load contributors.');
  assert.equal(failed.elements['#retry-loading'].hidden, false);
  console.log('PASS: contributor data, search/filter/sort/random, share hashes, theme, responsive wall classes, and empty/error handling.');
}

runInteractionChecks().catch(error => { console.error(error); process.exitCode = 1; });
