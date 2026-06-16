import { describe, it, expect } from 'vitest';
import { readLinkConfig } from '../../src/parsers/expoConfig.js';
import type { LinkConfig } from '../../src/types.js';

/**
 * Contract for `expoConfig(projectRoot, run?)`:
 *
 * - calls `run(projectRoot)` to obtain the stdout of `npx expo config --json`
 *   (the runner is injectable so tests never spawn real Expo; the default
 *   runner shells out to `npx expo config --json`)
 * - parses that JSON and delegates field extraction to `extractLinkConfig`
 * - throws a clear error when the runner fails, or when stdout is not valid JSON
 *
 * The JSON below mirrors a real `expo config --json` payload: the ExpoConfig is
 * at the top level (no `expo` wrapper).
 */

const REAL_CONFIG_JSON = JSON.stringify({
  name: 'Draft',
  slug: 'draft',
  scheme: 'draft',
  ios: {
    bundleIdentifier: 'com.gr.draft',
    associatedDomains: ['applinks:staging.drafa.app'],
  },
  android: {
    package: 'com.gr.draft',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: [{ scheme: 'https', host: 'staging.drafa.app', pathPrefix: '/games' }],
      },
    ],
  },
  extra: { eas: { projectId: 'ignored' } },
});

describe('expoConfig', () => {
  it('parses the runner output into a LinkConfig', () => {
    const result = readLinkConfig('/some/project', () => REAL_CONFIG_JSON);

    const expected: LinkConfig = {
      schemes: ['draft'],
      ios: {
        bundleIdentifier: 'com.gr.draft',
        associatedDomains: ['applinks:staging.drafa.app'],
      },
      android: {
        package: 'com.gr.draft',
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            category: ['BROWSABLE', 'DEFAULT'],
            data: [{ scheme: 'https', host: 'staging.drafa.app', pathPrefix: '/games' }],
          },
        ],
      },
    };

    expect(result).toEqual(expected);
  });

  it('passes the project root to the runner', () => {
    let receivedRoot: string | undefined;
    readLinkConfig('/my/project/root', (root) => {
      receivedRoot = root;
      return REAL_CONFIG_JSON;
    });
    expect(receivedRoot).toBe('/my/project/root');
  });

  it('throws when stdout is not valid JSON', () => {
    expect(() => readLinkConfig('/some/project', () => 'not json at all')).toThrow();
  });

  it('throws when the runner itself fails (e.g. expo not installed)', () => {
    expect(() =>
      readLinkConfig('/some/project', () => {
        throw new Error('command not found: expo');
      }),
    ).toThrow();
  });
});
