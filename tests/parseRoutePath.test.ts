import { describe, it, expect } from 'vitest';
import { parseRoutePath, isLinkableRoute } from '../src/lib/parseRoutePath.js';

/**
 * Contract for `parseRoutePath(relPath)`:
 *
 * Input  — a file path relative to the `app/` dir, e.g. `settings/[id].tsx`.
 * Output — a RouteModel:
 *   - `filePath`  the input, unchanged
 *   - `segments`  ordered list, each `{ kind: 'static' | 'dynamic' | 'catchall', value }`
 *                 (`(group)` dirs are dropped; `index`/`_layout` add no segment)
 *   - `pathname`  the segments rendered as a URL: static -> `value`,
 *                 dynamic -> `[value]`, catchall -> `[...value]`; `/` when empty
 *   - flags       `isLayout`, `isSpecial`, `isApi`, `inGroup`
 *
 * The function is pure — no filesystem, no network.
 */

describe('parseRoutePath', () => {
  describe('parseRoutePath — index collapses to its folder', () => {
    it('root index.tsx is the root path', () => {
      const route = parseRoutePath('index.tsx');
      expect(route.pathname).toBe('/');
      expect(route.segments).toEqual([]);
    });

    it('a nested index.tsx is the folder path', () => {
      const route = parseRoutePath('settings/index.tsx');
      expect(route.pathname).toBe('/settings');
      expect(route.segments).toEqual([{ kind: 'static', value: 'settings' }]);
    });

    it('keeps the input path on filePath', () => {
      expect(parseRoutePath('settings/index.tsx').filePath).toBe('settings/index.tsx');
    });
  });

  describe('parseRoutePath — dynamic and catch-all segments', () => {
    it('[id] is a single dynamic segment', () => {
      const route = parseRoutePath('profile/[id].tsx');
      expect(route.pathname).toBe('/profile/[id]');
      expect(route.segments).toEqual([
        { kind: 'static', value: 'profile' },
        { kind: 'dynamic', value: 'id' },
      ]);
    });

    it('[...slug] is a single catch-all segment', () => {
      const route = parseRoutePath('blog/[...slug].tsx');
      expect(route.pathname).toBe('/blog/[...slug]');
      expect(route.segments).toEqual([
        { kind: 'static', value: 'blog' },
        { kind: 'catchall', value: 'slug' },
      ]);
    });
  });

  describe('parseRoutePath — (group) directories are invisible in the URL', () => {
    it('drops the (group) but records inGroup', () => {
      const route = parseRoutePath('(tabs)/home.tsx');
      expect(route.pathname).toBe('/home');
      expect(route.inGroup).toBe(true);
      expect(route.segments).toEqual([{ kind: 'static', value: 'home' }]);
    });

    it('a route outside any group is not inGroup', () => {
      expect(parseRoutePath('home.tsx').inGroup).toBe(false);
    });
  });

  describe('parseRoutePath — special files are flagged, not linkable', () => {
    it('_layout.tsx is a layout', () => {
      const route = parseRoutePath('_layout.tsx');
      expect(route.isLayout).toBe(true);
      expect(route.pathname).toBe('/');
    });

    it('a nested _layout.tsx collapses to its folder', () => {
      const route = parseRoutePath('settings/_layout.tsx');
      expect(route.isLayout).toBe(true);
      expect(route.pathname).toBe('/settings');
    });

    it('+not-found.tsx is special', () => {
      const route = parseRoutePath('+not-found.tsx');
      expect(route.isSpecial).toBe(true);
    });

    it('a +api.ts file is a server route', () => {
      const route = parseRoutePath('users+api.ts');
      expect(route.isApi).toBe(true);
    });

    it('a normal screen has all flags false', () => {
      const route = parseRoutePath('about.tsx');
      expect(route.isLayout).toBe(false);
      expect(route.isSpecial).toBe(false);
      expect(route.isApi).toBe(false);
      expect(route.inGroup).toBe(false);
    });
  });

  describe('parseRoutePath — combined case (ordering + flags together)', () => {
    it('(tabs)/settings/[id].tsx', () => {
      const route = parseRoutePath('(tabs)/settings/[id].tsx');
      expect(route.pathname).toBe('/settings/[id]');
      expect(route.inGroup).toBe(true);
      expect(route.segments).toEqual([
        { kind: 'static', value: 'settings' },
        { kind: 'dynamic', value: 'id' },
      ]);
    });
  });

  describe('parseRoutePath — regression cases (deep nesting, names, groups)', () => {
    it('a deeply nested index keeps the full folder path', () => {
      const route = parseRoutePath('shop/products/index.tsx');
      expect(route.pathname).toBe('/shop/products');
      expect(route.segments).toEqual([
        { kind: 'static', value: 'shop' },
        { kind: 'static', value: 'products' },
      ]);
    });

    it('a deeply nested _layout keeps the full folder path', () => {
      const route = parseRoutePath('shop/products/_layout.tsx');
      expect(route.isLayout).toBe(true);
      expect(route.pathname).toBe('/shop/products');
    });

    it('does not mangle a segment whose name ends in ts/js letters', () => {
      const route = parseRoutePath('scripts/index.tsx');
      expect(route.pathname).toBe('/scripts');
      expect(route.segments).toEqual([{ kind: 'static', value: 'scripts' }]);
    });

    it('+html.tsx is special', () => {
      expect(parseRoutePath('+html.tsx').isSpecial).toBe(true);
    });

    it('+native-intent.tsx is special', () => {
      expect(parseRoutePath('+native-intent.tsx').isSpecial).toBe(true);
    });

    it('drops every (group) when several are nested', () => {
      const route = parseRoutePath('(auth)/(modal)/login.tsx');
      expect(route.pathname).toBe('/login');
      expect(route.inGroup).toBe(true);
      expect(route.segments).toEqual([{ kind: 'static', value: 'login' }]);
    });

    it('recognises a group name containing a hyphen', () => {
      const route = parseRoutePath('(my-group)/x.tsx');
      expect(route.pathname).toBe('/x');
      expect(route.inGroup).toBe(true);
      expect(route.segments).toEqual([{ kind: 'static', value: 'x' }]);
    });
  });

  describe('isLinkableRoute — only real screens are link targets', () => {
    it('a normal screen is linkable', () => {
      expect(isLinkableRoute(parseRoutePath('profile/[id].tsx'))).toBe(true);
    });

    it('a layout is not linkable', () => {
      expect(isLinkableRoute(parseRoutePath('_layout.tsx'))).toBe(false);
    });

    it('a special file is not linkable', () => {
      expect(isLinkableRoute(parseRoutePath('+not-found.tsx'))).toBe(false);
    });

    it('a server route is not linkable', () => {
      expect(isLinkableRoute(parseRoutePath('users+api.ts'))).toBe(false);
    });
  });
});
