import { describe, it, expect } from 'vitest';
import { renderHuman } from '../../src/report/renderHuman.js';
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

describe('renderHuman', () => {
  it('reports when there are no routes', () => {
    expect(renderHuman([])).toContain('No routes found');
  });

  it('lists routes under a count header', () => {
    const out = renderHuman([route({ pathname: '/home', filePath: 'home.tsx' })]);
    expect(out).toContain('Routes (1)');
    expect(out).toContain('/home');
    expect(out).toContain('home.tsx');
  });

  it('tags dynamic, catch-all, and group routes', () => {
    const out = renderHuman([
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
    const out = renderHuman([route({ filePath: '_layout.tsx', isLayout: true })]);
    expect(out).toContain('Not link targets');
    expect(out).toContain('layout');
  });
});
