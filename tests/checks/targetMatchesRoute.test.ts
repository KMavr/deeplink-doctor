import { describe, it, expect } from 'vitest';
import { targetMatchesRoute } from '../../src/checks/targetMatchesRoute.js';
import { parseRoutePath } from '../../src/routes/parseRoutePath.js';
import type { LinkTarget } from '../../src/types.js';

/**
 * Contract for `targetMatchesRoute(route, target)`:
 *
 * Pure dispatcher that answers "can this route serve this advertised target?"
 * by routing on `target.kind`:
 *   - `exact`   -> routeHandlesPath   (concrete path; lengths must line up)
 *   - `prefix`  -> routeHandlesPrefix (open-ended; route may extend past it)
 *   - `pattern` -> routeHandlesPrefix on the segments truncated at the first
 *                  segment containing a glob char (`.` or `*`); a pattern with
 *                  no glob behaves like a full prefix.
 *
 * The point of these tests is the *dispatch*, not re-testing the matchers —
 * so each kind is checked against the same segments where exact/prefix diverge.
 */

const route = (file: string) => parseRoutePath(file);
const target = (kind: LinkTarget['kind'], segments: string[]): LinkTarget => ({
  kind,
  segments,
  raw: `/${segments.join('/')}`,
});

describe('targetMatchesRoute', () => {
  describe('exact -> routeHandlesPath (lengths must line up)', () => {
    it('matches a concrete path against a dynamic route', () => {
      expect(targetMatchesRoute(route('games/[id].tsx'), target('exact', ['games', '123']))).toBe(
        true,
      );
    });

    it('rejects a shorter path that a prefix would have accepted', () => {
      // discriminates exact from prefix: same segments, prefix would be true
      expect(targetMatchesRoute(route('games/[id].tsx'), target('exact', ['games']))).toBe(false);
    });

    it('rejects an unrelated path', () => {
      expect(targetMatchesRoute(route('games/[id].tsx'), target('exact', ['shop', '1']))).toBe(
        false,
      );
    });
  });

  describe('prefix -> routeHandlesPrefix (open-ended)', () => {
    it('matches a route that extends past the prefix', () => {
      expect(targetMatchesRoute(route('product/[id].tsx'), target('prefix', ['product']))).toBe(
        true,
      );
    });

    it('rejects an unrelated prefix', () => {
      expect(targetMatchesRoute(route('product/[id].tsx'), target('prefix', ['blog']))).toBe(false);
    });
  });

  describe('pattern -> prefix on segments truncated at the first glob', () => {
    it('truncates a trailing ".*" and prefix-matches the head', () => {
      expect(
        targetMatchesRoute(route('product/[id].tsx'), target('pattern', ['product', '.*'])),
      ).toBe(true);
    });

    it('rejects when the literal head does not match', () => {
      expect(
        targetMatchesRoute(route('settings/index.tsx'), target('pattern', ['product', '.*'])),
      ).toBe(false);
    });

    it('matches everything when the glob is in the first segment', () => {
      expect(targetMatchesRoute(route('anything/deep/[id].tsx'), target('pattern', ['.*']))).toBe(
        true,
      );
    });

    it('treats a star-glob the same as a dot-glob for truncation', () => {
      expect(
        targetMatchesRoute(route('product/[id].tsx'), target('pattern', ['product', 'v*'])),
      ).toBe(true);
    });

    it('a pattern with no glob behaves like a FULL prefix (keep all segments)', () => {
      // -1 from findIndex must NOT drop the last segment.
      // full prefix ['shop','admin'] vs /shop/products -> static mismatch -> false
      expect(
        targetMatchesRoute(route('shop/products/index.tsx'), target('pattern', ['shop', 'admin'])),
      ).toBe(false);
    });
  });
});
