import type { PathData } from '../types.js';

export const routeHandlesPrefix = (route: PathData, pathSegments: string[]): boolean => {
  if (pathSegments.length === 0) {
    return true;
  }

  if (pathSegments.length < route.segments.length) {
    return pathSegments.every((segment, i) =>
      route.segments[i].kind === 'static' ? route.segments[i].value === segment : true,
    );
  }

  if (pathSegments.length > route.segments.length) {
    const nonCatchAllSegments = route.segments.filter(({ kind }) => kind !== 'catchall');
    return (
      route.segments.at(-1)?.kind === 'catchall' &&
      nonCatchAllSegments.every((s, i) =>
        s.kind === 'static' ? s.value === pathSegments[i] : s.kind === 'dynamic',
      )
    );
  }

  return route.segments.every((segment, i) =>
    segment.kind === 'static' ? segment.value === pathSegments[i] : true,
  );
};
