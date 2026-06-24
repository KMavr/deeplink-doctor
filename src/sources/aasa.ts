import type { AasaModel } from '../types.js';

export const parseAasa = (body: string): AasaModel => {
  const data: unknown = JSON.parse(body);

  const details = (data as { applinks?: { details?: unknown } })?.applinks?.details;
  if (!Array.isArray(details)) {
    return { appIDs: [] };
  }

  const appIDs = details.flatMap((detail: unknown) => {
    const { appID, appIDs } = (detail ?? {}) as { appID?: unknown; appIDs?: unknown };
    if (Array.isArray(appIDs)) {
      return appIDs.filter((id): id is string => typeof id === 'string');
    }
    return typeof appID === 'string' ? [appID] : [];
  });

  return { appIDs };
};
