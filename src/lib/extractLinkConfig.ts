import type { LinkConfig, ResolvedExpoConfig } from '../types.js';

export const extractLinkConfig = (config: ResolvedExpoConfig): LinkConfig => {
  const normalizedSchemes = typeof config.scheme === 'string' ? [config.scheme] : config.scheme;

  return {
    schemes: normalizedSchemes ?? [],
    ios: {
      ...(config.ios?.bundleIdentifier ? { bundleIdentifier: config.ios.bundleIdentifier } : {}),
      associatedDomains: config.ios?.associatedDomains ?? [],
    },
    android: {
      ...(config.android?.package ? { package: config.android.package } : {}),
      intentFilters: config.android?.intentFilters ?? [],
    },
  };
};
