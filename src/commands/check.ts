import { calculateExitCode } from '../checks/calculateExitCode.js';
import { runChecks } from '../checks/runChecks.js';
import { extractLinkTargets } from '../links/extractLinkTargets.js';
import * as human from '../report/human.js';
import * as json from '../report/json.js';
import type { LinkConfig, PathData } from '../types.js';

type CheckDeps = {
  readRoutes: (root: string) => PathData[];
  readLinkConfig: (root: string) => LinkConfig;
};
type CheckOptions = { strict?: boolean; json?: boolean };

export const runCheck = (
  root: string,
  deps: CheckDeps,
  options: CheckOptions,
): { report: string; exitCode: 0 | 1 | 2 } => {
  try {
    const targets = extractLinkTargets(deps.readLinkConfig(root));
    const findings = runChecks(deps.readRoutes(root), targets);
    const report = options.json ? json.renderFindings(findings) : human.renderFindings(findings);
    return { report, exitCode: calculateExitCode(findings, { strict: options.strict ?? false }) };
  } catch (error) {
    return { report: error instanceof Error ? error.message : String(error), exitCode: 2 };
  }
};
