import { describe, it, expect } from 'vitest';
import { renderRoutes, renderFindings } from '../../src/report/json.js';
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
  it('returns valid JSON containing a summary and the routes', () => {
    const out = renderRoutes([route(), route({ filePath: '_layout.tsx', isLayout: true })]);
    const parsed = JSON.parse(out);

    expect(parsed.routes).toHaveLength(2);
    expect(parsed.summary.total).toBe(2);
  });

  it('counts only linkable routes in summary.linkable', () => {
    const out = renderRoutes([
      route(),
      route({ isApi: true }),
      route({ isSpecial: true }),
      route({ isLayout: true }),
    ]);
    const parsed = JSON.parse(out);

    expect(parsed.summary.total).toBe(4);
    expect(parsed.summary.linkable).toBe(1);
  });
});

const finding = (over: Partial<Finding> = {}): Finding => ({
  code: 'DL001',
  severity: 'error',
  message: 'something is wrong',
  ...over,
});

describe('renderFindings', () => {
  it('returns a summary with total/errors/warnings and the findings', () => {
    const out = renderFindings([
      finding({ severity: 'error', target: '/ghost' }),
      finding({ code: 'DL002', severity: 'warn', route: '/x' }),
    ]);
    const parsed = JSON.parse(out);

    expect(parsed.summary).toEqual({ total: 2, errors: 1, warnings: 1, suppressed: 0 });
    expect(parsed.findings).toHaveLength(2);
  });

  it('reports the suppressed count when given one', () => {
    const parsed = JSON.parse(renderFindings([finding()], 3));
    expect(parsed.summary.suppressed).toBe(3);
  });

  it('preserves finding order and fields verbatim', () => {
    const findings: Finding[] = [
      finding({ code: 'DL001', severity: 'error', message: 'dead', target: '/ghost' }),
    ];
    const parsed = JSON.parse(renderFindings(findings));

    expect(parsed.findings[0]).toEqual({
      code: 'DL001',
      severity: 'error',
      message: 'dead',
      target: '/ghost',
    });
    // the unused optional key is absent, not serialized as undefined
    expect('route' in parsed.findings[0]).toBe(false);
  });

  it('returns zeroed summary and empty list for no findings', () => {
    const parsed = JSON.parse(renderFindings([]));
    expect(parsed).toEqual({
      summary: { total: 0, errors: 0, warnings: 0, suppressed: 0 },
      findings: [],
    });
  });
});
