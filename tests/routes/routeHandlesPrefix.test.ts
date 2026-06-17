import { describe, it, expect } from 'vitest';
import { parseRoutePath } from '../../src/routes/parseRoutePath.js';
import { routeHandlesPrefix } from '../../src/routes/routeHandlesPrefix.js';

/**
 * Contract for `routeHandlesPrefix(route, prefixSegments)`:
 *
 * Sibling of `routeHandlesPath`. Where that answers "does this route handle
 * this *concrete* path?", this answers "can this route serve *some* path that
 * *begins with* these segments?" — the question an open-ended Android
 * `pathPrefix` (and, later, a truncated `pathPattern`) actually asks.
 *
 * Walk the prefix segment-by-segment against the route segment at the same index:
 *   - route ran out of segments  -> match only if the route's last segment is
 *     `catchall` (it absorbs the rest); otherwise no
 *   - route segment is `catchall` -> match (absorbs this segment and all after)
 *   - `static`  -> must equal the prefix segment, else no
 *   - `dynamic` -> matches this prefix segment, continue
 * Prefix fully consumed -> match (the route may legitimately extend past it).
 *
 * Pure: routes are built with the (already tested) `parseRoutePath` purely for
 * readable fixtures.
 */

const route = (file: string) => parseRoutePath(file);

describe('routeHandlesPrefix', () => {
  describe('empty prefix', () => {
    it('matches any route (a "/" prefix is a prefix of every path)', () => {
      expect(routeHandlesPrefix(route('index.tsx'), [])).toBe(true);
      expect(routeHandlesPrefix(route('product/[id].tsx'), [])).toBe(true);
      expect(routeHandlesPrefix(route('blog/[...slug].tsx'), [])).toBe(true);
    });
  });

  describe('prefix shorter than the route', () => {
    it('matches a dynamic detail route under the prefix', () => {
      expect(routeHandlesPrefix(route('product/[id].tsx'), ['product'])).toBe(true);
    });

    it('matches the index route at exactly the prefix', () => {
      expect(routeHandlesPrefix(route('product/index.tsx'), ['product'])).toBe(true);
    });

    it('rejects an unrelated static route', () => {
      expect(routeHandlesPrefix(route('settings/index.tsx'), ['product'])).toBe(false);
    });

    it('matches when the route continues past the prefix with a static segment', () => {
      expect(routeHandlesPrefix(route('product/sale.tsx'), ['product'])).toBe(true);
    });

    it('matches when the route continues past the prefix with a dynamic segment', () => {
      expect(routeHandlesPrefix(route('users/[id]/posts.tsx'), ['users'])).toBe(true);
    });

    it('matches a prefix that stops part-way through a deeper static route', () => {
      expect(routeHandlesPrefix(route('shop/products/index.tsx'), ['shop'])).toBe(true);
    });

    it('rejects when a static segment within the prefix range differs', () => {
      expect(routeHandlesPrefix(route('shop/products/index.tsx'), ['blog'])).toBe(false);
    });
  });

  describe('prefix as long as the route', () => {
    it('lets a dynamic segment satisfy a concrete prefix segment', () => {
      expect(routeHandlesPrefix(route('product/[id].tsx'), ['product', 'reviews'])).toBe(true);
    });

    it('rejects when a static segment differs', () => {
      expect(routeHandlesPrefix(route('product/[id].tsx'), ['blog', '1'])).toBe(false);
    });
  });

  describe('prefix longer than the route', () => {
    it('rejects when the route cannot extend that far (no catch-all)', () => {
      expect(routeHandlesPrefix(route('product/index.tsx'), ['product', 'reviews'])).toBe(false);
    });
  });

  describe('catch-all routes absorb the rest of the prefix', () => {
    it('matches a prefix that stops before the catch-all', () => {
      expect(routeHandlesPrefix(route('product/[...rest].tsx'), ['product'])).toBe(true);
    });

    it('matches a prefix that reaches into the catch-all', () => {
      expect(routeHandlesPrefix(route('product/[...rest].tsx'), ['product', 'x'])).toBe(true);
    });

    it('matches a prefix longer than the route via the catch-all', () => {
      expect(routeHandlesPrefix(route('product/[...rest].tsx'), ['product', 'x', 'y', 'z'])).toBe(
        true,
      );
    });

    it('still requires the static prefix before the catch-all to match', () => {
      expect(routeHandlesPrefix(route('product/[...rest].tsx'), ['blog'])).toBe(false);
    });
  });

  describe('mixed segments, order respected', () => {
    it('matches a static-after-dynamic prefix', () => {
      expect(routeHandlesPrefix(route('users/[id]/posts.tsx'), ['users', '42', 'posts'])).toBe(
        true,
      );
    });

    it('rejects when a trailing static prefix segment differs', () => {
      expect(routeHandlesPrefix(route('users/[id]/posts.tsx'), ['users', '42', 'comments'])).toBe(
        false,
      );
    });

    it('matches up to a mid catch-all and absorbs the rest', () => {
      expect(
        routeHandlesPrefix(route('users/[id]/files/[...rest].tsx'), ['users', '42', 'files', 'a']),
      ).toBe(true);
    });

    it('rejects when a static before the catch-all differs', () => {
      expect(
        routeHandlesPrefix(route('users/[id]/files/[...rest].tsx'), ['users', '42', 'docs']),
      ).toBe(false);
    });
  });

  describe('groups do not affect matching', () => {
    it('matches the prefix with the (group) stripped', () => {
      expect(routeHandlesPrefix(route('(tabs)/home.tsx'), ['home'])).toBe(true);
    });
  });
});
