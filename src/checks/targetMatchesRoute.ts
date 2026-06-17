import { routeHandlesPath } from '../routes/routeHandlesPath.js';
import { routeHandlesPrefix } from '../routes/routeHandlesPrefix.js';
import type { PathData, LinkTarget } from '../types.js';

export const targetMatchesRoute = (route: PathData, target: LinkTarget): boolean => {
  if (target.kind === 'exact') {
    return routeHandlesPath(route, target.segments);
  }
  if (target.kind === 'prefix') {
    return routeHandlesPrefix(route, target.segments);
  }

  const globPatternIndex = target.segments.findIndex((s) => s.includes('.') || s.includes('*'));

  const truncatedSegments =
    globPatternIndex === -1 ? target.segments : target.segments.slice(0, globPatternIndex);

  return routeHandlesPrefix(route, truncatedSegments);
};
