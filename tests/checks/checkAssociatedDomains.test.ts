import { describe, it, expect } from 'vitest';
import { checkAssociatedDomains } from '../../src/checks/checkAssociatedDomains.js';
import type { LinkConfig } from '../../src/types.js';

/**
 * DL101 (error): an `ios.associatedDomains` entry lacks a recognized Apple
 * service prefix (applinks: / webcredentials: / activitycontinuation:).
 * One finding per malformed entry; pure over LinkConfig.
 */

const config = (associatedDomains: string[]): LinkConfig => ({
  schemes: [],
  ios: { associatedDomains },
  android: { intentFilters: [] },
});

describe('checkAssociatedDomains (DL101)', () => {
  it('returns nothing when every entry has the applinks: prefix', () => {
    expect(
      checkAssociatedDomains(config(['applinks:example.com', 'applinks:app.example.com'])),
    ).toEqual([]);
  });

  it('accepts other recognized prefixes (webcredentials, activitycontinuation)', () => {
    expect(
      checkAssociatedDomains(
        config(['webcredentials:example.com', 'activitycontinuation:example.com']),
      ),
    ).toEqual([]);
  });

  it('flags an entry with no recognized prefix', () => {
    const findings = checkAssociatedDomains(config(['example.com']));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ code: 'DL101', severity: 'error' });
    expect(findings[0]?.message).toContain('example.com');
  });

  it('flags each malformed entry but not the valid ones', () => {
    const findings = checkAssociatedDomains(
      config(['applinks:ok.com', 'bad.com', 'also-bad.com', 'webcredentials:ok.com']),
    );
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.code === 'DL101')).toBe(true);
  });

  it('returns nothing for an empty associatedDomains list', () => {
    expect(checkAssociatedDomains(config([]))).toEqual([]);
  });
});
