import { describe, it, expect } from 'vitest';
import { checkDeadLinks } from '../../src/checks/checkDeadLinks.js';
import { parseRoutePath } from '../../src/routes/parseRoutePath.js';
import type { LinkTarget } from '../../src/types.js';

/**
 * DL001 (error): a link target advertised by the native config that NO route
 * can serve -> a dead link.
 *
 *   checkDeadLinks(routes, targets) -> Finding[]
 *
 * One finding per unmatched target, in input order, each naming the offending
 * `target.raw`. Matching is delegated to `targetMatchesRoute`, so these tests
 * focus on the check's own behaviour (which targets fire, shape, order).
 */

const route = (file: string) => parseRoutePath(file);
const target = (kind: LinkTarget['kind'], segments: string[]): LinkTarget => ({
  kind,
  segments,
  raw: `/${segments.join('/')}`,
});

const routes = [
  route('index.tsx'),
  route('product/[id].tsx'),
  route('blog/[...slug].tsx'),
  route('settings/index.tsx'),
];

describe('checkDeadLinks (DL001)', () => {
  it('returns no findings when every target is served by a route', () => {
    const targets = [
      target('exact', ['product', '42']),
      target('prefix', ['product']),
      target('pattern', ['blog', '.*']),
    ];
    expect(checkDeadLinks(routes, targets)).toEqual([]);
  });

  it('flags an exact target that matches no route', () => {
    const findings = checkDeadLinks(routes, [target('exact', ['ghost'])]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      code: 'DL001',
      severity: 'error',
      target: '/ghost',
    });
  });

  it('flags a prefix target that matches no route', () => {
    const findings = checkDeadLinks(routes, [target('prefix', ['nope'])]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.code).toBe('DL001');
    expect(findings[0]?.target).toBe('/nope');
  });

  it('flags a pattern target whose truncated head matches no route', () => {
    const findings = checkDeadLinks(routes, [target('pattern', ['ghost', '.*'])]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.target).toBe('/ghost/.*');
  });

  it('reports the offending target in the message', () => {
    const findings = checkDeadLinks(routes, [target('exact', ['ghost'])]);
    expect(findings[0]?.message).toBe('No route handles deep link target "/ghost"');
  });

  it('emits one finding per unmatched target, preserving input order', () => {
    const targets = [
      target('exact', ['product', '42']), // matched -> no finding
      target('exact', ['ghost']), // unmatched
      target('prefix', ['nope']), // unmatched
    ];
    const findings = checkDeadLinks(routes, targets);
    expect(findings.map((f) => f.target)).toEqual(['/ghost', '/nope']);
  });

  it('returns no findings for an empty target list', () => {
    expect(checkDeadLinks(routes, [])).toEqual([]);
  });

  it('flags every target when there are no routes', () => {
    const targets = [target('exact', ['a']), target('prefix', ['b'])];
    const findings = checkDeadLinks([], targets);
    expect(findings.map((f) => f.target)).toEqual(['/a', '/b']);
    expect(findings.every((f) => f.code === 'DL001' && f.severity === 'error')).toBe(true);
  });
});
