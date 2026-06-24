import { describe, it, expect } from 'vitest';
import { extractDomains } from '../../src/links/extractDomains.js';
import type { LinkConfig } from '../../src/types.js';

/**
 * extractDomains(config) collects the hosts worth probing for hosted
 * association files: iOS `applinks:` associatedDomains (prefix and any
 * `?…` query stripped) UNION Android intentFilter `data.host` values, deduped.
 * Non-`applinks:` associatedDomains entries (e.g. webcredentials:) are not
 * link domains and are ignored. Pure — no I/O.
 */

const config = (
  parts: Partial<LinkConfig['ios']> & Partial<LinkConfig['android']>,
): LinkConfig => ({
  schemes: [],
  ios: { associatedDomains: parts.associatedDomains ?? [] },
  android: { intentFilters: parts.intentFilters ?? [] },
});

describe('extractDomains', () => {
  it('strips the applinks: prefix and ?query from associatedDomains', () => {
    expect(
      extractDomains(config({ associatedDomains: ['applinks:example.com?mode=developer'] })),
    ).toEqual(['example.com']);
  });

  it('collects Android intentFilter hosts', () => {
    expect(
      extractDomains(config({ intentFilters: [{ data: [{ host: 'shop.example.com' }] }] })),
    ).toEqual(['shop.example.com']);
  });

  it('unions iOS and Android hosts and dedupes', () => {
    const result = extractDomains(
      config({
        associatedDomains: ['applinks:example.com'],
        intentFilters: [{ data: [{ host: 'example.com' }, { host: 'shop.example.com' }] }],
      }),
    );
    expect([...result].sort()).toEqual(['example.com', 'shop.example.com']);
  });

  it('ignores associatedDomains entries without the applinks: prefix', () => {
    expect(extractDomains(config({ associatedDomains: ['webcredentials:example.com'] }))).toEqual(
      [],
    );
  });

  it('returns [] when no domains are configured', () => {
    expect(extractDomains(config({}))).toEqual([]);
  });
});
