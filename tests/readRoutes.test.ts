import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll } from 'vitest';
import { parseRoutes } from '../src/parsers/routes.js';
import type { PathData } from '../src/types.js';

/**
 * Contract for `parseRoutes(projectRoot)`:
 *
 * - finds the route folder at `<root>/app` or, failing that, `<root>/src/app`
 * - walks it recursively, keeping only route files (.tsx/.ts/.jsx/.js)
 *   and skipping .d.ts and non-code files (.md, images, …)
 * - runs each file through `parseRoutePath`, with a path relative to the
 *   route folder and `/` separators (no leading `app/`)
 * - returns the routes sorted by `filePath` (localeCompare, ascending) so the
 *   output is deterministic
 * - throws when neither `app/` nor `src/app/` exists
 *
 * Fixtures live under tests/fixtures/<scenario>/ — the file *contents* are
 * irrelevant; only their paths matter.
 */

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => join(here, 'fixtures', name);

const sortedByFilePath = (paths: string[]) => [...paths].sort((a, b) => a.localeCompare(b));

describe('parseRoutes', () => {
  it('discovers every route file under app/, sorted, excluding non-routes', () => {
    const routes = parseRoutes(fixture('basic-app'));

    expect(routes.map((r) => r.filePath)).toEqual(
      sortedByFilePath([
        '(tabs)/home.tsx',
        '+not-found.tsx',
        '_layout.tsx',
        'blog/[...slug].tsx',
        'index.tsx',
        'settings/[id].tsx',
        'settings/index.tsx',
        'shop/products/[id].tsx',
        'users+api.ts',
      ]),
    );
  });

  it('excludes .d.ts and non-code files', () => {
    const files = parseRoutes(fixture('basic-app')).map((r) => r.filePath);
    expect(files).not.toContain('global.d.ts');
    expect(files).not.toContain('README.md');
  });

  it('falls back to src/app when there is no top-level app/', () => {
    const routes = parseRoutes(fixture('src-app'));
    expect(routes.map((r) => r.filePath)).toEqual(sortedByFilePath(['about.tsx', 'index.tsx']));
  });

  it('throws when neither app/ nor src/app/ exists', () => {
    expect(() => parseRoutes(fixture('no-app'))).toThrow();
  });

  describe('delegates parsing correctly (spot-checks per route kind)', () => {
    let byPath: Record<string, PathData>;

    beforeAll(() => {
      byPath = Object.fromEntries(parseRoutes(fixture('basic-app')).map((r) => [r.filePath, r]));
    });

    it('computes nested dynamic pathnames', () => {
      expect(byPath['shop/products/[id].tsx'].pathname).toBe('/shop/products/[id]');
    });

    it('keeps catch-all segments', () => {
      expect(byPath['blog/[...slug].tsx'].segments.at(-1)).toEqual({
        kind: 'catchall',
        value: 'slug',
      });
    });

    it('drops the (group) from the path', () => {
      expect(byPath['(tabs)/home.tsx'].pathname).toBe('/home');
      expect(byPath['(tabs)/home.tsx'].inGroup).toBe(true);
    });

    it('flags layout, special, and api files', () => {
      expect(byPath['_layout.tsx'].isLayout).toBe(true);
      expect(byPath['+not-found.tsx'].isSpecial).toBe(true);
      expect(byPath['users+api.ts'].isApi).toBe(true);
    });
  });
});
