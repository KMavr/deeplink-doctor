import type { LinkTarget, PathData, Finding } from '../types.js';
import { checkDeadLinks } from './checkDeadLinks.js';
import { checkUnreachableRoutes } from './checkUnreachableRoutes.js';

export const runChecks = (routes: PathData[], targets: LinkTarget[]): Finding[] => {
  const deadLinks = checkDeadLinks(routes, targets);
  const unreachableRoutes = checkUnreachableRoutes(routes, targets);

  return [...deadLinks, ...unreachableRoutes];
};
