import { calculateExitCode } from '../checks/calculateExitCode.js';
import { checkConfig } from '../checks/checkConfig.js';
import { checkRemote } from '../checks/checkRemote.js';
import { runChecks } from '../checks/runChecks.js';
import { extractDomains } from '../links/extractDomains.js';
import { extractLinkTargets } from '../links/extractLinkTargets.js';
import * as human from '../report/human.js';
import * as json from '../report/json.js';
import { applySuppressions } from '../suppressions/applySuppressions.js';
import type { Associations, Finding, LinkConfig, PathData, SuppressionRule } from '../types.js';

type CheckDeps = {
  readRoutes: (root: string) => PathData[];
  readLinkConfig: (root: string) => LinkConfig;
  readSuppressionConfig: (root: string, configPath?: string) => SuppressionRule[];
  loadAssociations: (domain: string) => Promise<Associations>;
};
type CheckOptions = {
  strict?: boolean;
  json?: boolean;
  remote?: boolean;
  domain?: string;
  config?: string;
};

const remoteFindings = async (
  config: LinkConfig,
  options: CheckOptions,
  loadAssociations: CheckDeps['loadAssociations'],
): Promise<Finding[]> => {
  if (!options.remote) {
    return [];
  }

  const domains = options.domain ? [options.domain] : extractDomains(config);
  const associations = await Promise.all(domains.map((domain) => loadAssociations(domain)));
  return associations.flatMap((association) => [
    ...association.findings,
    ...checkRemote(association.aasa, association.assetlinks, config),
  ]);
};

export const runCheck = async (
  root: string,
  deps: CheckDeps,
  options: CheckOptions,
): Promise<{ report: string; exitCode: 0 | 1 | 2 }> => {
  try {
    const config = deps.readLinkConfig(root);
    const targets = extractLinkTargets(config);
    const findings = [
      ...runChecks(deps.readRoutes(root), targets),
      ...checkConfig(config),
      ...(await remoteFindings(config, options, deps.loadAssociations)),
    ];

    const { active, suppressed } = applySuppressions(
      findings,
      deps.readSuppressionConfig(root, options.config),
    );
    const report = options.json
      ? json.renderFindings(active, suppressed.length)
      : human.renderFindings(active, suppressed.length);
    return { report, exitCode: calculateExitCode(active, { strict: options.strict ?? false }) };
  } catch (error) {
    return { report: error instanceof Error ? error.message : String(error), exitCode: 2 };
  }
};
