import { calculateExitCode } from '../checks/calculateExitCode.js';
import { checkConfig } from '../checks/checkConfig.js';
import { runChecks } from '../checks/runChecks.js';
import { extractLinkTargets } from '../links/extractLinkTargets.js';
import * as human from '../report/human.js';
import * as json from '../report/json.js';
import { applySuppressions } from '../suppressions/applySuppressions.js';
import type { LinkConfig, PathData, SuppressionRule } from '../types.js';

type CheckDeps = {
  readRoutes: (root: string) => PathData[];
  readLinkConfig: (root: string) => LinkConfig;
  readSuppressionConfig: (root: string) => SuppressionRule[];
};
type CheckOptions = { strict?: boolean; json?: boolean };

export const runCheck = (
  root: string,
  deps: CheckDeps,
  options: CheckOptions,
): { report: string; exitCode: 0 | 1 | 2 } => {
  try {
    const config = deps.readLinkConfig(root);
    const targets = extractLinkTargets(config);
    const findings = [...runChecks(deps.readRoutes(root), targets), ...checkConfig(config)];
    const { active, suppressed } = applySuppressions(findings, deps.readSuppressionConfig(root));
    const report = options.json
      ? json.renderFindings(active, suppressed.length)
      : human.renderFindings(active, suppressed.length);
    return { report, exitCode: calculateExitCode(active, { strict: options.strict ?? false }) };
  } catch (error) {
    return { report: error instanceof Error ? error.message : String(error), exitCode: 2 };
  }
};
