import type { Finding } from '../types.js';

export const calculateExitCode = (findings: Finding[], options: { strict: boolean }): 0 | 1 =>
  findings.some(({ severity }) => severity === 'error' || (severity === 'warn' && options.strict))
    ? 1
    : 0;
