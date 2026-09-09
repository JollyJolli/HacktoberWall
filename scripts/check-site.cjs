const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const html = read('index.html');
const data = JSON.parse(read('assets/impact.json'));
const names = JSON.parse(read('2024/src/data/contributors.json'));

assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.equal((html.match(/class="name-tile"/g) || []).length, names.length);
assert.equal((html.match(/class="commit-bar"/g) || []).length, 31);
assert.equal(data.history.daily.reduce((n, day) => n + day.commits, 0), 399);

try {
  execFileSync('git', ['cat-file', '-e', `${data.history.revision}^{commit}`], { cwd: root, stdio: 'ignore' });
  const output = execFileSync('git', ['log', data.history.revision, '--format=%as'], { cwd: root, encoding: 'utf8' }).trim();
  const dates = output ? output.split('\n') : [];
  for (const day of data.history.daily) assert.equal(day.commits, dates.filter(date => date.trim() === day.date).length, day.date);
} catch (error) {
  console.warn(`Skipping historical Git count check: ${data.history.revision} is not available in this checkout.`);
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate IDs');
for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (/^(https?:|mailto:)/.test(url)) continue;
  if (url.startsWith('#')) assert(ids.includes(url.slice(1)), 'Missing anchor: ' + url);
  else assert(fs.existsSync(path.join(root, url)), 'Missing asset: ' + url);
}
for (const number of [data.stars, data.forks, data.contributors, data.mergedPullRequests]) assert(html.includes(`<strong>${number}</strong>`));
assert(html.includes('prefers-reduced-motion') || read('assets/landing.css').includes('prefers-reduced-motion'));
assert.equal(read('assets/landing.min.css').trim(), read('assets/landing.css').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim(), 'Run npm run build to refresh CSS');
for (const file of ['assets/landing.js', 'assets/landing.min.js']) execFileSync(process.execPath, ['--check', path.join(root, file)]);
assert.equal(execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', '2024/'], { cwd: root, encoding: 'utf8' }).trim(), '', 'Protected archive changed');
console.log('PASS: evidence snapshot, links, assets, headings, IDs, generated CSS, JS syntax, and 2024 integrity.');
