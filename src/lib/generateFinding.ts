import { FINDING_SEVERITIES } from '../config/findingSeverities.js';
import type { Finding, FindingCode } from '../types.js';

export const generateFinding = (
  code: FindingCode,
  message: string,
  extra: { route?: string; target?: string } = {},
): Finding => ({
  code,
  severity: FINDING_SEVERITIES[code],
  message,
  ...extra,
});
