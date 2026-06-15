import { describe, it, expect } from 'vitest';
import { renderJson } from '../../src/report/renderJson.js';
import type { PathData } from '../../src/types.js';

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

describe('renderJson', () => {
  it('returns valid JSON containing a summary and the routes', () => {
    const out = renderJson([route(), route({ filePath: '_layout.tsx', isLayout: true })]);
    const parsed = JSON.parse(out);

    expect(parsed.routes).toHaveLength(2);
    expect(parsed.summary.total).toBe(2);
  });

  it('counts only linkable routes in summary.linkable', () => {
    const out = renderJson([
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
