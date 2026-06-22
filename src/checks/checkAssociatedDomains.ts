import type { Finding, LinkConfig } from '../types.js';

export const RECOGNIZED_DOMAIN_PREFIXES = ['applinks:', 'webcredentials:', 'activitycontinuation:'];

export const checkAssociatedDomains = (config: LinkConfig): Finding[] => {
  const invalidAssociatedDomains: string[] = config.ios.associatedDomains.filter((domain) =>
    RECOGNIZED_DOMAIN_PREFIXES.every((prefix) => !domain.startsWith(prefix)),
  );

  return invalidAssociatedDomains.map((domain) => ({
    code: 'DL101',
    severity: 'error',
    message: `associatedDomains entry "${domain}" is missing a scheme prefix (e.g. "${RECOGNIZED_DOMAIN_PREFIXES.join('", "')}")`,
  }));
};
