import type { LinkConfig } from '../types.js';

export const extractDomains = (config: LinkConfig): string[] => {
  const associatedDomains = config?.ios?.associatedDomains ?? [];
  const intentFilters = config?.android?.intentFilters ?? [];

  const iosDomains = associatedDomains
    .filter((domain) => domain.startsWith('applinks:'))
    .map((domain) =>
      domain.slice(
        domain.indexOf(':') + 1,
        domain.indexOf('?') !== -1 ? domain.indexOf('?') : undefined,
      ),
    );

  const androidDomains = intentFilters.flatMap(({ data }) =>
    data.flatMap((d) => (d?.host ? [d.host] : [])),
  );

  const domains = new Set([...iosDomains, ...androidDomains]);

  return [...domains];
};
