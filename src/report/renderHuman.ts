import chalk from 'chalk';
import { isLinkableRoute } from '../routes/parseRoutePath.js';
import type { PathData } from '../types.js';

const tagsFor = (route: PathData): string[] => {
  const tags: [active: boolean, label: string][] = [
    [route.segments.some((s) => s.kind === 'dynamic'), 'dynamic'],
    [route.segments.some((s) => s.kind === 'catchall'), 'catchall'],
    [route.inGroup, 'group'],
    [route.isLayout, 'layout'],
    [route.isSpecial, 'special'],
    [route.isApi, 'api'],
  ];
  return tags.filter(([active]) => active).map(([, label]) => label);
};

export const renderHuman = (routes: PathData[]): string => {
  if (routes.length === 0) {
    return chalk.yellow('No routes found in app/.');
  }

  const width = Math.max(...routes.map((route) => route.pathname.length));
  const renderRoute = (route: PathData): string => {
    const tags = tagsFor(route);
    const suffix = tags.length > 0 ? chalk.dim(`  [${tags.join(', ')}]`) : '';
    return `  ${route.pathname.padEnd(width)}  ${chalk.dim(route.filePath)}${suffix}`;
  };

  const linkable = routes.filter(isLinkableRoute);
  const other = routes.filter((route) => !isLinkableRoute(route));

  const sections = [chalk.bold(`Routes (${routes.length})`)];
  if (linkable.length > 0) {
    sections.push(linkable.map(renderRoute).join('\n'));
  }
  if (other.length > 0) {
    const heading = chalk.dim('Not link targets (layouts, special files, API routes):');
    sections.push(`${heading}\n${other.map(renderRoute).join('\n')}`);
  }
  return sections.join('\n\n');
};
