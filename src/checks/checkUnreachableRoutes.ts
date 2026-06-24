import { generateFinding } from '../lib/generateFinding.js';
import { isLinkableRoute } from '../routes/parseRoutePath.js';
import type { Finding, LinkTarget, PathData } from '../types.js';
import { targetMatchesRoute } from './targetMatchesRoute.js';

export const checkUnreachableRoutes = (routes: PathData[], targets: LinkTarget[]): Finding[] => {
  const linkableRoutes = routes.filter((route) => isLinkableRoute(route));

  const unreachableRoutes = linkableRoutes.filter((route) =>
    targets.every((target) => !targetMatchesRoute(route, target)),
  );

  return unreachableRoutes.map((route) =>
    generateFinding('DL002', `Route "${route.pathname}" is not reachable by any configured link`, {
      route: route.pathname,
    }),
  );
};
