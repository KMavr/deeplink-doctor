import { describe, it, expect } from 'vitest';
import { runCheck } from '../../src/commands/check.js';
import { parseRoutePath } from '../../src/routes/parseRoutePath.js';
import type { IntentFilterData, LinkConfig, PathData } from '../../src/types.js';

/**
 * `runCheck(root, deps, options)` orchestrates the `check` command with its
 * readers INJECTED, so the full clean/dirty/strict/json/error matrix is
 * exercised here without ever spawning `npx expo` or touching the filesystem.
 */

// config-hygiene valid (has package) so these reconcile-focused tests aren't
// polluted by DL1xx findings; config checks have their own suites.
const config = (data: IntentFilterData[]): LinkConfig => ({
  schemes: [],
  ios: { associatedDomains: [] },
  android: { package: 'com.x.app', intentFilters: [{ data }] },
});

// deps where the readers just return canned models
const deps = (routes: PathData[], linkConfig: LinkConfig) => ({
  readRoutes: () => routes,
  readLinkConfig: () => linkConfig,
});

const route = (file: string) => parseRoutePath(file);

describe('runCheck', () => {
  it('clean project: exit 0 with a success report', () => {
    const result = runCheck(
      '/root',
      deps([route('product/[id].tsx')], config([{ pathPrefix: '/product' }])),
      {},
    );
    expect(result.exitCode).toBe(0);
    expect(result.report).toContain('No deep-link issues');
  });

  it('an error finding (dead link) yields exit 1', () => {
    const result = runCheck(
      '/root',
      deps([route('product/[id].tsx')], config([{ path: '/ghost' }])),
      {},
    );
    expect(result.exitCode).toBe(1);
    expect(result.report).toContain('DL001');
  });

  it('warning-only findings are advisory: exit 0 without --strict', () => {
    // prefix /product reaches product/[id] (no DL001); /settings is unreachable (DL002 warn)
    const result = runCheck(
      '/root',
      deps(
        [route('product/[id].tsx'), route('settings/index.tsx')],
        config([{ pathPrefix: '/product' }]),
      ),
      {},
    );
    expect(result.exitCode).toBe(0);
    expect(result.report).toContain('DL002');
  });

  it('--strict promotes warning-only findings to exit 1', () => {
    const result = runCheck(
      '/root',
      deps(
        [route('product/[id].tsx'), route('settings/index.tsx')],
        config([{ pathPrefix: '/product' }]),
      ),
      { strict: true },
    );
    expect(result.exitCode).toBe(1);
  });

  it('--json emits the machine schema', () => {
    const result = runCheck(
      '/root',
      deps([route('product/[id].tsx')], config([{ path: '/ghost' }])),
      { json: true },
    );
    const parsed = JSON.parse(result.report);
    expect(parsed.summary).toMatchObject({ errors: 1 });
    expect(parsed.findings.some((f: { code: string }) => f.code === 'DL001')).toBe(true);
  });

  it('a failing config reader yields exit 2 with the error message', () => {
    const result = runCheck(
      '/root',
      {
        readRoutes: () => [route('index.tsx')],
        readLinkConfig: () => {
          throw new Error('Failed to read Expo config');
        },
      },
      {},
    );
    expect(result.exitCode).toBe(2);
    expect(result.report).toContain('Failed to read Expo config');
  });

  it('a failing route reader also yields exit 2', () => {
    const result = runCheck(
      '/root',
      {
        readRoutes: () => {
          throw new Error('no app/ directory');
        },
        readLinkConfig: () => config([]),
      },
      {},
    );
    expect(result.exitCode).toBe(2);
    expect(result.report).toContain('no app/ directory');
  });

  it('surfaces config-hygiene findings (DL101) alongside reconcile findings', () => {
    // a malformed associatedDomains entry is a config-level error; it must reach
    // the report, which proves checkConfig is wired into runCheck.
    const linkConfig: LinkConfig = {
      schemes: [],
      ios: { bundleIdentifier: 'com.x.app', associatedDomains: ['bad.com'] },
      android: { package: 'com.x.app', intentFilters: [] },
    };
    const result = runCheck('/root', deps([route('index.tsx')], linkConfig), {});
    expect(result.report).toContain('DL101');
    expect(result.exitCode).toBe(1);
  });
});
