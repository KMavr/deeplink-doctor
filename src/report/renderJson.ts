import { isLinkableRoute } from '../routes/parseRoutePath.js';
import type { PathData } from '../types.js';

export const renderJson = (routes: PathData[]): string =>
  JSON.stringify(
    {
      summary: {
        total: routes.length,
        linkable: routes.filter(isLinkableRoute).length,
      },
      routes,
    },
    null,
    2,
  );
