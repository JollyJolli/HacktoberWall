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

  return card;
}

function safeName(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9-]/g, '');
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
}

loadContributors().catch(() => {
  status.textContent = 'Could not load contributors.';
});

// Search Function
const title = document.querySelector("#contributors-title"); 
const searchBox = document.createElement("input");
searchBox.type = "text";
searchBox.placeholder = "Search";
searchBox.classList.add("searchBox");
title.insertAdjacentElement("afterend",searchBox);

searchBox.addEventListener("keyup",(e)=>{
    container.innerHTML="";
    [...profiles].filter(a => 
      a.name
      .toLowerCase()
      .includes(e.target.value.trim().toLowerCase()) 
      || 
      a.github
      .toLowerCase()
      .includes(e.target.value.trim().toLowerCase())
    ).forEach(a=>{
        container.append(renderContributor(a));
    });
    if(container.innerHTML == ""){
      container.append(document.createElement("p").textContent="No contributors found.");
    }
})

