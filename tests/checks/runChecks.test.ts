import { describe, it, expect } from 'vitest';
import { runChecks } from '../../src/checks/runChecks.js';
import { parseRoutePath } from '../../src/routes/parseRoutePath.js';
import type { LinkTarget } from '../../src/types.js';

/**
 * `runChecks(routes, targets)` is the aggregation point for every static check.
 * v1 = DL001 (dead links) followed by DL002 (unreachable routes). Pure; the
 * single place future checks get added and the single thing the CLI calls.
 */

const route = (file: string) => parseRoutePath(file);
const target = (kind: LinkTarget['kind'], segments: string[]): LinkTarget => ({
  kind,
  segments,
  raw: `/${segments.join('/')}`,
});

describe('runChecks', () => {
  it('returns no findings for a clean project', () => {
    const routes = [route('index.tsx'), route('product/[id].tsx')];
    const targets = [target('exact', []), target('prefix', ['product'])];
    expect(runChecks(routes, targets)).toEqual([]);
  });

  it('aggregates DL001 then DL002, in that order', () => {
    // /product/[id] is the only route: the "ghost" target is dead (DL001),
    // and the route itself is reached by no target (DL002).
    const routes = [route('product/[id].tsx')];
    const targets = [target('exact', ['ghost'])];
    const findings = runChecks(routes, targets);
    expect(findings.map((f) => f.code)).toEqual(['DL001', 'DL002']);
    expect(findings.find((f) => f.code === 'DL001')?.target).toBe('/ghost');
    expect(findings.find((f) => f.code === 'DL002')?.route).toBe('/product/[id]');
  });

  it('includes every dead link and every unreachable route', () => {
    const routes = [route('a.tsx'), route('b.tsx')];
    const targets = [target('exact', ['x']), target('exact', ['y'])];
    // both targets dead (2x DL001), both routes unreachable (2x DL002)
    const findings = runChecks(routes, targets);
    expect(findings.filter((f) => f.code === 'DL001')).toHaveLength(2);
    expect(findings.filter((f) => f.code === 'DL002')).toHaveLength(2);
  });
});
