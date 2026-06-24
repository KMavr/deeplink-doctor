import { generateFinding } from '../lib/generateFinding.js';
import type { Finding, LinkConfig } from '../types.js';

export const checkAppIdentifiers = (config: LinkConfig): Finding[] => {
  const missingIosBundleIdentifier: Finding[] =
    config.ios.associatedDomains.length > 0 && !config.ios.bundleIdentifier
      ? [
          generateFinding(
            'DL102',
            'ios.bundleIdentifier is required when associatedDomains are configured',
          ),
        ]
      : [];

  const missingAndroidIntentFilters: Finding[] =
    config.android.intentFilters.length > 0 && !config.android.package
      ? [generateFinding('DL103', 'android.package is required when intentFilters are configured')]
      : [];

  return [...missingIosBundleIdentifier, ...missingAndroidIntentFilters];
};
