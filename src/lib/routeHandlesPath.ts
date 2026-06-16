import type { PathData } from '../types.js';

export const routeHandlesPath = (route: PathData, pathSegments: string[]): boolean => {
  if (pathSegments.length < route.segments.length) {
    return false;
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

  return route.segments
    .map((segment, i) =>
      segment.kind === 'static'
        ? segment.value === pathSegments[i]
        : segment.kind === 'dynamic' || segment.kind === 'catchall',
    )
    .every(Boolean);
};
