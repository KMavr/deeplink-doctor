import { describe, it, expect } from 'vitest';
import { extractLinkTargets } from '../../src/lib/extractLinkTargets.js';
import type { IntentFilter, LinkConfig, LinkTarget } from '../../src/types.js';

/**
 * Contract for `extractLinkTargets(config)`:
 *
 * Reads `config.android.intentFilters` and returns one `LinkTarget` per
 * path-bearing `data` entry, in source order:
 *   - `path`        -> kind 'exact'
 *   - `pathPrefix`  -> kind 'prefix'
 *   - `pathPattern` -> kind 'pattern'
 *   - host only, no path field -> kind 'exact', segments [] (the domain root)
 *
 * Splitting: strip the leading '/', split on '/', drop empties
 *   ('/games/lobby' -> ['games','lobby'], '/games/' -> ['games'], '/' -> []).
 * `host`/`scheme` are carried as metadata; `raw` preserves the original string
 * ('/' for a host-only entry). Pure: no filesystem, no network.
 */

const config = (intentFilters: IntentFilter[]): LinkConfig => ({
  schemes: [],
  ios: { associatedDomains: [] },
  android: { intentFilters },
});

describe('extractLinkTargets', () => {
  it('maps an exact path', () => {
    const result = extractLinkTargets(
      config([
        { action: 'VIEW', data: [{ scheme: 'https', host: 'example.com', path: '/games/lobby' }] },
      ]),
    );
    const expected: LinkTarget[] = [
      {
        host: 'example.com',
        scheme: 'https',
        segments: ['games', 'lobby'],
        kind: 'exact',
        raw: '/games/lobby',
      },
    ];
    expect(result).toEqual(expected);
  });

  it('maps a pathPrefix', () => {
    const [target] = extractLinkTargets(
      config([{ action: 'VIEW', data: [{ host: 'example.com', pathPrefix: '/games' }] }]),
    );
    expect(target).toMatchObject({ kind: 'prefix', segments: ['games'], raw: '/games' });
  });

  it('maps a pathPattern, keeping the glob token as a segment', () => {
    const [target] = extractLinkTargets(
      config([{ action: 'VIEW', data: [{ host: 'example.com', pathPattern: '/products/.*' }] }]),
    );
    expect(target).toMatchObject({
      kind: 'pattern',
      segments: ['products', '.*'],
      raw: '/products/.*',
    });
  });

  it('treats a host-only entry as the domain root', () => {
    const [target] = extractLinkTargets(
      config([{ action: 'VIEW', data: [{ scheme: 'https', host: 'example.com' }] }]),
    );
    expect(target).toMatchObject({ host: 'example.com', segments: [], kind: 'exact' });
  });

  it('normalizes leading/trailing slashes', () => {
    const result = extractLinkTargets(
      config([
        {
          action: 'VIEW',
          data: [
            { host: 'h', path: '/games/' },
            { host: 'h', path: '/' },
          ],
        },
      ]),
    );
    expect(result.map((t) => t.segments)).toEqual([['games'], []]);
  });

  it('returns one target per data entry, in source order across filters', () => {
    const result = extractLinkTargets(
      config([
        {
          action: 'VIEW',
          data: [
            { host: 'h', path: '/a' },
            { host: 'h', path: '/b' },
          ],
        },
        { action: 'VIEW', data: [{ host: 'h', pathPrefix: '/c' }] },
      ]),
    );
    expect(result.map((t) => t.raw)).toEqual(['/a', '/b', '/c']);
  });

  it('returns [] when there are no intentFilters', () => {
    expect(extractLinkTargets(config([]))).toEqual([]);
  });
});
