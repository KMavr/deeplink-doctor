import { generateFinding } from '../lib/generateFinding.js';
import type { AssetlinkEntry, Finding, LinkConfig } from '../types.js';

export const checkAssetlinks = (assetlinks: AssetlinkEntry[], config: LinkConfig): Finding[] => {
  const pkg = config.android.package;
  if (!pkg) {
    return [];
  }

  if (assetlinks.every(({ packageName }) => packageName !== pkg)) {
    return [generateFinding('DL203', `assetlinks.json has no entry for android.package "${pkg}"`)];
  }

  return assetlinks.flatMap(({ packageName, fingerprints }) => {
    if (pkg === packageName) {
      return fingerprints.length > 0
        ? []
        : [
            generateFinding(
              'DL204',
              `assetlinks entry for "${pkg}" has an empty sha256_cert_fingerprints array`,
            ),
          ];
    }
    return [];
  });
};
