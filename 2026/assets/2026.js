const container = document.querySelector('#contributors');
const status = document.querySelector('#status');
let profiles = [];

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

async function loadContributors() {
  const response = await fetch('data/contributors/index.json');
  const names = await response.json();
  profiles = await Promise.all(names.map(async name => {
    const safe = safeName(name);
    const response = await fetch(`data/contributors/${safe}.json`);
    return response.json();
  }));

  container.replaceChildren(...profiles.map(renderContributor));
  status.textContent = `${profiles.length} total contributor${profiles.length === 1 ? '' : 's'}`;
  renderStatistics();
}

loadContributors().catch(() => {
  status.textContent = 'Could not load contributors.';
});

// Array containing the filtered profiles
let chosenProfiles = [];

// Search Function
const title = document.querySelector("#contributors-title");
const searchBox = document.createElement("input");
searchBox.type = "text";
searchBox.placeholder = "Search";
searchBox.classList.add("searchBox");
title.insertAdjacentElement("afterend", searchBox);

searchBox.addEventListener("keyup", (e) => {
  choosingProfiles(searchBox.value, filter.value);
})

// Filter
const filter = document.createElement("select");
filter.classList.add("FilterBox");
searchBox.insertAdjacentElement("afterend", filter);
createFilterSelect();
function createFilterSelect() {
  const option = ["Default", "Names A-Z", "Names Z-A", "Github names A-Z", "Github names Z-A", "Random"];
  option.forEach((a) => {
    const opt = document.createElement("option");
    opt.textContent = a;
    filter.append(opt);
  })
}

filter.addEventListener("change", () => {
  choosingProfiles(searchBox.value, filter.value);
})

function choosingProfiles(s, f) {
  container.innerHTML = "";
  chosenProfiles = [...profiles].filter(a =>
    a.name
      .toLowerCase()
      .includes(s.trim().toLowerCase())
    ||
    a.github
      .toLowerCase()
      .includes(s.trim().toLowerCase())
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
      console.log("123");
    }
  }
  chosenProfiles.forEach(a => {
    container.append(renderContributor(a));
  });
  if (container.innerHTML == "") {
    container.append(document.createElement("p").textContent = "No contributors found.");
  }
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    console.log(j);

    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    console.log(array);

  }
  return array;
}
// Random Contributor Selector
const randomContributor = document.createElement("button");
randomContributor.textContent = "Random Contributor";
filter.insertAdjacentElement("afterend", randomContributor);
randomContributor.classList.add("Btn");
randomContributor.classList.add("randomContributingButton");

randomContributor.addEventListener("click", () => {
  choosingProfiles(searchBox.value, filter.value);
  if(choosingProfiles.length == 0){
    return;
  }
  let a = chosenProfiles[Math.floor(Math.random() * (chosenProfiles.length))];
  findingRandomContributor(document.querySelector(`[data-id=${a.github}]`));
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
