import { generateFinding } from '../lib/generateFinding.js';
import { CHECK_CODES, type Finding, type SuppressionRule } from '../types.js';

const isCheckCode = (code: string): boolean => (CHECK_CODES as readonly string[]).includes(code);

const matches = (rule: SuppressionRule, finding: Finding): boolean =>
  rule.code === finding.code &&
  (!rule.route || rule.route === finding.route || rule.route === finding.target);

export const applySuppressions = (
  findings: Finding[],
  rules: SuppressionRule[],
): { active: Finding[]; suppressed: Finding[] } => {
  const result = findings.reduce(
    (acc, cur) => {
      if (rules.some((rule) => matches(rule, cur))) {
        return {
          active: acc.active,
          suppressed: [...acc.suppressed, cur],
        };
      }
      return {
        active: [...acc.active, cur],
        suppressed: acc.suppressed,
      };
    },
    { active: [], suppressed: [] } as { active: Finding[]; suppressed: Finding[] },
  );

  const ruleFindings = rules.flatMap((rule): Finding[] => {
    const route = rule.route ? { route: rule.route } : {};
    if (!isCheckCode(rule.code)) {
      return [
        generateFinding(
          'DL902',
          `Suppression for unknown code "${rule.code}" — possible typo`,
          route,
        ),
      ];
    }
    if (!rule?.reason || !rule?.owner) {
      return [
        generateFinding(
          'DL901',
          `Suppression for ${rule.code} is missing a reason and/or owner`,
          route,
        ),
      ];
    }
    return [];
  });

  return {
    active: [...result.active, ...ruleFindings],
    suppressed: result.suppressed,
  };
};
