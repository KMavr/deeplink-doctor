import type { SuppressionRule } from '../types.js';

export const parseSuppressionConfig = (raw: unknown): SuppressionRule[] => {
  if (raw === null || raw === undefined) {
    return [];
  }

  if (typeof raw !== 'object') {
    throw new Error('deeplink config must be an object');
  }

  const { ignore } = raw as { ignore?: unknown };
  if (ignore === undefined) {
    return [];
  }
  if (!Array.isArray(ignore)) {
    throw new Error('`ignore` must be an array');
  }

  return ignore.map((rule: Record<string, unknown>) => {
    if (typeof rule?.code !== 'string') {
      throw new Error('each ignore entry needs a string code');
    }
    return {
      code: rule.code,
      ...(rule?.route ? { route: rule.route as string } : {}),
      ...(rule?.reason ? { reason: rule.reason as string } : {}),
      ...(rule?.owner ? { owner: rule.owner as string } : {}),
      ...(rule?.revisitWhen ? { revisitWhen: rule.revisitWhen as string } : {}),
    };
  });
};
