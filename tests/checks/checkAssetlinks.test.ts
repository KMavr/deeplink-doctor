import { describe, it, expect } from 'vitest';
import { checkAssetlinks } from '../../src/checks/checkAssetlinks.js';
import type { AssetlinkEntry, LinkConfig } from '../../src/types.js';

/**
 * DL203 (error): assetlinks.json has no entry for `android.package`.
 * DL204 (warn): the matched entry exists but its `fingerprints` array is empty.
 *
 * Mutually exclusive on the same package: a matched-but-empty entry is DL204,
 * not DL203. Both skip when `android.package` is absent — DL103 owns that.
 */

const config = (pkg?: string): LinkConfig => ({
  schemes: [],
  ios: { associatedDomains: [] },
  android: { intentFilters: [], ...(pkg !== undefined && { package: pkg }) },
});

const entry = (packageName: string, fingerprints: string[] = ['AA:BB']): AssetlinkEntry => ({
  packageName,
  fingerprints,
});
const codes = (e: AssetlinkEntry[], c: LinkConfig) => checkAssetlinks(e, c).map((f) => f.code);

describe('checkAssetlinks (DL203 / DL204)', () => {
  it('passes when a matching entry has fingerprints', () => {
    expect(codes([entry('com.example.app')], config('com.example.app'))).toEqual([]);
  });

  it('flags DL203 when no entry matches the package', () => {
    expect(codes([entry('com.other.app')], config('com.example.app'))).toEqual(['DL203']);
  });

  it('flags DL203 when assetlinks is empty', () => {
    expect(codes([], config('com.example.app'))).toEqual(['DL203']);
  });

  it('flags DL204 (not DL203) when the matched entry has empty fingerprints', () => {
    expect(codes([entry('com.example.app', [])], config('com.example.app'))).toEqual(['DL204']);
  });

  it('skips entirely when android.package is absent (DL103 owns that)', () => {
    expect(codes([], config(undefined))).toEqual([]);
  });

  it('marks DL203 as error and DL204 as warn', () => {
    const dl203 = checkAssetlinks([], config('com.example.app'));
    const dl204 = checkAssetlinks([entry('com.example.app', [])], config('com.example.app'));
    expect(dl203[0]?.severity).toBe('error');
    expect(dl204[0]?.severity).toBe('warn');
  });
});
