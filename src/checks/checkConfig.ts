import type { Finding, LinkConfig } from '../types.js';
import { checkAppIdentifiers } from './checkAppIdentifiers.js';
import { checkAssociatedDomains } from './checkAssociatedDomains.js';
import { checkAutoVerifyHosts } from './checkAutoVerifyHosts.js';
import { checkScheme } from './checkScheme.js';

export const checkConfig = (config: LinkConfig): Finding[] => [
  ...checkScheme(config),
  ...checkAssociatedDomains(config),
  ...checkAppIdentifiers(config),
  ...checkAutoVerifyHosts(config),
];
