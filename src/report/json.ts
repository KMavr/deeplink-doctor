import { isLinkableRoute } from '../routes/parseRoutePath.js';
import type { Finding, PathData } from '../types.js';

export const renderRoutes = (routes: PathData[]): string =>
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

export const renderFindings = (findings: Finding[], suppressed: Finding[] = []): string =>
  JSON.stringify(
    {
      summary: {
        total: findings.length,
        errors: findings.filter((finding) => finding.severity === 'error').length,
        warnings: findings.filter((finding) => finding.severity === 'warn').length,
        suppressed: suppressed.length,
      },
      findings,
      suppressed,
    },
    null,
    2,
  );
