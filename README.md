# deeplink-doctor

[![CI](https://github.com/KMavr/deeplink-doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/KMavr/deeplink-doctor/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/deeplink-doctor.svg)](https://www.npmjs.com/package/deeplink-doctor)
[![npm downloads](https://img.shields.io/npm/dm/deeplink-doctor.svg)](https://www.npmjs.com/package/deeplink-doctor)

> Statically reconcile an Expo project's **route tree**, its **native deep-link
> config**, and (optionally) its **hosted association files** — and report where
> they disagree.

Deep links break in ways nothing catches until a user taps one in production: an
`intentFilter` advertises a path no screen handles, a screen can never be reached
by any link, or the `apple-app-site-association` file you hosted names the wrong
bundle. Apple's validator and Android's `pm verify-app-links` check the _hosted
file_ or _device state_ — none of them read your repo, so none can tell you the
repo and the config disagree. That repo-aware cross-check is the whole point of
this tool.

Zero config, no setup, runs over `npx`.

## Quickstart

```sh
# from the root of an Expo (expo-router) project
npx deeplink-doctor
```

That runs every static check — no network, safe on every commit. Add `--remote`
to also fetch and validate your hosted association files.

Requires Node 18+ and an `expo-router` project (it reads your `app/` directory
and `npx expo config --json`).

## What it catches

A project can look perfectly configured locally yet be dead in production. Static
checks run offline:

```sh
$ npx deeplink-doctor
  DL001  error  No route handles deep link target "/promo"

1 issue (1 error, 0 warnings)
```

…and the hosted files are the other half of the handshake. `--remote` fetches
them and confirms they name _your_ app:

```sh
$ npx deeplink-doctor check --remote --explain
  DL202  error  AASA appID does not match ios.bundleIdentifier "com.example.app"
      The hosted AASA lists no appID matching your ios.bundleIdentifier (an
      appID is <teamId>.<bundleIdentifier>). iOS will not associate the domain
      with your app. Fix: add your team + bundle to applinks.details[].appID(s)
      in the hosted AASA.

  DL203  error  assetlinks.json has no entry for android.package "com.example.app"
      The hosted assetlinks.json has no statement for your android.package.
      Android will not verify your App Links. Fix: add a statement whose
      target.package_name is your package.

2 issues (2 errors, 0 warnings)
```

Green offline, red against the live world — the classic "works in dev, broken in
prod." That's exactly the gap `--remote` closes.

## How it works

It reconciles up to three sources of truth:

1. **Route tree** — parses your `app/` directory the way expo-router does
   (dynamic `[id]`, catch-all `[...rest]`, `(groups)`, `_layout`, `+`-special and
   API routes).
2. **Native config** — reads the _resolved_ config from `npx expo config --json`
   (`scheme`, `ios.associatedDomains`/`bundleIdentifier`, `android.package`/
   `intentFilters`).
3. **Hosted association files** _(opt-in, `--remote`)_ — fetches
   `https://<domain>/.well-known/apple-app-site-association` and
   `assetlinks.json` and checks they point back at your app.

## Commands

| Command                                     | Description                                     |
| ------------------------------------------- | ----------------------------------------------- |
| `deeplink-doctor` / `deeplink-doctor check` | Run the checks and report mismatches (default). |
| `deeplink-doctor routes`                    | Print the parsed route tree (debug).            |

### Flags (for `check`)

| Flag              | Effect                                                                     |
| ----------------- | -------------------------------------------------------------------------- |
| `--remote`        | Also fetch and validate hosted association files (makes network requests). |
| `--domain <host>` | Override the domain(s) probed by `--remote`.                               |
| `--strict`        | Promote warnings to failures (non-zero exit on any finding).               |
| `--silent`        | Hide warnings (errors only). Ignored when `--strict` is set.               |
| `--explain`       | Append a long-form explanation to each finding.                            |
| `--config <path>` | Path to a `deeplink.config.json` (defaults to the project root).           |
| `--json`          | Emit a stable machine-readable schema instead of the human report.         |

### Exit codes

| Code | Meaning                                                            |
| ---- | ------------------------------------------------------------------ |
| `0`  | Clean (or only warnings, without `--strict`).                      |
| `1`  | One or more findings at failure severity.                          |
| `2`  | Tool or usage error (e.g. not an Expo project, unreadable config). |

## Checks

Severity is the default; `--strict` promotes every warning to a failure.

| Code    | Severity | Meaning                                                             |
| ------- | -------- | ------------------------------------------------------------------- |
| `DL001` | error    | A path advertised by the native config matches no route.            |
| `DL002` | warn     | A deep-linkable route is reachable by no configured link.           |
| `DL003` | error    | A custom-scheme link is configured but `scheme` is missing.         |
| `DL101` | error    | An `associatedDomains` entry is missing its `applinks:` prefix.     |
| `DL102` | error    | `ios.bundleIdentifier` missing while iOS deep links are configured. |
| `DL103` | error    | `android.package` missing while Android deep links are configured.  |
| `DL104` | warn     | `intentFilter` has `autoVerify` but no `data.host` to verify.       |
| `DL201` | error    | A hosted file is unreachable, not JSON, or served via a redirect.   |
| `DL202` | error    | The AASA names no appID matching `ios.bundleIdentifier`.            |
| `DL203` | error    | `assetlinks.json` has no entry for `android.package`.               |
| `DL204` | warn     | The matched `assetlinks` entry has empty cert fingerprints.         |
| `DL901` | warn     | A suppression rule is missing a `reason`/`owner`.                   |
| `DL902` | warn     | A suppression rule targets an unknown code (likely a typo).         |

Run `check --explain` to print the full why-and-fix for each finding you have.

## Suppressions

`DL002` in particular is false-positive-prone by design (admin-only or
intentionally unlinked screens). Suppress findings in a `deeplink.config.json` at
your project root — but suppressions are **governed**, not silent: each one needs
a `reason` and an `owner`, so an ignore is always accountable.

```json
{
  "ignore": [
    {
      "code": "DL002",
      "route": "/internal/debug",
      "reason": "admin-only screen, never linked",
      "owner": "your-handle",
      "revisitWhen": "expo-router@>=6"
    }
  ]
}
```

A rule missing `reason`/`owner` raises `DL901`; a rule targeting a code the tool
doesn't emit raises `DL902`. Suppressed findings stay out of the exit code but are
reported as a count (and listed in full under `--json`).

## CI

`--json` emits a stable schema for pipelines:

```json
{
  "summary": { "total": 2, "errors": 2, "warnings": 0, "suppressed": 1 },
  "findings": [{ "code": "DL202", "severity": "error", "message": "...", "target": "..." }],
  "suppressed": [{ "code": "DL002", "severity": "warn", "message": "...", "route": "..." }]
}
```

Gate a pull request with the static checks on every push, and the full
`--remote` run before a release:

```sh
npx deeplink-doctor --strict            # fast, hermetic, every commit
npx deeplink-doctor --remote --strict   # full, networked, pre-release
```

## Scope

v1 is a focused linter for **expo-router** projects. Out of scope (by design):

- **SHA-256 fingerprint verification** against real signing certs — that needs
  EAS/Play credentials. `DL204` flags an empty fingerprint list; it does not
  verify the values.
- **React Navigation `linking.config`** — expo-router is the v1 target.
- **Runtime/device testing** — `adb` and Apple's validator already own that.

## License

MIT © Konstantinos Mavrikas
