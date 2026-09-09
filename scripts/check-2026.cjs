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

assert.equal((html.match(/<h1\b/g) || []).length, 1, '2026 page should have one h1');
assert(read('assets/2026.js').includes('data/contributors/index.json'), '2026 script should load the generated contributor index');
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
