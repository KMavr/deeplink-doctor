import { describe, it, expect } from 'vitest';
import { checkAasaAppIds } from '../../src/checks/checkAasaAppIds.js';
import type { AasaModel, LinkConfig } from '../../src/types.js';

/**
 * DL202 (error): the hosted AASA names no appID for our app.
 *
 * An appID is `<teamId>.<bundleIdentifier>`. We know the bundle id from config
 * but not the team id, so a match = strip the first dot-segment (the team) and
 * compare the remainder exactly to `ios.bundleIdentifier`. Fires when the
 * bundle id is set and NO appID matches (empty appIDs included). Skips entirely
 * when bundleIdentifier is absent — DL102 owns that.
 */

const config = (bundleIdentifier?: string): LinkConfig => ({
  schemes: [],
  ios: { associatedDomains: [], ...(bundleIdentifier !== undefined && { bundleIdentifier }) },
  android: { intentFilters: [] },
});

const aasa = (appIDs: string[]): AasaModel => ({ appIDs });
const codes = (a: AasaModel, c: LinkConfig) => checkAasaAppIds(a, c).map((f) => f.code);

describe('checkAasaAppIds (DL202)', () => {
  it('passes when an appID matches the bundle id (team prefix stripped)', () => {
    expect(codes(aasa(['9JA89QQLNQ.com.example.app']), config('com.example.app'))).toEqual([]);
  });

  it('matches when any one of several appIDs is ours', () => {
    expect(
      codes(aasa(['TEAM.com.other.app', '9JA89QQLNQ.com.example.app']), config('com.example.app')),
    ).toEqual([]);
  });

  it('flags DL202 when no appID matches the bundle id', () => {
    expect(codes(aasa(['TEAM.com.other.app']), config('com.example.app'))).toEqual(['DL202']);
  });

  it('flags DL202 when the AASA has no appIDs at all', () => {
    expect(codes(aasa([]), config('com.example.app'))).toEqual(['DL202']);
  });

  it('does not treat a dotted-suffix bundle id as a match (strip, not endsWith)', () => {
    // appID remainder is `com.example.app`; bundle id `example.app` must NOT match.
    expect(codes(aasa(['9JA89QQLNQ.com.example.app']), config('example.app'))).toEqual(['DL202']);
  });

  it('skips entirely when bundleIdentifier is absent (DL102 owns that)', () => {
    expect(codes(aasa([]), config(undefined))).toEqual([]);
  });

  it('marks DL202 as an error', () => {
    const findings = checkAasaAppIds(aasa(['TEAM.com.other.app']), config('com.example.app'));
    expect(findings[0]?.severity).toBe('error');
  });
});
