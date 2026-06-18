import { describe, it, expect } from 'vitest';
import { checkConfig } from '../../src/checks/checkConfig.js';
import type { LinkConfig } from '../../src/types.js';

/**
 * `checkConfig(config)` aggregates the config-hygiene checks (DL101-DL104) in
 * a stable order: associatedDomains, then app identifiers, then autoVerify.
 */

describe('checkConfig', () => {
  it('returns nothing for a fully valid config', () => {
    const valid: LinkConfig = {
      schemes: ['myapp'],
      ios: { bundleIdentifier: 'com.x.app', associatedDomains: ['applinks:example.com'] },
      android: {
        package: 'com.x.app',
        intentFilters: [{ autoVerify: true, data: [{ host: 'example.com', pathPrefix: '/' }] }],
      },
    };
    expect(checkConfig(valid)).toEqual([]);
  });

  it('aggregates findings from every config check in stable order', () => {
    const broken: LinkConfig = {
      schemes: [],
      // bad.com -> DL101; no bundleIdentifier -> DL102
      ios: { associatedDomains: ['bad.com'] },
      // no package -> DL103; autoVerify without host -> DL104
      android: { intentFilters: [{ autoVerify: true, data: [{ pathPrefix: '/x' }] }] },
    };
    expect(checkConfig(broken).map((f) => f.code)).toEqual(['DL101', 'DL102', 'DL103', 'DL104']);
  });
});
