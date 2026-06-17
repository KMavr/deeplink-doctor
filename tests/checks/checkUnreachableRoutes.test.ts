import { describe, it, expect } from 'vitest';
import { checkUnreachableRoutes } from '../../src/checks/checkUnreachableRoutes.js';
import { parseRoutePath } from '../../src/routes/parseRoutePath.js';
import type { LinkTarget } from '../../src/types.js';

/**
 * DL002 (warn): a deep-linkable route that NO configured target can reach ->
 * an unreachable screen.
 *
 *   checkUnreachableRoutes(routes, targets) -> Finding[]
 *
 * The mirror of DL001: iterate the LINKABLE routes and fire when no target
 * matches (reusing `targetMatchesRoute`). Non-linkable routes (layouts, api,
 * `+special`) are never reported. Warn, not error — it is advisory by design.
 */

const route = (file: string) => parseRoutePath(file);
const target = (kind: LinkTarget['kind'], segments: string[]): LinkTarget => ({
  kind,
  segments,
  raw: `/${segments.join('/')}`,
});

describe('checkUnreachableRoutes (DL002)', () => {
  it('returns no findings when every linkable route is reached by a target', () => {
    const routes = [route('index.tsx'), route('product/[id].tsx'), route('settings/index.tsx')];
    const targets = [
      target('exact', []), // reaches "/"
      target('prefix', ['product']), // reaches "/product/[id]"
      target('exact', ['settings']), // reaches "/settings"
    ];
    expect(checkUnreachableRoutes(routes, targets)).toEqual([]);
  });

  it('flags a linkable route that no target reaches', () => {
    const findings = checkUnreachableRoutes(
      [route('product/[id].tsx')],
      [target('exact', ['other'])],
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      code: 'DL002',
      severity: 'warn',
      route: '/product/[id]',
    });
  });

  it('never reports non-linkable routes (layout, api, special)', () => {
    const routes = [
      route('_layout.tsx'),
      route('+not-found.tsx'),
      route('users+api.ts'),
      route('product/[id].tsx'), // the only linkable one
    ];
    const findings = checkUnreachableRoutes(routes, []); // no targets reach anything
    expect(findings.map((f) => f.route)).toEqual(['/product/[id]']);
  });

  it('counts a route reached only via a prefix target as reachable', () => {
    expect(
      checkUnreachableRoutes([route('product/[id].tsx')], [target('prefix', ['product'])]),
    ).toEqual([]);
  });

  it('counts a route reached only via a pattern target as reachable', () => {
    expect(
      checkUnreachableRoutes([route('blog/[...slug].tsx')], [target('pattern', ['blog', '.*'])]),
    ).toEqual([]);
  });

  it('flags every linkable route, in input order, when there are no targets', () => {
    const routes = [route('index.tsx'), route('product/[id].tsx'), route('settings/index.tsx')];
    const findings = checkUnreachableRoutes(routes, []);
    expect(findings.map((f) => f.route)).toEqual(['/', '/product/[id]', '/settings']);
    expect(findings.every((f) => f.code === 'DL002' && f.severity === 'warn')).toBe(true);
  });

  it('reports the unreachable route in the message', () => {
    const findings = checkUnreachableRoutes([route('product/[id].tsx')], []);
    expect(findings[0]?.message).toBe(
      'Route "/product/[id]" is not reachable by any configured link',
    );
  });

  it('returns no findings for an empty route list', () => {
    expect(checkUnreachableRoutes([], [target('exact', ['x'])])).toEqual([]);
  });
});
