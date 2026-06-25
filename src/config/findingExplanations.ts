import type { FindingCode } from '../types.js';

// Long-form help per finding code, surfaced by `check --explain`. Record<FindingCode, _>
// is exhaustive — a new code can't ship without an explanation. Prose drafted to
// say what the code means, why it matters, and how to fix it.
export const FINDING_EXPLANATIONS: Record<FindingCode, string> = {
  DL001:
    'A path advertised by your native config (an Android intentFilter path/pathPrefix/pathPattern, or a custom-scheme link) matches no route in your app/ tree. The link opens the app but lands nowhere. Fix: add a route that handles the path, or correct/remove the intentFilter entry.',
  DL002:
    'A deep-linkable route exists but no configured link pattern can reach it. This is often intentional (admin or internal-only screens) and is the most false-positive-prone check by design — suppress those in deeplink.config.json. Otherwise add an intentFilter path or associatedDomain so the screen is reachable by a link.',
  DL003:
    'A custom-scheme deep link is configured but no `scheme` is declared in your Expo config. Without a scheme, custom-scheme links cannot resolve. Fix: set `scheme` in app.json/app.config.',
  DL101:
    'An `ios.associatedDomains` entry is missing its service prefix (e.g. `applinks:`). iOS silently ignores malformed entries, so the domain is never associated. Fix: prefix the entry, e.g. `applinks:example.com`.',
  DL102:
    'iOS deep links are configured (associatedDomains present) but `ios.bundleIdentifier` is missing. Universal Links cannot be associated without it. Fix: set `ios.bundleIdentifier`.',
  DL103:
    'Android intent filters are configured but `android.package` is missing. App Links cannot be verified without the package name. Fix: set `android.package`.',
  DL104:
    'An intentFilter has `autoVerify: true` but no `data.host` entries, so Android has nothing to verify. Fix: add a `data.host`, or drop `autoVerify` if the filter is scheme-only.',
  DL201:
    'A hosted association file (AASA or assetlinks.json) is unreachable, not served as JSON, or served via a redirect. Apple and Google reject all three. Fix: serve the file at the exact /.well-known path, as application/json, over HTTPS, with no redirect.',
  DL202:
    'The hosted AASA lists no appID matching your `ios.bundleIdentifier` (an appID is `<teamId>.<bundleIdentifier>`). iOS will not associate the domain with your app. Fix: add your team + bundle to applinks.details[].appID(s) in the hosted AASA.',
  DL203:
    'The hosted assetlinks.json has no statement for your `android.package`. Android will not verify your App Links. Fix: add a statement whose target.package_name is your package.',
  DL204:
    'The matched assetlinks statement has an empty sha256_cert_fingerprints array, so Android has no signing certificate to verify against. Fix: add your app’s release signing SHA-256 fingerprint(s).',
  DL901:
    'A suppression rule is missing a `reason` and/or `owner`. Suppressions are governed — every ignore carries accountability so it can be revisited. Fix: add `reason` and `owner` to the rule in deeplink.config.json.',
  DL902:
    'A suppression rule targets a code this tool never emits — almost always a typo (e.g. DL2O2 instead of DL202). Fix: correct the code, or remove the stale rule.',
};
