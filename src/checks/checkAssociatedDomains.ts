import { generateFinding } from '../lib/generateFinding.js';
import type { Finding, LinkConfig } from '../types.js';

export const RECOGNIZED_DOMAIN_PREFIXES = ['applinks:', 'webcredentials:', 'activitycontinuation:'];

export const checkAssociatedDomains = (config: LinkConfig): Finding[] => {
  const invalidAssociatedDomains: string[] = config.ios.associatedDomains.filter((domain) =>
    RECOGNIZED_DOMAIN_PREFIXES.every((prefix) => !domain.startsWith(prefix)),
  );

  return invalidAssociatedDomains.map((domain) =>
    generateFinding(
      'DL101',
      `associatedDomains entry "${domain}" is missing a scheme prefix (e.g. "${RECOGNIZED_DOMAIN_PREFIXES.join('", "')}")`,
    ),
  );
};
