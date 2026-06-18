import type { Finding, LinkConfig } from '../types.js';
import { checkAppIdentifiers } from './checkAppIdentifiers.js';
import { checkAssociatedDomains } from './checkAssociatedDomains.js';
import { checkAutoVerifyHosts } from './checkAutoVerifyHosts.js';

export const checkConfig = (config: LinkConfig): Finding[] => [
  ...checkAssociatedDomains(config),
  ...checkAppIdentifiers(config),
  ...checkAutoVerifyHosts(config),
];
