import type { Finding, LinkConfig } from '../types.js';

export const checkAppIdentifiers = (config: LinkConfig): Finding[] => {
  const missingIosBundleIdentifier: Finding[] =
    config.ios.associatedDomains.length > 0 && !config.ios.bundleIdentifier
      ? [
          {
            code: 'DL102',
            severity: 'error',
            message: 'ios.bundleIdentifier is required when associatedDomains are configured',
          },
        ]
      : [];

  const missingAndroidIntentFilters: Finding[] =
    config.android.intentFilters.length > 0 && !config.android.package
      ? [
          {
            code: 'DL103',
            severity: 'error',
            message: 'android.package is required when intentFilters are configured',
          },
        ]
      : [];

  return [...missingIosBundleIdentifier, ...missingAndroidIntentFilters];
};
