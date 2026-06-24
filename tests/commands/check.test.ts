import { describe, it, expect, vi } from 'vitest';
import { runCheck } from '../../src/commands/check.js';
import { parseRoutePath } from '../../src/routes/parseRoutePath.js';
import type {
  Associations,
  Finding,
  IntentFilterData,
  LinkConfig,
  PathData,
  SuppressionRule,
} from '../../src/types.js';

/**
 * `runCheck(root, deps, options)` orchestrates the `check` command with its
 * readers INJECTED, so the full clean/dirty/strict/json/error matrix is
 * exercised here without ever spawning `npx expo` or touching the filesystem.
 *
 * The network layer is opt-in: with `--remote` it calls the injected
 * `loadAssociations` (DL201) and runs `checkRemote` (DL2xx). Without it, no
 * domain is ever probed — proven by the gating tests below.
 */

// config-hygiene valid (has package) so these reconcile-focused tests aren't
// polluted by DL1xx findings; config checks have their own suites.
const config = (data: IntentFilterData[]): LinkConfig => ({
  schemes: [],
  ios: { associatedDomains: [] },
  android: { package: 'com.x.app', intentFilters: [{ data }] },
});

const noAssociations: Associations = { aasa: { appIDs: [] }, assetlinks: [], findings: [] };

// deps where the readers just return canned models; loadAssociations defaults
// to a no-op (it is never reached unless a test sets --remote).
const deps = (
  routes: PathData[],
  linkConfig: LinkConfig,
  rules: SuppressionRule[] = [],
  loadAssociations: (domain: string) => Promise<Associations> = () =>
    Promise.resolve(noAssociations),
) => ({
  readRoutes: () => routes,
  readLinkConfig: () => linkConfig,
  readSuppressionConfig: () => rules,
  loadAssociations,
});

const route = (file: string) => parseRoutePath(file);

describe('runCheck (static)', () => {
  it('clean project: exit 0 with a success report', async () => {
    const result = await runCheck(
      '/root',
      deps([route('product/[id].tsx')], config([{ pathPrefix: '/product' }])),
      {},
    );
    expect(result.exitCode).toBe(0);
    expect(result.report).toContain('No deep-link issues');
  });

  it('an error finding (dead link) yields exit 1', async () => {
    const result = await runCheck(
      '/root',
      deps([route('product/[id].tsx')], config([{ path: '/ghost' }])),
      {},
    );
    expect(result.exitCode).toBe(1);
    expect(result.report).toContain('DL001');
  });

  it('warning-only findings are advisory: exit 0 without --strict', async () => {
    // prefix /product reaches product/[id] (no DL001); /settings is unreachable (DL002 warn)
    const result = await runCheck(
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

  it('--strict promotes warning-only findings to exit 1', async () => {
    const result = await runCheck(
      '/root',
      deps(
        [route('product/[id].tsx'), route('settings/index.tsx')],
        config([{ pathPrefix: '/product' }]),
      ),
      { strict: true },
    );
    expect(result.exitCode).toBe(1);
  });

  it('--json emits the machine schema', async () => {
    const result = await runCheck(
      '/root',
      deps([route('product/[id].tsx')], config([{ path: '/ghost' }])),
      { json: true },
    );
    const parsed = JSON.parse(result.report);
    expect(parsed.summary).toMatchObject({ errors: 1 });
    expect(parsed.findings.some((f: { code: string }) => f.code === 'DL001')).toBe(true);
  });

  it('a failing config reader yields exit 2 with the error message', async () => {
    const result = await runCheck(
      '/root',
      {
        readRoutes: () => [route('index.tsx')],
        readLinkConfig: () => {
          throw new Error('Failed to read Expo config');
        },
        readSuppressionConfig: () => [],
        loadAssociations: () => Promise.resolve(noAssociations),
      },
      {},
    );
    expect(result.exitCode).toBe(2);
    expect(result.report).toContain('Failed to read Expo config');
  });

  it('a failing route reader also yields exit 2', async () => {
    const result = await runCheck(
      '/root',
      {
        readRoutes: () => {
          throw new Error('no app/ directory');
        },
        readLinkConfig: () => config([]),
        readSuppressionConfig: () => [],
        loadAssociations: () => Promise.resolve(noAssociations),
      },
      {},
    );
    expect(result.exitCode).toBe(2);
    expect(result.report).toContain('no app/ directory');
  });

  it('surfaces config-hygiene findings (DL101) alongside reconcile findings', async () => {
    const linkConfig: LinkConfig = {
      schemes: [],
      ios: { bundleIdentifier: 'com.x.app', associatedDomains: ['bad.com'] },
      android: { package: 'com.x.app', intentFilters: [] },
    };
    const result = await runCheck('/root', deps([route('index.tsx')], linkConfig), {});
    expect(result.report).toContain('DL101');
    expect(result.exitCode).toBe(1);
  });

  it('a rule suppressing the only error drops it from the report and exits 0', async () => {
    const linkConfig: LinkConfig = {
      schemes: [],
      ios: { bundleIdentifier: 'com.x.app', associatedDomains: ['bad.com'] }, // DL101 error
      android: { package: 'com.x.app', intentFilters: [] },
    };
    const rules: SuppressionRule[] = [{ code: 'DL101', reason: 'legacy', owner: 'kmavr' }];
    const result = await runCheck('/root', deps([route('index.tsx')], linkConfig, rules), {});
    expect(result.report).not.toContain('DL101');
    expect(result.report).toContain('1 suppressed');
    expect(result.exitCode).toBe(0);
  });
});

// A config with valid identifiers and no intentFilter targets: the static side
// is clean, so every finding in these tests comes from the remote layer.
const remoteConfig: LinkConfig = {
  schemes: [],
  ios: { bundleIdentifier: 'com.x.app', associatedDomains: ['applinks:example.com'] },
  android: { package: 'com.x.app', intentFilters: [] },
};

const cleanAssoc: Associations = {
  aasa: { appIDs: ['TEAM.com.x.app'] },
  assetlinks: [{ packageName: 'com.x.app', fingerprints: ['AA'] }],
  findings: [],
};

const dl201: Finding = {
  code: 'DL201',
  severity: 'error',
  message: 'unreachable',
  target: 'https://example.com/.well-known/apple-app-site-association',
};

describe('runCheck (--remote)', () => {
  it('clean static + clean remote: exit 0 with a success report', async () => {
    const result = await runCheck(
      '/root',
      deps([], remoteConfig, [], () => Promise.resolve(cleanAssoc)),
      { remote: true },
    );
    expect(result.exitCode).toBe(0);
    expect(result.report).toContain('No deep-link issues');
  });

  it('surfaces a DL201 raised by loadAssociations (exit 1)', async () => {
    const result = await runCheck(
      '/root',
      deps([], remoteConfig, [], () => Promise.resolve({ ...cleanAssoc, findings: [dl201] })),
      { remote: true },
    );
    expect(result.exitCode).toBe(1);
    expect(result.report).toContain('DL201');
  });

  it('runs checkRemote against the resolved config (DL202 -> exit 1)', async () => {
    const result = await runCheck(
      '/root',
      deps([], remoteConfig, [], () =>
        Promise.resolve({ ...cleanAssoc, aasa: { appIDs: ['TEAM.com.other'] } }),
      ),
      { remote: true },
    );
    expect(result.exitCode).toBe(1);
    expect(result.report).toContain('DL202');
  });

  it('probes each domain derived from the config', async () => {
    const spy = vi.fn(() => Promise.resolve(cleanAssoc));
    await runCheck('/root', deps([], remoteConfig, [], spy), { remote: true });
    expect(spy).toHaveBeenCalledWith('example.com');
  });

  it('--domain overrides the derived domain set', async () => {
    const spy = vi.fn(() => Promise.resolve(cleanAssoc));
    await runCheck('/root', deps([], remoteConfig, [], spy), {
      remote: true,
      domain: 'override.com',
    });
    expect(spy).toHaveBeenCalledWith('override.com');
    expect(spy).not.toHaveBeenCalledWith('example.com');
  });

  it('--json includes remote findings', async () => {
    const result = await runCheck(
      '/root',
      deps([], remoteConfig, [], () =>
        Promise.resolve({ ...cleanAssoc, aasa: { appIDs: ['TEAM.com.other'] } }),
      ),
      { remote: true, json: true },
    );
    const parsed = JSON.parse(result.report);
    expect(parsed.findings.some((f: { code: string }) => f.code === 'DL202')).toBe(true);
  });

  it('a rule suppressing the only remote error drops it and exits 0', async () => {
    const rules: SuppressionRule[] = [
      { code: 'DL202', reason: 'pending hosting fix', owner: 'kmavr' },
    ];
    const result = await runCheck(
      '/root',
      deps([], remoteConfig, rules, () =>
        Promise.resolve({ ...cleanAssoc, aasa: { appIDs: ['TEAM.com.other'] } }),
      ),
      { remote: true },
    );
    expect(result.report).not.toContain('DL202');
    expect(result.report).toContain('1 suppressed');
    expect(result.exitCode).toBe(0);
  });

  it('a remote warning (DL204) is advisory without --strict, fails with it', async () => {
    const emptyFingerprints = () =>
      Promise.resolve({
        ...cleanAssoc,
        assetlinks: [{ packageName: 'com.x.app', fingerprints: [] }],
      });
    const advisory = await runCheck('/root', deps([], remoteConfig, [], emptyFingerprints), {
      remote: true,
    });
    expect(advisory.exitCode).toBe(0);
    expect(advisory.report).toContain('DL204');

    const strict = await runCheck('/root', deps([], remoteConfig, [], emptyFingerprints), {
      remote: true,
      strict: true,
    });
    expect(strict.exitCode).toBe(1);
  });

  it('without --remote, the network is never touched even when domains exist', async () => {
    const spy = vi.fn(() =>
      Promise.resolve({ ...cleanAssoc, aasa: { appIDs: ['TEAM.com.other'] } }),
    );
    const result = await runCheck('/root', deps([], remoteConfig, [], spy), {});
    expect(spy).not.toHaveBeenCalled();
    expect(result.report).not.toContain('DL202');
    expect(result.exitCode).toBe(0);
  });

  it('--domain without --remote is a no-op (still no network)', async () => {
    const spy = vi.fn(() => Promise.resolve(cleanAssoc));
    await runCheck('/root', deps([], remoteConfig, [], spy), { domain: 'override.com' });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('runCheck (--silent)', () => {
  it('hides warnings and exits 0 when only warnings remain', async () => {
    const result = await runCheck(
      '/root',
      deps(
        [route('product/[id].tsx'), route('settings/index.tsx')],
        config([{ pathPrefix: '/product' }]),
      ),
      { silent: true },
    );
    expect(result.exitCode).toBe(0);
    expect(result.report).not.toContain('DL002');
    expect(result.report).toContain('No deep-link issues');
  });

  it('still shows errors and exits 1', async () => {
    const result = await runCheck(
      '/root',
      deps(
        [route('product/[id].tsx'), route('settings/index.tsx')],
        config([{ path: '/ghost' }, { pathPrefix: '/product' }]),
      ),
      { silent: true },
    );
    expect(result.exitCode).toBe(1);
    expect(result.report).toContain('DL001');
    expect(result.report).not.toContain('DL002');
  });

  it('--strict overrides --silent: warnings stay and fail', async () => {
    const result = await runCheck(
      '/root',
      deps(
        [route('product/[id].tsx'), route('settings/index.tsx')],
        config([{ pathPrefix: '/product' }]),
      ),
      { silent: true, strict: true },
    );
    expect(result.exitCode).toBe(1);
    expect(result.report).toContain('DL002');
  });
});
