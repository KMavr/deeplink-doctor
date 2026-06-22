import { describe, it, expect } from 'vitest';
import { checkScheme } from '../../src/checks/checkScheme.js';
import type { IntentFilter, LinkConfig } from '../../src/types.js';

/**
 * DL003 (error): a custom-scheme deep link is configured but `schemes` is
 * empty. The only static signal for "custom-scheme link configured" is an
 * Android intentFilter whose data declares a non-web (non http/https) scheme.
 * App Links (http/https) do not need a `scheme`, so they never fire DL003.
 * One finding, app-wide.
 */

const config = (schemes: string[], intentFilters: IntentFilter[]): LinkConfig => ({
  schemes,
  ios: { associatedDomains: [] },
  android: { package: 'com.x.app', intentFilters },
});

const filter = (scheme: string): IntentFilter => ({ data: [{ scheme, host: 'example.com' }] });

describe('checkScheme (DL003)', () => {
  it('flags a custom-scheme intent filter when schemes is empty', () => {
    const findings = checkScheme(config([], [filter('myapp')]));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ code: 'DL003', severity: 'error' });
  });

  it('does not flag when schemes declares a custom scheme', () => {
    expect(checkScheme(config(['myapp'], [filter('myapp')]))).toEqual([]);
  });

  it('does not flag http/https-only intent filters when schemes is empty', () => {
    expect(checkScheme(config([], [filter('https'), filter('http')]))).toEqual([]);
  });

  it('does not flag when there are no intent filters', () => {
    expect(checkScheme(config([], []))).toEqual([]);
  });

  it('does not flag intent filter data without a scheme', () => {
    const noScheme: IntentFilter = { data: [{ host: 'example.com', pathPrefix: '/x' }] };
    expect(checkScheme(config([], [noScheme]))).toEqual([]);
  });

  it('emits at most one finding even with several custom-scheme filters', () => {
    const findings = checkScheme(config([], [filter('myapp'), filter('myapp'), filter('other')]));
    expect(findings).toHaveLength(1);
  });
});
