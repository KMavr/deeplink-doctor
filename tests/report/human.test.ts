import { describe, it, expect } from 'vitest';
import { FINDING_EXPLANATIONS } from '../../src/config/findingExplanations.js';
import { renderRoutes, renderFindings } from '../../src/report/human.js';
import type { Finding, PathData } from '../../src/types.js';

const route = (over: Partial<PathData> = {}): PathData => ({
  pathname: '/',
  filePath: 'index.tsx',
  segments: [],
  isLayout: false,
  inGroup: false,
  isApi: false,
  isSpecial: false,
  ...over,
});

describe('renderRoutes', () => {
  it('reports when there are no routes', () => {
    expect(renderRoutes([])).toContain('No routes found');
  });

  it('lists routes under a count header', () => {
    const out = renderRoutes([route({ pathname: '/home', filePath: 'home.tsx' })]);
    expect(out).toContain('Routes (1)');
    expect(out).toContain('/home');
    expect(out).toContain('home.tsx');
  });

  it('tags dynamic, catch-all, and group routes', () => {
    const out = renderRoutes([
      route({
        pathname: '/p/[id]',
        filePath: 'p/[id].tsx',
        segments: [
          { kind: 'static', value: 'p' },
          { kind: 'dynamic', value: 'id' },
        ],
      }),
      route({
        pathname: '/b/[...slug]',
        filePath: 'b/[...slug].tsx',
        segments: [{ kind: 'catchall', value: 'slug' }],
      }),
      route({ pathname: '/home', filePath: '(tabs)/home.tsx', inGroup: true }),
    ]);

    expect(out).toContain('dynamic');
    expect(out).toContain('catchall');
    expect(out).toContain('group');
  });

  it('separates non-link-target routes (layout/special/api)', () => {
    const out = renderRoutes([route({ filePath: '_layout.tsx', isLayout: true })]);
    expect(out).toContain('Not link targets');
    expect(out).toContain('layout');
  });
});

const finding = (over: Partial<Finding> = {}): Finding => ({
  code: 'DL001',
  severity: 'error',
  message: 'something is wrong',
  ...over,
});

describe('renderFindings', () => {
  it('reports a clean success message when there are no findings', () => {
    expect(renderFindings([])).toContain('No deep-link issues found');
  });

  it('shows each finding code and message, in order', () => {
    const out = renderFindings([
      finding({ code: 'DL001', message: 'No route handles "/ghost"', target: '/ghost' }),
      finding({
        code: 'DL002',
        severity: 'warn',
        message: 'Route "/x" is not reachable',
        route: '/x',
      }),
    ]);
    expect(out).toContain('DL001');
    expect(out).toContain('No route handles "/ghost"');
    expect(out).toContain('DL002');
    expect(out).toContain('Route "/x" is not reachable');
    expect(out.indexOf('DL001')).toBeLessThan(out.indexOf('DL002'));
  });

  it('summarizes counts with sensible pluralization', () => {
    const out = renderFindings([
      finding({ severity: 'error' }),
      finding({ severity: 'warn' }),
      finding({ severity: 'warn' }),
    ]);
    expect(out).toContain('3 issues (1 error, 2 warnings)');
  });

  it('uses singular nouns for single counts', () => {
    const out = renderFindings([finding({ severity: 'error' })]);
    expect(out).toContain('1 issue (1 error, 0 warnings)');
  });

  // explanations are word-wrapped, so collapse whitespace before matching the paragraph
  const flat = (s: string) => s.replace(/\s+/g, ' ');

  it('appends each finding’s explanation when explain is true', () => {
    const out = renderFindings([finding({ code: 'DL001' })], [], true);
    expect(flat(out)).toContain(flat(FINDING_EXPLANATIONS.DL001));
  });

  it('appends the explanation matching each finding’s own code', () => {
    const out = renderFindings(
      [finding({ code: 'DL001' }), finding({ code: 'DL002', severity: 'warn' })],
      [],
      true,
    );
    expect(flat(out)).toContain(flat(FINDING_EXPLANATIONS.DL001));
    expect(flat(out)).toContain(flat(FINDING_EXPLANATIONS.DL002));
  });

  it('omits explanations by default', () => {
    const out = renderFindings([finding({ code: 'DL001' })]);
    expect(flat(out)).not.toContain(flat(FINDING_EXPLANATIONS.DL001));
  });
});
