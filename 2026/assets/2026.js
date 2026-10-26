const container = document.querySelector('#contributors');
const status = document.querySelector('#status');
const retryButton = document.querySelector('#retry-loading');
let profiles = [];
const loadedProfiles = new Map();

const roleLabels = {
  'first-contribution': 'First contribution',
  contributor: 'Contributor',
  builder: 'Builder'
};

function addText(parent, tag, text, className) {
  if (!text) return;
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
}

function addLink(parent, href, text) {
  if (!href) return;
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
  const initials = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('');

  return initials.toUpperCase() || '?';
}

function createAvatar(profile) {
  const avatarContainer = document.createElement('div');
  avatarContainer.className = 'avatar';

  const avatar = document.createElement('img');
  avatar.className = 'avatar-image';
  avatar.alt = `${profile.name} avatar`;
  avatar.loading = 'lazy';

  const fallback = document.createElement('span');
  fallback.className = 'avatar-fallback';
  fallback.textContent = getInitials(profile.name);
  fallback.hidden = true;
  fallback.setAttribute('role', 'img');
  fallback.setAttribute('aria-label', `${profile.name} avatar unavailable`);

  avatar.addEventListener('error', () => {
    avatar.hidden = true;
    fallback.hidden = false;
  }, { once: true });

  avatar.src = `https://github.com/${encodeURIComponent(profile.github)}.png?size=128`;
  avatarContainer.append(avatar, fallback);
  return avatarContainer;
}

function renderContributor(profile) {
  const card = document.createElement('article');
  card.className = 'card';

  card.append(createAvatar(profile));
  card.dataset.id = profile.github; // Github Username are unique
  addText(card, 'h3', profile.name);
  addText(card, 'p', `@${profile.github}`, 'meta');
  addText(card, 'p', [roleLabels[profile.role] || profile.role, profile.country].filter(Boolean).join(' - '), 'meta');
  addText(card, 'p', profile.message);
  addText(card, 'p', profile.bio, 'meta');

  if (Array.isArray(profile.learned) && profile.learned.length) {
    const list = document.createElement('ul');
    list.className = 'learned';
    for (const item of profile.learned) addText(list, 'li', item);
    card.append(list);
  }

  const links = document.createElement('p');
  links.className = 'links';
  addLink(links, profile.links?.github, 'GitHub');
  addLink(links, profile.links?.website, 'Website');
  addLink(links, profile.links?.linkedin, 'LinkedIn');
  if (links.children.length) card.append(links);

  const detailsButton = document.createElement('button');
  detailsButton.className = 'details-button';
  detailsButton.type = 'button';
  detailsButton.textContent = 'View details';
  detailsButton.setAttribute('aria-haspopup', 'dialog');
  detailsButton.addEventListener('click', () => openContributorDialog(profile, detailsButton));
  card.append(detailsButton);

  return card;
}

const contributorDialog = document.querySelector('#contributor-dialog');
const dialogTitle = document.querySelector('#contributor-dialog-title');
const dialogContent = document.querySelector('#contributor-dialog-content');
const dialogClose = document.querySelector('#contributor-dialog-close');
let dialogTrigger = null;

function openContributorDialog(profile, trigger) {
  dialogTrigger = trigger;
  dialogTitle.textContent = `${profile.name} details`;
  dialogContent.replaceChildren();
  dialogContent.append(createAvatar(profile));
  addText(dialogContent, 'p', `@${profile.github}`, 'meta');
  addText(dialogContent, 'p', [roleLabels[profile.role] || profile.role, profile.country].filter(Boolean).join(' - '), 'meta');
  addText(dialogContent, 'p', profile.message);
  addText(dialogContent, 'p', profile.bio);

  if (Array.isArray(profile.learned) && profile.learned.length) {
    const list = document.createElement('ul');
    list.className = 'learned';
    for (const item of profile.learned) addText(list, 'li', item);
    dialogContent.append(list);
  }

  const links = document.createElement('p');
  links.className = 'links';
  addSafeDialogLink(links, profile.links?.github, 'GitHub');
  addSafeDialogLink(links, profile.links?.website, 'Website');
  addSafeDialogLink(links, profile.links?.linkedin, 'LinkedIn');
  if (links.children.length) dialogContent.append(links);

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

function renderStatistics() {
  const countries = new Set();
  for (const profile of profiles) {
    if (typeof profile.country !== 'string') continue;
    // A slash-separated value such as Mexico/Brasil represents both countries.
    for (const country of profile.country.split('/')) {
      const normalized = country.trim().replace(/\s+/g, ' ').toLowerCase();
      if (normalized) countries.add(normalized);
    }
  }
  const countRole = role => profiles.filter(profile => profile.role === role).length;
  const statistics = document.querySelector('#contributor-stats');
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
  status.className = 'status status-loading';
  status.textContent = 'Loading contributors...';
  container.setAttribute('aria-busy', 'true');
  if (retryButton) {
    retryButton.hidden = true;
    retryButton.disabled = true;
  }
}

function renderProfiles() {
  profiles = [...loadedProfiles.values()];
  container.replaceChildren(...profiles.map(renderContributor));
  updateCountryOptions();
  if (profiles.length && (searchBox.value || filter.value !== "Default" || roleFilter.value !== "all" || countryFilter.value !== "all")) {
    choosingProfiles(searchBox.value, filter.value);
  }
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
      status.className = 'status status-empty';
      status.textContent = 'No contributors yet.';
      renderStatistics();
      return;
    }

    const currentNames = new Set(names.map(safeName));
    for (const name of loadedProfiles.keys()) {
      if (!currentNames.has(name)) loadedProfiles.delete(name);
    }

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
      status.className = profiles.length ? 'status status-partial' : 'status status-error';
      status.textContent = profiles.length
        ? `Loaded ${profiles.length} of ${names.length} contributors. ${failedNames.length} profile${failedNames.length === 1 ? '' : 's'} could not be loaded.`
        : 'Could not load contributors.';
      if (retryButton) retryButton.hidden = false;
    } else {
      status.className = 'status status-success';
      status.textContent = `${profiles.length} total contributor${profiles.length === 1 ? '' : 's'}`;
    }
    if (failedNames.length > 0) {
      document.querySelector('#contributor-stats').hidden = true;
    } else {
      renderStatistics();
    }
  } catch {
    status.className = 'status status-error';
    status.textContent = profiles.length
      ? `Could not refresh contributors. ${profiles.length} loaded profile${profiles.length === 1 ? '' : 's'} remain visible.`
      : 'Could not load contributors.';
    if (retryButton) retryButton.hidden = false;
  } finally {
    setFinishedState();
  }
}

if (retryButton) retryButton.addEventListener('click', loadContributors);

// Array containing the filtered profiles
let chosenProfiles = [];

// Search Function
const title = document.querySelector("#contributors-title");
const searchBox = document.createElement("input");
searchBox.type = "search";
searchBox.value = "";
searchBox.placeholder = "Search";
searchBox.setAttribute("aria-label", "Search contributors");
searchBox.classList.add("searchBox");
title.insertAdjacentElement("afterend", searchBox);

searchBox.addEventListener("keyup", (e) => {
  choosingProfiles(searchBox.value, filter.value);
  revealFilteredHashTarget();
})

// Sorting
const filter = document.createElement("select");
filter.classList.add("FilterBox");
filter.setAttribute("aria-label", "Sort contributors");
searchBox.insertAdjacentElement("afterend", filter);
const sortOptions = [
  ["Default", "Default"],
  ["Names A-Z", "Names A-Z"],
  ["Names Z-A", "Names Z-A"],
  ["Github names A-Z", "GitHub names A-Z"],
  ["Github names Z-A", "GitHub names Z-A"],
  ["Random", "Random"]
];
for (const [value, label] of sortOptions) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  filter.append(option);
}
filter.value = "Default";

// Role and country filters are composed with search and sorting.
const roleFilter = document.createElement("select");
roleFilter.classList.add("FilterBox");
roleFilter.setAttribute("aria-label", "Filter contributors by role");
filter.insertAdjacentElement("afterend", roleFilter);
const roleOptions = [
  ["all", "All roles"],
  ["first-contribution", roleLabels["first-contribution"]],
  ["contributor", roleLabels.contributor],
  ["builder", roleLabels.builder]
];
for (const [value, label] of roleOptions) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  roleFilter.append(option);
}
roleFilter.value = "all";

const countryFilter = document.createElement("select");
countryFilter.classList.add("FilterBox");
countryFilter.setAttribute("aria-label", "Filter contributors by country");
roleFilter.insertAdjacentElement("afterend", countryFilter);

function countryParts(profile) {
  if (typeof profile.country !== "string") return [];
  return profile.country.split("/")
    .map(country => country.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function updateCountryOptions() {
  const selectedCountry = countryFilter.value || "all";
  const options = new Map();
  for (const profile of profiles) {
    for (const country of countryParts(profile)) {
      const key = country.toLowerCase();
      if (!options.has(key)) options.set(key, country);
    }
  }

  countryFilter.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All countries";
  countryFilter.append(allOption);
  for (const [key, country] of [...options].sort((a, b) => a[1].localeCompare(b[1]))) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = country;
    countryFilter.append(option);
  }
  countryFilter.value = selectedCountry !== "all" && options.has(selectedCountry) ? selectedCountry : "all";
  updateFilterState();
}

function updateFilterState() {
  filter.dataset.active = String(filter.value !== "Default");
  roleFilter.dataset.active = String(roleFilter.value !== "all");
  countryFilter.dataset.active = String(countryFilter.value !== "all");
}

for (const control of [filter, roleFilter, countryFilter]) {
  control.addEventListener("change", () => {
    updateFilterState();
    choosingProfiles(searchBox.value, filter.value);
    revealFilteredHashTarget();
  });
}

function revealFilteredHashTarget() {
  const hash = window.location?.hash;
  if (typeof hash !== "string" || hash.length < 2) return;

  let username;
  try {
    username = decodeURIComponent(hash.slice(1));
  } catch {
    return;
  }
  if (!username) return;

  const target = profiles.find(profile => profile.github.toLowerCase() === username.toLowerCase());
  if (!target) return;

  const targetIsRendered = [...container.children].some(card =>
    String(card.dataset?.id || "").toLowerCase() === target.github.toLowerCase()
  );
  if (targetIsRendered) return;

  const filtersActive = searchBox.value || roleFilter.value !== "all" || countryFilter.value !== "all";
  if (!filtersActive) return;

  searchBox.value = "";
  roleFilter.value = "all";
  countryFilter.value = "all";
  updateFilterState();
  choosingProfiles(searchBox.value, filter.value);
}

window.addEventListener("hashchange", revealFilteredHashTarget);
loadContributors();

function choosingProfiles(s, f) {
  container.replaceChildren();
  chosenProfiles = [...profiles].filter(a =>
    (a.name.toLowerCase().includes(s.trim().toLowerCase()) ||
      a.github.toLowerCase().includes(s.trim().toLowerCase())) &&
    (roleFilter.value === "all" || a.role === roleFilter.value) &&
    (countryFilter.value === "all" || countryParts(a).some(country => country.toLowerCase() === countryFilter.value))
  );
  switch (f) {
    case "Names A-Z": {
      chosenProfiles = [...chosenProfiles].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      break;
    }
    case "Names Z-A": {
      chosenProfiles = [...chosenProfiles].sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
      break;
    }
    case "Github names A-Z": {
      chosenProfiles = [...chosenProfiles].sort((a, b) => a.github.toLowerCase().localeCompare(b.github.toLowerCase()));
      break;
    }
    case "Github names Z-A": {
      chosenProfiles = [...chosenProfiles].sort((a, b) => b.github.toLowerCase().localeCompare(a.github.toLowerCase()));
      break;
    }
    case "Random": {
      chosenProfiles = shuffleArray([...chosenProfiles]);
    }
  }
  if (chosenProfiles.length) {
    chosenProfiles.forEach(profile => container.append(renderContributor(profile)));
  } else if (profiles.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-results";
    emptyMessage.setAttribute("role", "status");
    emptyMessage.textContent = "No contributors found.";
    container.append(emptyMessage);
  }
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
// Random Contributor Selector
const randomContributor = document.createElement("button");
randomContributor.textContent = "Random Contributor";
countryFilter.insertAdjacentElement("afterend", randomContributor);
randomContributor.classList.add("Btn");
randomContributor.classList.add("randomContributingButton");

randomContributor.addEventListener("click", () => {
  choosingProfiles(searchBox.value, filter.value);
  if (!chosenProfiles.length) return;
  const profile = chosenProfiles[Math.floor(Math.random() * chosenProfiles.length)];
  const card = [...container.children].find(child => child.dataset.id === profile.github);
  if (card) findingRandomContributor(card);
});
function findingRandomContributor(a) {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  a.scrollIntoView({
    block: "center",
    behavior: prefersReducedMotion ? "instant" : "smooth"
  });
  glowingEffect(a);
}
function glowingEffect(a) {
  a.classList.add("glowingEffect");
  setTimeout(() => {
    a.classList.remove("glowingEffect");
  }, 6000);
}
// Light-Dark Mode
const root = document.documentElement;
const toggle = document.querySelector('#theme-toggle');

function syncToggle() {
  const dark = root.dataset.theme === 'dark';
  toggle.textContent = dark ? 'Light mode' : 'Dark mode';
  toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}

toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { }
  syncToggle();
});
syncToggle();
