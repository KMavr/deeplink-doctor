import type { LinkConfig, LinkTarget } from '../types.js';

const calculateKind = (pathPrefix?: string, pathPattern?: string) => {
  if (pathPrefix) {
    return 'prefix';
  }
  if (pathPattern) {
    return 'pattern';
  }
  return 'exact';
};

export const extractLinkTargets = (config: LinkConfig): LinkTarget[] => {
  const intentFilters = config.android.intentFilters;

  return intentFilters.flatMap(({ data }) =>
    data.map(({ scheme, host, path, pathPrefix, pathPattern }) => {
      const raw = path ?? pathPrefix ?? pathPattern ?? '/';
      const kind = calculateKind(pathPrefix, pathPattern);
      const segments = raw.split('/').filter(Boolean);

      return {
        raw,
        kind,
        segments,
        ...(host !== undefined && { host }),
        ...(scheme !== undefined && { scheme }),
      };
    }),
  );
};
