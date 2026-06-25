import chalk from 'chalk';
import { FINDING_EXPLANATIONS } from '../config/findingExplanations.js';
import { isLinkableRoute } from '../routes/parseRoutePath.js';
import type { Finding, PathData } from '../types.js';

// Greedy word-wrap into lines no wider than `width`, without mutation.
const wrap = (text: string, width: number): string[] =>
  text.split(' ').reduce<string[]>((lines, word) => {
    const last = lines.at(-1);
    if (last !== undefined && `${last} ${word}`.length <= width) {
      return [...lines.slice(0, -1), `${last} ${word}`];
    }
    return [...lines, word];
  }, []);

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

export const renderRoutes = (routes: PathData[]): string => {
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

const plural = (count: number, word: string): string => `${word}${count === 1 ? '' : 's'}`;

const SEVERITY_LABEL: Record<Finding['severity'], string> = {
  error: chalk.red('error'),
  warn: chalk.yellow('warn'),
};

const renderFinding = (finding: Finding, explain: boolean): string => {
  const line = `  ${chalk.dim(finding.code)}  ${SEVERITY_LABEL[finding.severity]}  ${finding.message}`;
  if (!explain) {
    return line;
  }
  const explanation = wrap(FINDING_EXPLANATIONS[finding.code], 76)
    .map((wrapped) => chalk.dim(`      ${wrapped}`))
    .join('\n');
  return `${line}\n${explanation}`;
};

export const renderFindings = (
  findings: Finding[],
  suppressed: Finding[] = [],
  explain: boolean = false,
): string => {
  const suppressedNote =
    suppressed.length > 0 ? chalk.dim(` (${suppressed.length} suppressed)`) : '';

  if (findings.length === 0) {
    return chalk.green('✓ No deep-link issues found.') + suppressedNote;
  }

  const body = findings.map((finding) => renderFinding(finding, explain));

  const errors = findings.filter((finding) => finding.severity === 'error').length;
  const warnings = findings.filter((finding) => finding.severity === 'warn').length;
  const summary =
    chalk.bold(
      `${findings.length} ${plural(findings.length, 'issue')} ` +
        `(${errors} ${plural(errors, 'error')}, ${warnings} ${plural(warnings, 'warning')})`,
    ) + suppressedNote;

  return [body.join(explain ? '\n\n' : '\n'), '', summary].join('\n');
};
