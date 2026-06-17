import { describe, it, expect } from 'vitest';
import { parseRoutePath } from '../../src/routes/parseRoutePath.js';
import { routeHandlesPath } from '../../src/routes/routeHandlesPath.js';

/**
 * Contract for `routeHandlesPath(route, pathSegments)`:
 *
 * Given a route (with its static/dynamic/catchall `segments`) and a concrete
 * path already split into segments, return whether the route would handle it.
 *
 *   - a `static`   segment must equal the path segment
 *   - a `dynamic`  segment matches exactly one path segment
 *   - a `catchall` segment matches one-or-more trailing segments
 *   - the match only succeeds when the whole path is consumed (lengths line up)
 *
 * Pure: no config, no filesystem. Routes here are built with the (already
 * tested) `parseRoutePath` purely for readable fixtures.
 */

const route = (file: string) => parseRoutePath(file);

describe('routeHandlesPath', () => {
  describe('static segments', () => {
    it('matches an equal single segment', () => {
      expect(routeHandlesPath(route('games.tsx'), ['games'])).toBe(true);
    });

    it('rejects a different segment', () => {
      expect(routeHandlesPath(route('games.tsx'), ['shop'])).toBe(false);
    });

    it('rejects an extra trailing segment', () => {
      expect(routeHandlesPath(route('games.tsx'), ['games', '123'])).toBe(false);
    });

    it('matches a nested static path exactly', () => {
      expect(routeHandlesPath(route('shop/products/index.tsx'), ['shop', 'products'])).toBe(true);
    });
  });

  describe('root route', () => {
    it('handles the empty path', () => {
      expect(routeHandlesPath(route('index.tsx'), [])).toBe(true);
    });

    it('does not handle a non-empty path', () => {
      expect(routeHandlesPath(route('index.tsx'), ['x'])).toBe(false);
    });
  });

  describe('dynamic segments', () => {
    it('matches any single value', () => {
      expect(routeHandlesPath(route('[id].tsx'), ['anything'])).toBe(true);
    });

    it('matches a concrete value in a nested position', () => {
      expect(routeHandlesPath(route('games/[id].tsx'), ['games', '123'])).toBe(true);
    });

    it('still requires the static prefix to match', () => {
      expect(routeHandlesPath(route('games/[id].tsx'), ['shop', '123'])).toBe(false);
    });

    it('rejects a path that is too short', () => {
      expect(routeHandlesPath(route('games/[id].tsx'), ['games'])).toBe(false);
    });

    it('rejects a path that is too long', () => {
      expect(routeHandlesPath(route('games/[id].tsx'), ['games', '1', '2'])).toBe(false);
    });
  });

  describe('catch-all segments', () => {
    it('matches a single trailing segment', () => {
      expect(routeHandlesPath(route('blog/[...slug].tsx'), ['blog', 'a'])).toBe(true);
    });

    it('matches multiple trailing segments', () => {
      expect(routeHandlesPath(route('blog/[...slug].tsx'), ['blog', 'a', 'b', 'c'])).toBe(true);
    });

    it('requires at least one trailing segment', () => {
      expect(routeHandlesPath(route('blog/[...slug].tsx'), ['blog'])).toBe(false);
    });
  });

  describe('groups do not affect matching', () => {
    it('matches the path with the (group) stripped', () => {
      expect(routeHandlesPath(route('(tabs)/home.tsx'), ['home'])).toBe(true);
    });
  });

  describe('segment order is respected (static segments anywhere)', () => {
    it('matches a static segment that follows a dynamic one', () => {
      expect(routeHandlesPath(route('users/[id]/posts.tsx'), ['users', '42', 'posts'])).toBe(true);
    });

    it('rejects when a trailing static segment differs', () => {
      expect(routeHandlesPath(route('users/[id]/posts.tsx'), ['users', '42', 'comments'])).toBe(
        false,
      );
    });

    it('matches a static segment that follows a leading dynamic one', () => {
      expect(routeHandlesPath(route('[category]/featured.tsx'), ['shoes', 'featured'])).toBe(true);
    });

    it('rejects when the trailing static does not match after a leading dynamic', () => {
      expect(routeHandlesPath(route('[category]/featured.tsx'), ['shoes', 'sale'])).toBe(false);
    });

    it('matches a mid static (after a dynamic) with a trailing catch-all and extra segments', () => {
      expect(
        routeHandlesPath(route('users/[id]/files/[...rest].tsx'), [
          'users',
          '42',
          'files',
          'a',
          'b',
        ]),
      ).toBe(true);
    });

    it('rejects when that mid static differs in the catch-all case', () => {
      expect(
        routeHandlesPath(route('users/[id]/files/[...rest].tsx'), [
          'users',
          '42',
          'docs',
          'a',
          'b',
        ]),
      ).toBe(false);
    });
  });
});
