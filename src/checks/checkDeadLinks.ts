import type { Finding, LinkTarget, PathData } from '../types.js';
import { targetMatchesRoute } from './targetMatchesRoute.js';

export const checkDeadLinks = (routes: PathData[], targets: LinkTarget[]): Finding[] => {
  const deadTargets = targets.filter(
    (target) => !routes.some((route) => targetMatchesRoute(route, target)),
  );

  return deadTargets.map(
    (target): Finding => ({
      code: 'DL001',
      severity: 'error',
      target: target.raw,
      message: `No route handles deep link target "${target.raw}"`,
    }),
  );
};
