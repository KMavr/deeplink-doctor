import { generateFinding } from '../lib/generateFinding.js';
import type { Finding, LinkTarget, PathData } from '../types.js';
import { targetMatchesRoute } from './targetMatchesRoute.js';

export const checkDeadLinks = (routes: PathData[], targets: LinkTarget[]): Finding[] => {
  const deadTargets = targets.filter(
    (target) => !routes.some((route) => targetMatchesRoute(route, target)),
  );

  return deadTargets.map((target) =>
    generateFinding('DL001', `No route handles deep link target "${target.raw}"`, {
      target: target.raw,
    }),
  );
};
