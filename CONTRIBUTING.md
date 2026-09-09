# Contributing to HacktoberWall

Thanks for helping with HacktoberWall. The repository now contains yearly editions, and the current one lives in `2026/`.

Please leave `2024/` alone unless maintainers explicitly ask for archive work. It is the preserved 2024 edition.

## Join the Wall

If you mainly want to add yourself to HacktoberWall 2026, make one contributor file:

```text
2026/data/contributors/<github-username>.json
```

Flow:

1. Fork the repository.
2. Copy `2026/data/contributors/_template.json`.
3. Rename the copy to your GitHub username, for example `jollyjolli.json`.
4. Fill in your information.
5. Commit only your new contributor file.
6. Push your branch.
7. Open a pull request.

Use your GitHub username in the `github` field, and keep `links.github` as `https://github.com/<github-username>`.

Required fields:

- `github`
- `name`
- `role`
- `message`
- `links.github`

Optional fields:

- `country`
- `bio`
- `learned`
- `links.website`
- `links.linkedin`

Supported roles for now:

- `first-contribution`
- `contributor`
- `builder`

These roles are descriptive metadata. They are not levels, points, rankings, or a leaderboard.

## Improve HacktoberWall

You can also improve the 2026 website itself. The application files are inside:

```text
2026/
```

Good pull requests can improve UI, accessibility, responsive layout, documentation, performance, contributor cards, navigation, bugs, or maintainability. Keep changes focused and explain what you changed in the pull request.

HacktoberWall 2026 does not need AI features, authentication, sign-up forms, databases, admin panels, points, streaks, or PR farming mechanics. The pull request is part of the experience.

## Local Checks

From the repository root:

```sh
npm run build
npm run lint
```

`npm run build` refreshes `2026/data/contributors/index.json` from the individual contributor JSON files. Do not edit that generated index by hand.

## Pull Request Notes

Before opening a pull request:

- Make sure your JSON is valid.
- If you changed website code, check the page locally when possible.
- Keep `2024/` unchanged unless the issue is specifically about the 2024 archive.
- Do not add unrelated cleanup to a profile pull request.

Commit messages can follow Conventional Commits, for example:

```sh
git commit -m "feat: add jollyjolli to 2026 wall"
```
