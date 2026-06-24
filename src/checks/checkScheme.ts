import { generateFinding } from '../lib/generateFinding.js';
import type { Finding, LinkConfig } from '../types.js';

export const WEB_SCHEMES = ['http', 'https'];

export const checkScheme = (config: LinkConfig): Finding[] => {
  const hasNoSchemes = config.schemes.length === 0;
  const hasCustomScheme = config.android.intentFilters.some(({ data }) =>
    data.some((d) => d.scheme !== undefined && !WEB_SCHEMES.includes(d.scheme.toLowerCase())),
  );
  if (hasNoSchemes && hasCustomScheme) {
    return [
      generateFinding(
        'DL003',
        'A custom-scheme deep link is configured but no scheme is declared; set "scheme" in your Expo config',
      ),
    ];
  }
  return [];
};
