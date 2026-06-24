import { describe, it, expect } from 'vitest';
import { parseAssetlinks } from '../../src/sources/assetlinks.js';
import type { AssetlinkEntry } from '../../src/types.js';

/**
 * Contract for `parseAssetlinks(text)`:
 *
 * Input  — the raw response body of
 *          `https://<domain>/.well-known/assetlinks.json` (a JSON array of
 *          statements).
 * Output — one `{ packageName, fingerprints }` per statement that carries an
 *          android `target.package_name`. `sha256_cert_fingerprints` is
 *          preserved verbatim (including empty — that is the DL204 signal).
 *
 * Throws ONLY when the body is not valid JSON. Valid-JSON-wrong-shape is
 * lenient and yields `[]`.
 */

describe('parseAssetlinks', () => {
  it('extracts package name and fingerprints from a statement', () => {
    const text = JSON.stringify([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.example.app',
          sha256_cert_fingerprints: ['14:6D:E9:83:C5'],
        },
      },
    ]);
    const expected: AssetlinkEntry[] = [
      { packageName: 'com.example.app', fingerprints: ['14:6D:E9:83:C5'] },
    ];
    expect(parseAssetlinks(text)).toEqual(expected);
  });

  it('preserves an empty fingerprints array (DL204 signal)', () => {
    const text = JSON.stringify([
      {
        target: {
          namespace: 'android_app',
          package_name: 'com.example.app',
          sha256_cert_fingerprints: [],
        },
      },
    ]);
    expect(parseAssetlinks(text)).toEqual([{ packageName: 'com.example.app', fingerprints: [] }]);
  });

  it('defaults missing fingerprints to an empty array', () => {
    const text = JSON.stringify([
      { target: { namespace: 'android_app', package_name: 'com.example.app' } },
    ]);
    expect(parseAssetlinks(text)).toEqual([{ packageName: 'com.example.app', fingerprints: [] }]);
  });

  it('skips statements without an android package_name (e.g. web targets)', () => {
    const text = JSON.stringify([
      { target: { namespace: 'web', site: 'https://example.com' } },
      {
        target: {
          namespace: 'android_app',
          package_name: 'com.example.app',
          sha256_cert_fingerprints: ['AA:BB'],
        },
      },
    ]);
    expect(parseAssetlinks(text)).toEqual([
      { packageName: 'com.example.app', fingerprints: ['AA:BB'] },
    ]);
  });

  it('returns [] for a JSON body that is not an array (lenient)', () => {
    expect(parseAssetlinks(JSON.stringify({}))).toEqual([]);
  });

  it('throws on a non-JSON body (DL201 territory)', () => {
    expect(() => parseAssetlinks('Moved Permanently')).toThrow();
  });
});
