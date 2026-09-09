# HacktoberWall

HacktoberWall is an open-source wall for Hacktoberfest-style first contributions and community improvements. Each year can have its own edition in this repository.

The current edition is **HacktoberWall 2026**.

- `2024/` is the preserved HacktoberWall 2024 website.
- `2026/` is the complete HacktoberWall 2026 website.
- The repository root contains shared documentation, scripts, historical landing content, and deployment files.

[Website](https://hacktoberwall.formen.cc) · [2026 edition](https://hacktoberwall.formen.cc/2026/) · [2024 archive](https://hacktoberwall.formen.cc/2024/src/index.html) · [GitHub](https://github.com/JollyJolli/HacktoberWall)

## Repository Structure

```text
HacktoberWall/
├── 2024/                  # preserved 2024 edition
├── 2026/                  # current 2026 edition
│   ├── index.html
│   ├── assets/
│   └── data/
│       └── contributors/
│           ├── _template.json
│           ├── jollyjolli.json
│           └── index.json  # generated, do not edit by hand
├── assets/                # root landing assets
├── scripts/               # lightweight build and validation scripts
├── README.md
└── CONTRIBUTING.md
```

The 2026 contributor files live in `2026/data/contributors/`. Each participant owns one JSON file, so adding yourself does not require editing a shared profile list. The generated index only stores contributor names so the static page knows which JSON files to load.

## Current Edition

The 2026 edition is intentionally simple at this stage. It can:

- load contributor names from the generated index, then load each matching JSON profile;
- exclude `_template.json` from the rendered Wall;
- render contributor cards with names, GitHub profiles, roles, messages, optional bio, country, learned items, and links;
- explain how to join the Wall;
- make it clear that the website itself is open to normal pull requests.

See [2026/README.md](2026/README.md) for edition-specific details.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md).

There are two common paths:

1. Add your profile at `2026/data/contributors/<github-username>.json`.
2. Improve the 2026 website inside `2026/`.

The 2024 folder is historical. Read it when useful, but do not edit it for 2026 work.

## Development

The project is plain HTML, CSS and JavaScript. There is no framework, database, backend, authentication, or AI feature in HacktoberWall 2026.

From the repository root:

```sh
npm run build
npm run lint
npm test
node scripts/preview.cjs
```

`npm run build` regenerates `2026/data/contributors/index.json`, refreshes the root landing minified assets, and runs the lightweight checks. The generated contributor index exists because static hosting cannot discover files in a directory at runtime; it only contains contributor names, not full profiles.

Preview: http://127.0.0.1:4173

## Historical Evidence

The root landing uses a static evidence snapshot verified on **9 September 2026**:

| Evidence | Value | Scope |
| --- | ---: | --- |
| Mural entries | 121 | Preserved JSON; not a unique-person count; includes later additions |
| Commits | 399 | October 2024 Git author dates, including merge commits |
| GitHub contributors | 133 | All-time accounts returned across two API pages |
| Merged pull requests | 164 | All-time GitHub search result |
| Forks | 124 | Repository total at verification |
| Stars | 36 | Repository total at verification |

The source snapshot is in `assets/impact.json`. Do not replace a verified number with an unverified or failed API result.

## Previous Editions

`2024/` remains the HacktoberWall 2024 website, including its original data model and UI. Keep it available as an archive.

No 2025 edition exists in this repository.

Contact: [formen@duck.com](mailto:formen@duck.com). See [SECURITY.md](SECURITY.md) for vulnerability reporting and [LICENSE](LICENSE) for project licensing.

