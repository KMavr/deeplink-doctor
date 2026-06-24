import type { AssetlinkEntry, Finding, LinkConfig } from '../types.js';

export const checkAssetlinks = (assetlinks: AssetlinkEntry[], config: LinkConfig): Finding[] => {
  const pkg = config.android.package;
  if (!pkg) {
    return [];
  }

  if (assetlinks.every(({ packageName }) => packageName !== pkg)) {
    return [
      {
        code: 'DL203',
        severity: 'error',
        message: `assetlinks.json has no entry for android.package "${pkg}"`,
      },
    ];
  }

  return assetlinks.flatMap(({ packageName, fingerprints }) => {
    if (pkg === packageName) {
      return fingerprints.length > 0
        ? []
        : [
            {
              code: 'DL204',
              severity: 'warn',
              message: `assetlinks entry for "${pkg}" has an empty sha256_cert_fingerprints array`,
            },
          ];
    }
    return [];
  });
};
