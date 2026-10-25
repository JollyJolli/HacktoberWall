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
