import { describe, it, expect } from 'vitest';
import { checkAutoVerifyHosts } from '../../src/checks/checkAutoVerifyHosts.js';
import type { IntentFilter, LinkConfig } from '../../src/types.js';

/**
 * DL104 (warn): an intentFilter has `autoVerify: true` but no `data.host`
 * entry — Android App Links cannot verify without a host. One warn per
 * offending filter.
 */

const config = (intentFilters: IntentFilter[]): LinkConfig => ({
  schemes: [],
  ios: { associatedDomains: [] },
  android: { package: 'com.x.app', intentFilters },
});

describe('checkAutoVerifyHosts (DL104)', () => {
  it('flags an autoVerify filter that has no host', () => {
    const findings = checkAutoVerifyHosts(
      config([{ autoVerify: true, data: [{ pathPrefix: '/x' }] }]),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ code: 'DL104', severity: 'warn' });
  });

  it('does not flag when the autoVerify filter has at least one host', () => {
    expect(
      checkAutoVerifyHosts(
        config([{ autoVerify: true, data: [{ pathPrefix: '/x' }, { host: 'example.com' }] }]),
      ),
    ).toEqual([]);
  });

  it('does not flag filters without autoVerify', () => {
    expect(checkAutoVerifyHosts(config([{ data: [{ pathPrefix: '/x' }] }]))).toEqual([]);
    expect(
      checkAutoVerifyHosts(config([{ autoVerify: false, data: [{ pathPrefix: '/x' }] }])),
    ).toEqual([]);
  });

  it('emits one finding per offending filter', () => {
    const findings = checkAutoVerifyHosts(
      config([
        { autoVerify: true, data: [{ pathPrefix: '/a' }] },
        { autoVerify: true, data: [{ host: 'ok.com' }] },
        { autoVerify: true, data: [{ pathPrefix: '/b' }] },
      ]),
    );
    expect(findings).toHaveLength(2);
  });

  it('returns nothing for no intent filters', () => {
    expect(checkAutoVerifyHosts(config([]))).toEqual([]);
  });
});
