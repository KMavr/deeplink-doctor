# Contributing

Thanks for your interest in improving `deeplink-doctor`. Issues and PRs are welcome.

## Getting started

```sh
npm install
npm run build        # compile TypeScript to dist/
npm run dev          # recompile on change
npm test             # vitest, single pass
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run format:check # prettier
```

## Tests

- Written with Vitest, under `tests/`.
- Cover every check you add or change, including the no-issue case.

## Commits & releases

This repo uses **Conventional Commits** and [release-please](https://github.com/googleapis/release-please)
for automated releases. Your commit type drives the version bump:

- `feat:` → minor release
- `fix:` → patch release
- `feat!:` / `fix!:` or a `BREAKING CHANGE:` footer → major release
- `docs:` / `chore:` / `test:` / `ci:` / `refactor:` → no release

Releases are published from CI with npm provenance — no manual `npm publish`.

## Pull requests

1. Branch off `main`.
2. Make your change with tests. Update the README if a command, flag, exit code, or check changed.
3. Ensure the full gate is green locally:
   `npm run lint && npm run typecheck && npm run format:check && npm test`.
4. Push and open a PR against `main`. The PR title must be a Conventional Commit (it becomes the
   squash-commit header). `ci-success` is the required check.

### Maintainer note: branch protection

Require only the `ci-success` status check on `main` (**Settings → Branches**). It aggregates the
whole Node matrix, so changing the matrix in `.github/workflows/ci.yml` never orphans a required check.
