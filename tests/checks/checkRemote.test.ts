import { describe, it, expect } from 'vitest';
import { checkRemote } from '../../src/checks/checkRemote.js';
import type { AasaModel, AssetlinkEntry, LinkConfig } from '../../src/types.js';

/**
 * checkRemote aggregates the per-domain remote checks (DL202 + DL203/DL204)
 * over one domain's parsed AASA + assetlinks against the LinkConfig.
 */

const config: LinkConfig = {
  schemes: [],
  ios: { associatedDomains: [], bundleIdentifier: 'com.example.app' },
  android: { intentFilters: [], package: 'com.example.app' },
};

describe('checkRemote', () => {
  it('returns no findings when both files name our app correctly', () => {
    const aasa: AasaModel = { appIDs: ['9JA89QQLNQ.com.example.app'] };
    const assetlinks: AssetlinkEntry[] = [{ packageName: 'com.example.app', fingerprints: ['AA'] }];
    expect(checkRemote(aasa, assetlinks, config)).toEqual([]);
  });

  it('aggregates findings from both the AASA and assetlinks checks', () => {
    const aasa: AasaModel = { appIDs: ['TEAM.com.other.app'] };
    const assetlinks: AssetlinkEntry[] = [];
    expect(
      checkRemote(aasa, assetlinks, config)
        .map((f) => f.code)
        .sort(),
    ).toEqual(['DL202', 'DL203']);
  });
});
