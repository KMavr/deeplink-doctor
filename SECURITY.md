# Security Policy

## Supported versions

Only the latest published release of `deeplink-doctor` receives security fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub:
[Report a vulnerability](https://github.com/KMavr/deeplink-doctor/security/advisories/new).

Include the affected version, what you did, and what you expected versus what happened. You can
expect an acknowledgement within a few days. Confirmed issues are fixed in a new release and
credited in the advisory unless you prefer otherwise.

## Scope

`deeplink-doctor` reads your `app/` directory and `npx expo config --json` output. With `--remote` it
also fetches your hosted `apple-app-site-association` and `assetlinks.json` files over HTTPS. It does
not modify your project. Reports about path handling, unsafe parsing of those files, how remote
fetches are made, or the release pipeline are in scope.

Every release is published from CI with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations.
