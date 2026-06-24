import type { AasaModel, Finding, LinkConfig } from '../types.js';

export const checkAasaAppIds = (aasa: AasaModel, config: LinkConfig): Finding[] => {
  const bundleIdentifierConfig = config.ios.bundleIdentifier;
  if (!bundleIdentifierConfig) {
    return [];
  }

  const formattedAppIdsAasa = aasa.appIDs.map((appID) => appID.slice(appID.indexOf('.') + 1));

  if (formattedAppIdsAasa.includes(bundleIdentifierConfig)) {
    return [];
  }
  return [
    {
      code: 'DL202',
      severity: 'error',
      message: `AASA appID does not match ios.bundleIdentifier "${bundleIdentifierConfig}"`,
    },
  ];
};
