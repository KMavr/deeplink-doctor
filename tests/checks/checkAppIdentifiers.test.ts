import { describe, it, expect } from 'vitest';
import { checkAppIdentifiers } from '../../src/checks/checkAppIdentifiers.js';
import type { IntentFilter, LinkConfig } from '../../src/types.js';

/**
 * DL102 (error): ios.bundleIdentifier missing while iOS deep links are
 *   configured (associatedDomains non-empty).
 * DL103 (error): android.package missing while Android deep links are
 *   configured (intentFilters non-empty).
 * Grouped here because they are the symmetric iOS/Android identifier checks.
 */

const filter: IntentFilter = { data: [{ host: 'example.com', pathPrefix: '/x' }] };

const config = (parts: {
  bundleIdentifier?: string;
  associatedDomains?: string[];
  pkg?: string;
  intentFilters?: IntentFilter[];
}): LinkConfig => ({
  schemes: [],
  ios: {
    associatedDomains: parts.associatedDomains ?? [],
    ...(parts.bundleIdentifier !== undefined && { bundleIdentifier: parts.bundleIdentifier }),
  },
  android: {
    intentFilters: parts.intentFilters ?? [],
    ...(parts.pkg !== undefined && { package: parts.pkg }),
  },
});

const codes = (config: LinkConfig) => checkAppIdentifiers(config).map((f) => f.code);

describe('checkAppIdentifiers (DL102 / DL103)', () => {
  it('flags DL102 when associatedDomains are set but bundleIdentifier is missing', () => {
    expect(codes(config({ associatedDomains: ['applinks:example.com'] }))).toEqual(['DL102']);
  });

  it('does not flag DL102 when bundleIdentifier is present', () => {
    expect(
      codes(config({ associatedDomains: ['applinks:example.com'], bundleIdentifier: 'com.x.app' })),
    ).toEqual([]);
  });

  it('does not flag DL102 when no iOS deep links are configured', () => {
    expect(codes(config({}))).toEqual([]);
  });

  it('flags DL103 when intentFilters are set but package is missing', () => {
    expect(codes(config({ intentFilters: [filter] }))).toEqual(['DL103']);
  });

  it('does not flag DL103 when package is present', () => {
    expect(codes(config({ intentFilters: [filter], pkg: 'com.x.app' }))).toEqual([]);
  });

  it('flags both when both platforms are configured without identifiers', () => {
    expect(
      codes(config({ associatedDomains: ['applinks:example.com'], intentFilters: [filter] })),
    ).toEqual(['DL102', 'DL103']);
  });

  it('marks both findings as errors', () => {
    const findings = checkAppIdentifiers(
      config({ associatedDomains: ['applinks:example.com'], intentFilters: [filter] }),
    );
    expect(findings.every((f) => f.severity === 'error')).toBe(true);
  });
});
