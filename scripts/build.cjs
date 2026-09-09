const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('./build-2026.cjs');
const css = fs.readFileSync(path.join(root, 'assets/landing.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
// Strip full-line comments and indentation; keep newlines for safe ASI semantics.
const js = fs.readFileSync(path.join(root, 'assets/landing.js'), 'utf8')
  .split('\n').filter(line => !line.trim().startsWith('//')).map(line => line.trim()).filter(Boolean).join('\n');
fs.writeFileSync(path.join(root, 'assets/landing.min.css'), css + '\n');
fs.writeFileSync(path.join(root, 'assets/landing.min.js'), js + '\n');
require('./check-site.cjs');
require('./check-2026.cjs');
console.log('Static HacktoberWall assets built. Root landing and 2026 edition are ready for the existing host.');
