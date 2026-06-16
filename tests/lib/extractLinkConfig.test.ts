import { describe, it, expect } from 'vitest';
import { extractLinkConfig } from '../../src/lib/extractLinkConfig.js';
import type { LinkConfig } from '../../src/types.js';

/**
 * Contract for `extractLinkConfig(config)`:
 *
 * Input  — the *resolved* Expo config (the parsed JSON from
 *          `npx expo config --json`), treated as untrusted `unknown`.
 * Output — a `LinkConfig`:
 *   - `schemes`  the `scheme` field normalized to an array (string | string[] |
 *                absent  ->  string[])
 *   - `ios`      `{ bundleIdentifier?, associatedDomains: string[] }`
 *   - `android`  `{ package?, intentFilters: IntentFilter[] }`
 *
 * Missing sections never throw — they default to empty arrays / omitted fields.
 * The function is pure: no subprocess, no filesystem.
 */

describe('extractLinkConfig', () => {
  it('extracts a fully-populated config', () => {
    const config = {
      scheme: 'myapp',
      ios: {
        bundleIdentifier: 'com.example.app',
        associatedDomains: ['applinks:example.com', 'applinks:www.example.com'],
      },
      android: {
        package: 'com.example.app',
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            category: ['BROWSABLE', 'DEFAULT'],
            data: [{ scheme: 'https', host: 'example.com', pathPrefix: '/shop' }],
          },
        ],
      },
    };

    const expected: LinkConfig = {
      schemes: ['myapp'],
      ios: {
        bundleIdentifier: 'com.example.app',
        associatedDomains: ['applinks:example.com', 'applinks:www.example.com'],
      },
      android: {
        package: 'com.example.app',
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            category: ['BROWSABLE', 'DEFAULT'],
            data: [{ scheme: 'https', host: 'example.com', pathPrefix: '/shop' }],
          },
        ],
      },
    };

    expect(extractLinkConfig(config)).toEqual(expected);
  });

  it('normalizes a string scheme to an array', () => {
    expect(extractLinkConfig({ scheme: 'myapp' }).schemes).toEqual(['myapp']);
  });

  it('keeps an array scheme as-is', () => {
    expect(extractLinkConfig({ scheme: ['a', 'b'] }).schemes).toEqual(['a', 'b']);
  });

  it('defaults schemes to [] when scheme is absent', () => {
    expect(extractLinkConfig({}).schemes).toEqual([]);
  });

  it('returns empty ios/android structures for a minimal config', () => {
    const expected: LinkConfig = {
      schemes: [],
      ios: { associatedDomains: [] },
      android: { intentFilters: [] },
    };
    expect(extractLinkConfig({})).toEqual(expected);
  });

  it('maps all intentFilter data fields faithfully', () => {
    const config = {
      android: {
        intentFilters: [
          {
            action: 'VIEW',
            data: [
              { scheme: 'https', host: 'example.com', pathPattern: '/products/.*' },
              { path: '/exact' },
            ],
          },
        ],
      },
    };

    expect(extractLinkConfig(config).android.intentFilters).toEqual([
      {
        action: 'VIEW',
        data: [
          { scheme: 'https', host: 'example.com', pathPattern: '/products/.*' },
          { path: '/exact' },
        ],
      },
    ]);
  });

  it('does not throw on an empty associatedDomains / intentFilters', () => {
    const config = { ios: { associatedDomains: [] }, android: { intentFilters: [] } };
    const result = extractLinkConfig(config);
    expect(result.ios.associatedDomains).toEqual([]);
    expect(result.android.intentFilters).toEqual([]);
  });
});
