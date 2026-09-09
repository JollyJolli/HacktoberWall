const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const contributorsDir = path.join(root, '2026', 'data', 'contributors');
const outputFile = path.join(contributorsDir, 'index.json');
const allowedRoles = new Set(['first-contribution', 'contributor', 'builder']);
const urlFields = ['github', 'website', 'linkedin'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https:\/\//.test(value);
}

function validateContributor(file) {
  const basename = path.basename(file);
  const username = path.basename(file, '.json');
  const profile = readJson(file);
  const errors = [];
  const requiredStrings = ['github', 'name', 'role', 'message'];

  for (const key of requiredStrings) {
    if (typeof profile[key] !== 'string' || profile[key].trim() === '') errors.push(`${basename}: ${key} is required`);
  }

  if (profile.github && username.toLowerCase() !== profile.github.toLowerCase()) {
    errors.push(`${basename}: filename must match the github field`);
  }

  if (profile.role && !allowedRoles.has(profile.role)) {
    errors.push(`${basename}: role must be one of ${[...allowedRoles].join(', ')}`);
  }

  for (const key of ['country', 'bio']) {
    if (profile[key] != null && typeof profile[key] !== 'string') errors.push(`${basename}: ${key} must be a string or null`);
  }

  if (!Array.isArray(profile.learned)) errors.push(`${basename}: learned must be an array`);

  if (!profile.links || typeof profile.links !== 'object' || Array.isArray(profile.links)) errors.push(`${basename}: links must be an object`);
  else {
    for (const key of urlFields) {
      const value = profile.links[key];
      if (value !== null && value !== undefined && !isHttpUrl(value)) errors.push(`${basename}: links.${key} must be an https URL or null`);
    }
  }

  if (profile.github && profile.links?.github && profile.links.github.toLowerCase() !== `https://github.com/${profile.github}`.toLowerCase()) {
    errors.push(`${basename}: links.github should be https://github.com/${profile.github}`);
  }

  if (errors.length) throw new Error(errors.join('\n'));
  return username;
}

const contributors = fs.readdirSync(contributorsDir)
  .filter(file => file.endsWith('.json') && file !== '_template.json' && file !== 'index.json')
  .sort((a, b) => a.localeCompare(b))
  .map(file => validateContributor(path.join(contributorsDir, file)));

fs.writeFileSync(outputFile, JSON.stringify(contributors, null, 2) + '\n');
console.log(`Generated ${path.relative(root, outputFile)} with ${contributors.length} contributor name(s).`);
