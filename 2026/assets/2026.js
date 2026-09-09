const container = document.querySelector('#contributors');
const status = document.querySelector('#status');

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

function renderContributor(profile) {
  const card = document.createElement('article');
  card.className = 'card';

  const avatar = document.createElement('img');
  avatar.src = `https://github.com/${encodeURIComponent(profile.github)}.png?size=128`;
  avatar.alt = `${profile.name} avatar`;
  avatar.loading = 'lazy';
  card.append(avatar);

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
  const profiles = await Promise.all(names.map(async name => {
    const safe = safeName(name);
    const response = await fetch(`data/contributors/${safe}.json`);
    return response.json();
  }));

  container.replaceChildren(...profiles.map(renderContributor));
  status.textContent = `${profiles.length} contributor${profiles.length === 1 ? '' : 's'}`;
}

loadContributors().catch(() => {
  status.textContent = 'Could not load contributors.';
});
