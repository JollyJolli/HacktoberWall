# HacktoberWall 2026

This folder is the 2026 edition of HacktoberWall.

It is intentionally small right now. The page only loads contributor JSON files and renders cards. The point is to give contributors a simple place to start, then let pull requests shape the 2026 website.

## Files

```text
2026/
├── index.html
├── assets/
│   ├── 2026.css
│   └── 2026.js
└── data/
    └── contributors/
        ├── _template.json
        ├── jollyjolli.json
        └── index.json
```

`index.json` is generated. It only contains contributor names like `jollyjolli`; the full profile stays in `jollyjolli.json`. Do not edit the index by hand.

## Add Yourself

1. Copy `2026/data/contributors/_template.json`.
2. Rename it to your GitHub username, for example `octocat.json`.
3. Fill in your details.
4. Open a pull request.

The filename should match the `github` field.

## Contributor Fields

Required:

- `github`
- `name`
- `role`
- `message`
- `links.github`

Optional:

- `country`
- `bio`
- `learned`
- `links.website`
- `links.linkedin`

Roles for now:

- `first-contribution`
- `contributor`
- `builder`

## Improve the Site

The 2026 website is not finished on purpose. You can improve the HTML, CSS, JavaScript, accessibility, responsive layout, contributor cards, documentation, or any reasonable part of this edition.

Do not edit `../2024/` for 2026 changes. That folder is the old archive.

## Build

From the repository root:

```sh
npm run build
```

That regenerates `2026/data/contributors/index.json` from the individual contributor files. The page reads that name list, then loads each matching JSON file.

