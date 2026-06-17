import { isLinkableRoute } from '../routes/parseRoutePath.js';
import type { Finding, LinkTarget, PathData } from '../types.js';
import { targetMatchesRoute } from './targetMatchesRoute.js';

export const checkUnreachableRoutes = (routes: PathData[], targets: LinkTarget[]): Finding[] => {
  const linkableRoutes = routes.filter((route) => isLinkableRoute(route));

  const unreachableRoutes = linkableRoutes.filter((route) =>
    targets.every((target) => !targetMatchesRoute(route, target)),
  );

  return unreachableRoutes.map((route) => ({
    code: 'DL002',
    severity: 'warn',
    route: route.pathname,
    message: `Route "${route.pathname}" is not reachable by any configured link`,
  }));
};
