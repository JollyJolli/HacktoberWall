const container = document.querySelector('#contributors');
const status = document.querySelector('#status');
const retryButton = document.querySelector('#retry-loading');
const searchBox = document.querySelector('#search');
const sortFilter = document.querySelector('#sort');
const roleFilter = document.querySelector('#role');
const countryFilter = document.querySelector('#country');
const randomButton = document.querySelector('#random');
const randomStatus = document.querySelector('#random-status');
const emptyMessage = document.querySelector('#empty');
const filtersForm = document.querySelector('#filters');
const filterToggle = document.querySelector('#filter-toggle');
const filterCount = document.querySelector('#filter-count');
const mobileFilterMedia = window.matchMedia('(max-width: 430px)');
let filtersExpandedOnMobile = false;
const statistics = document.querySelector('#contributor-stats');

document.addEventListener('pointerdown', () => {
  document.documentElement.dataset.inputModality = 'pointer';
}, true);
document.addEventListener('keydown', event => {
  if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
    delete document.documentElement.dataset.inputModality;
  }
}, true);

let profiles = [];
let chosenProfiles = [];
const loadedProfiles = new Map();

const roleLabels = {
  'first-contribution': 'First contribution',
  contributor: 'Contributor',
  builder: 'Builder'
};

function addText(parent, tag, text, className) {
  if (text == null || text === '') return;
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

function addLink(parent, href, text) {
  if (typeof href !== 'string' || !href) return;
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  link.rel = 'noopener noreferrer';
  parent.append(link);
}

function addSafeDialogLink(parent, href, text) {
  if (typeof href !== 'string') return;
  let url;
  try { url = new URL(href); } catch { return; }
  if (url.protocol !== 'https:') return;
  addLink(parent, url.href, text);
}

function getInitials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part[0]).join('').toUpperCase() || '?';
}

function createAvatar(profile, className = '') {
  const avatarContainer = document.createElement('div');
  avatarContainer.className = `avatar${className ? ` ${className}` : ''}`;
  const avatar = document.createElement('img');
  avatar.className = 'avatar-image';
  avatar.alt = `${profile.name} avatar`;
  avatar.loading = 'lazy';
  avatar.setAttribute('aria-hidden', 'true');
  const fallback = document.createElement('span');
  fallback.className = 'avatar-fallback';
  fallback.textContent = getInitials(profile.name);
  fallback.setAttribute('role', 'img');
  fallback.setAttribute('aria-label', `${profile.name} avatar`);
  avatar.addEventListener('load', () => {
    avatar.classList.add('is-loaded');
    avatar.setAttribute('aria-hidden', 'false');
    fallback.hidden = true;
  }, { once: true });
  avatar.addEventListener('error', () => {
    avatar.hidden = true;
    fallback.hidden = false;
  }, { once: true });
  avatar.src = `https://github.com/${encodeURIComponent(profile.github)}.png?size=128`;
  avatarContainer.append(avatar, fallback);
  return avatarContainer;
}

function contributorCardId(username) {
  const normalized = String(username || '');
  return /^[a-z0-9-]{1,39}$/i.test(normalized) ? `contributor-${normalized.toLowerCase()}` : '';
}

function renderContributor(profile) {
  const card = document.createElement('article');
  card.className = 'stone';
  card.id = contributorCardId(profile.github);
  card.dataset.id = profile.github;
  card.dataset.name = profile.name;
  const content = document.createElement('div');
  content.className = 'stone-content';
  const identity = document.createElement('div');
  identity.className = 'stone-identity';
  identity.append(createAvatar(profile));
  addText(identity, 'h3', profile.name);
  addText(identity, 'p', `@${profile.github}`, 'handle');
  addText(identity, 'p', [roleLabels[profile.role] || profile.role, profile.country].filter(Boolean).join(' · '), 'meta');
  content.append(identity);
  addText(content, 'p', profile.message, 'inscription');
  card.append(content);

  const shareLink = document.createElement('a');
  shareLink.className = 'share-link';
  shareLink.href = `#${encodeURIComponent(profile.github)}`;
  shareLink.textContent = 'Share profile';
  shareLink.setAttribute('aria-label', `Share profile for ${profile.name}`);

  const detailsButton = document.createElement('button');
  detailsButton.className = 'detail';
  detailsButton.type = 'button';
  detailsButton.textContent = 'View details';
  detailsButton.setAttribute('aria-haspopup', 'dialog');
  detailsButton.addEventListener('click', () => openContributorDialog(profile, detailsButton));
  const actions = document.createElement('div');
  actions.className = 'stone-actions';
  actions.append(shareLink, detailsButton);
  card.append(actions);
  return card;
}

function fitStoneInscription(card) {
  if (typeof window.getComputedStyle !== 'function') return;
  const content = card.querySelector('.stone-content');
  const identity = card.querySelector('.stone-identity');
  const inscription = card.querySelector('.inscription');
  if (!content || !identity || !inscription) return;
  const lineHeight = Number.parseFloat(window.getComputedStyle(inscription).lineHeight);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
  const available = content.clientHeight - identity.getBoundingClientRect().height;
  const lines = Math.max(0, Math.min(2, Math.floor((available + 0.5) / lineHeight)));
  inscription.hidden = lines === 0;
  inscription.dataset.visibleLines = String(lines);
  inscription.style.webkitLineClamp = String(lines || 1);
}

function fitStoneInscriptions() {
  if (typeof container.querySelectorAll !== 'function') return;
  for (const card of container.querySelectorAll('.stone')) fitStoneInscription(card);
}

window.addEventListener('resize', fitStoneInscriptions);
if (document.fonts?.ready) document.fonts.ready.then(fitStoneInscriptions);

const contributorDialog = document.querySelector('#contributor-dialog');
const dialogTitle = document.querySelector('#contributor-dialog-title');
const dialogContent = document.querySelector('#contributor-dialog-content');
const dialogClose = document.querySelector('#contributor-dialog-close');
let dialogTrigger = null;

function openContributorDialog(profile, trigger) {
  dialogTrigger = trigger;
  dialogTitle.textContent = profile.name;
  dialogContent.replaceChildren();
  const identity = document.createElement('div');
  identity.className = 'profile-identity';
  identity.append(createAvatar(profile, 'profile-avatar'));
  const identityText = document.createElement('div');
  addText(identityText, 'p', `@${profile.github}`, 'profile-handle');
  addText(identityText, 'p', [roleLabels[profile.role] || profile.role, profile.country].filter(Boolean).join(' · '), 'profile-meta');
  identity.append(identityText);
  dialogContent.append(identity);
  addText(dialogContent, 'p', profile.message, 'profile-message');
  addText(dialogContent, 'p', profile.bio, 'profile-prose');
  if (Array.isArray(profile.learned) && profile.learned.length) {
    const section = document.createElement('section');
    section.className = 'profile-section';
    addText(section, 'h3', 'What I learned');
    const list = document.createElement('ul');
    list.className = 'profile-learned';
    for (const item of profile.learned) addText(list, 'li', item);
    section.append(list);
    dialogContent.append(section);
  }
  const links = document.createElement('ul');
  links.className = 'profile-links';
  for (const [key, label] of [['github', 'GitHub'], ['website', 'Website'], ['linkedin', 'LinkedIn']]) {
    const value = profile.links?.[key];
    if (typeof value !== 'string' || !value) continue;
    let url;
    try { url = new URL(value); } catch { continue; }
    if (url.protocol !== 'https:') continue;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = url.href;
    link.textContent = label;
    link.rel = 'noopener noreferrer';
    item.append(link);
    const visibleUrl = document.createElement('span');
    visibleUrl.className = 'profile-url';
    visibleUrl.textContent = url.href;
    item.append(visibleUrl);
    links.append(item);
  }
  if (links.children.length) {
    const section = document.createElement('section');
    section.className = 'profile-section';
    addText(section, 'h3', 'Links');
    section.append(links);
    dialogContent.append(section);
  }
  contributorDialog.showModal();
  dialogTitle.focus();
}

if (dialogClose && contributorDialog) dialogClose.addEventListener('click', () => contributorDialog.close());
if (contributorDialog) contributorDialog.addEventListener('close', () => {
  const trigger = dialogTrigger;
  dialogTrigger = null;
  if (trigger?.isConnected) trigger.focus();
  else searchBox.focus();
});

function safeName(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function countryParts(profile) {
  if (typeof profile.country !== 'string') return [];
  return profile.country.split('/').map(country => country.trim().replace(/\s+/g, ' ')).filter(Boolean);
}

function renderStatistics() {
  const countries = new Set();
  for (const profile of profiles) {
    for (const country of countryParts(profile)) countries.add(country.toLowerCase());
  }
  const countRole = role => profiles.filter(profile => profile.role === role).length;
  statistics.textContent = [
    [profiles.length, 'contributor'],
    [countries.size, 'country', 'countries'],
    [countRole('first-contribution'), 'first contribution'],
    [countRole('contributor'), 'contributor-role profile'],
    [countRole('builder'), 'builder']
  ].map(([count, singular, plural = `${singular}s`]) => `${count} ${count === 1 ? singular : plural}`).join(' · ');
  statistics.hidden = false;
}

function setLoadingState() {
  status.className = 'results status status-loading';
  status.textContent = 'Loading contributors…';
  container.setAttribute('aria-busy', 'true');
  emptyMessage.hidden = true;
  if (retryButton) {
    retryButton.hidden = true;
    retryButton.disabled = true;
  }
}

function setResultStatus() {
  if (!profiles.length) {
    status.className = 'results status status-empty';
    status.textContent = 'No contributors yet.';
  } else if (!chosenProfiles.length) {
    status.className = 'results status status-empty';
    status.textContent = 'No contributors match';
  } else {
    status.className = 'results status status-success';
    status.textContent = chosenProfiles.length === profiles.length
      ? `${profiles.length} contributors`
      : `${chosenProfiles.length} of ${profiles.length} contributors`;
  }
}

function renderProfiles() {
  profiles = [...loadedProfiles.values()];
  updateCountryOptions();
  renderFilteredProfiles();
  revealFilteredHashTarget();
}

function setFinishedState() {
  container.setAttribute('aria-busy', 'false');
  if (retryButton) retryButton.disabled = false;
}

async function loadContributors() {
  setLoadingState();
  try {
    const response = await fetch('data/contributors/index.json');
    if (response.ok === false) throw new Error('Contributor list request failed');
    const names = await response.json();
    if (!Array.isArray(names)) throw new Error('Contributor list is invalid');
    if (names.length === 0) {
      loadedProfiles.clear();
      renderProfiles();
      status.className = 'results status status-empty';
      status.textContent = 'No contributors yet.';
      renderStatistics();
      return;
    }

    const currentNames = new Set(names.map(safeName));
    for (const name of loadedProfiles.keys()) if (!currentNames.has(name)) loadedProfiles.delete(name);
    const missingNames = names.filter(name => !loadedProfiles.has(safeName(name)));
    const results = await Promise.allSettled(missingNames.map(async name => {
      const safe = safeName(name);
      const response = await fetch(`data/contributors/${safe}.json`);
      if (response.ok === false) throw new Error(`Contributor profile request failed: ${safe}`);
      return [safe, await response.json()];
    }));
    const failedNames = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') loadedProfiles.set(...result.value);
      else failedNames.push(missingNames[i]);
    }

    renderProfiles();
    if (failedNames.length > 0) {
      status.className = `results status ${profiles.length ? 'status-partial' : 'status-error'} error`;
      status.textContent = profiles.length
        ? `Loaded ${profiles.length} of ${names.length} contributors. ${failedNames.length} profile${failedNames.length === 1 ? '' : 's'} could not be loaded.`
        : 'Could not load contributors.';
      if (retryButton) retryButton.hidden = false;
      statistics.hidden = true;
    } else {
      setResultStatus();
      renderStatistics();
    }
  } catch {
    status.className = 'results status status-error error';
    status.textContent = profiles.length
      ? `Could not refresh contributors. ${profiles.length} loaded profile${profiles.length === 1 ? '' : 's'} remain visible.`
      : 'Could not load contributors.';
    if (retryButton) retryButton.hidden = false;
  } finally {
    setFinishedState();
  }
}

function updateFilterState() {
  sortFilter.dataset.active = String(sortFilter.value !== 'Default');
  roleFilter.dataset.active = String(roleFilter.value !== 'all');
  countryFilter.dataset.active = String(countryFilter.value !== 'all');
}

function updateCountryOptions() {
  const selectedCountry = countryFilter.value || 'all';
  const options = new Map();
  for (const profile of profiles) {
    for (const country of countryParts(profile)) {
      const key = country.toLowerCase();
      if (!options.has(key)) options.set(key, country);
    }
  }
  countryFilter.replaceChildren();
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All countries';
  countryFilter.append(allOption);
  for (const [key, country] of [...options].sort((a, b) => a[1].localeCompare(b[1]))) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = country;
    countryFilter.append(option);
  }
  countryFilter.value = selectedCountry !== 'all' && options.has(selectedCountry) ? selectedCountry : 'all';
  updateFilterState();
}

function sortProfiles(list) {
  const sorted = [...list];
  const compare = (a, b, key) => String(a[key] || '').localeCompare(String(b[key] || ''), undefined, { sensitivity: 'base' });
  switch (sortFilter.value) {
    case 'Names A-Z': sorted.sort((a, b) => compare(a, b, 'name')); break;
    case 'Names Z-A': sorted.sort((a, b) => compare(b, a, 'name')); break;
    case 'Github names A-Z': sorted.sort((a, b) => compare(a, b, 'github')); break;
    case 'Github names Z-A': sorted.sort((a, b) => compare(b, a, 'github')); break;
    case 'Role': sorted.sort((a, b) => compare({ role: roleLabels[a.role] || a.role }, { role: roleLabels[b.role] || b.role }, 'role') || compare(a, b, 'name')); break;
    case 'Country': sorted.sort((a, b) => compare(a, b, 'country') || compare(a, b, 'name')); break;
    case 'Random': return shuffleArray(sorted);
  }
  return sorted;
}

function updateFilterCount() {
  if (!filterToggle || !filterCount) return;
  const count = [searchBox.value.trim() !== '', roleFilter.value !== 'all', countryFilter.value !== 'all']
    .filter(Boolean).length;
  filterCount.hidden = count === 0;
  filterCount.textContent = count ? String(count) : '';
  filterToggle.setAttribute('aria-label', count ? `Filters, ${count} active ${count === 1 ? 'filter' : 'filters'}` : 'Filters');
}

function syncFilterDisclosure() {
  if (!filterToggle || !filtersForm) return;
  const mobile = mobileFilterMedia.matches;
  const expanded = !mobile || filtersExpandedOnMobile;
  filterToggle.hidden = !mobile;
  filterToggle.setAttribute('aria-expanded', String(expanded));
  filtersForm.classList.toggle('filters-open', expanded);
}

if (filterToggle) filterToggle.addEventListener('click', () => {
  if (!mobileFilterMedia.matches) return;
  filtersExpandedOnMobile = !filtersExpandedOnMobile;
  syncFilterDisclosure();
});
if (filterToggle && typeof mobileFilterMedia.addEventListener === 'function') {
  mobileFilterMedia.addEventListener('change', syncFilterDisclosure);
} else if (filterToggle && typeof mobileFilterMedia.addListener === 'function') {
  mobileFilterMedia.addListener(syncFilterDisclosure);
}
syncFilterDisclosure();
updateFilterCount();

function renderFilteredProfiles() {
  updateFilterCount();
  const query = searchBox.value.trim().toLocaleLowerCase();
  chosenProfiles = profiles.filter(profile => {
    const searchable = [profile.name, profile.github, roleLabels[profile.role] || profile.role, profile.country, profile.message, profile.bio,
      ...(Array.isArray(profile.learned) ? profile.learned : [])].filter(Boolean).join(' ').toLocaleLowerCase();
    return searchable.includes(query) &&
      (roleFilter.value === 'all' || profile.role === roleFilter.value) &&
      (countryFilter.value === 'all' || countryParts(profile).some(country => country.toLowerCase() === countryFilter.value));
  });
  chosenProfiles = sortProfiles(chosenProfiles);
  container.classList.toggle('compact-wall', chosenProfiles.length >= 5 && chosenProfiles.length < 8);
  container.classList.toggle('wide-wall', chosenProfiles.length >= 7);
  container.replaceChildren(...chosenProfiles.map(renderContributor));
  fitStoneInscriptions();
  emptyMessage.hidden = chosenProfiles.length > 0 || profiles.length === 0;
  setResultStatus();
}

function highlightCard(card) {
  card.classList.add('spotlight');
  window.setTimeout(() => card.classList.remove('spotlight'), 6000);
}

function revealFilteredHashTarget() {
  const hash = window.location?.hash;
  if (typeof hash !== 'string' || hash.length < 2) return;
  let username;
  try { username = decodeURIComponent(hash.slice(1)); } catch { return; }
  const profile = profiles.find(item => item.github.toLowerCase() === username.toLowerCase());
  if (!profile) return;
  const cardId = contributorCardId(profile.github);
  let card = [...container.children].find(item => item.id === cardId);
  if (!card) {
    searchBox.value = '';
    roleFilter.value = 'all';
    countryFilter.value = 'all';
    updateFilterState();
    renderFilteredProfiles();
    card = [...container.children].find(item => item.id === cardId);
  }
  if (!card) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  highlightCard(card);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

if (retryButton) retryButton.addEventListener('click', loadContributors);
if (filtersForm) filtersForm.addEventListener('submit', event => event.preventDefault());
searchBox.addEventListener('input', renderFilteredProfiles);
for (const control of [sortFilter, roleFilter, countryFilter]) {
  control.addEventListener('change', () => {
    updateFilterState();
    renderFilteredProfiles();
  });
}
window.addEventListener('hashchange', revealFilteredHashTarget);
randomButton.addEventListener('click', () => {
  renderFilteredProfiles();
  if (!chosenProfiles.length) {
    randomStatus.textContent = 'No contributors match the current search and filters.';
    return;
  }
  const profile = chosenProfiles[Math.floor(Math.random() * chosenProfiles.length)];
  const card = [...container.children].find(item => item.dataset.id === profile.github);
  if (!card) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  highlightCard(card);
  randomStatus.textContent = `Selected ${profile.name}.`;
  card.querySelector('.detail').focus();
});

const root = document.documentElement;
const toggle = document.querySelector('#theme-toggle');
function syncToggle() {
  const dark = root.dataset.theme === 'dark';
  root.classList.toggle('light', !dark);
  toggle.textContent = dark ? 'Light mode' : 'Dark mode';
  toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  toggle.setAttribute('aria-pressed', String(dark));
}
toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { }
  syncToggle();
});
syncToggle();
loadContributors();
