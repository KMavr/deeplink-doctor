import { describe, it, expect } from 'vitest';
import { calculateExitCode } from '../../src/checks/calculateExitCode.js';
import type { Finding } from '../../src/types.js';

/**
 * `calculateExitCode(findings, { strict }) -> 0 | 1`
 *
 * Policy: 0 = no failures, 1 = at least one finding at FAILURE severity.
 *   - `error` always fails.
 *   - `warn` fails only under `--strict` (otherwise advisory).
 * Tool/usage errors (exit 2) are the CLI's concern, not this function's.
 */

const finding = (severity: Finding['severity']): Finding => ({
  code: severity === 'error' ? 'DL001' : 'DL002',
  severity,
  message: 'x',
});

describe('calculateExitCode', () => {
  it('returns 0 for no findings (non-strict)', () => {
    expect(calculateExitCode([], { strict: false })).toBe(0);
  });

  it('returns 0 for no findings (strict)', () => {
    expect(calculateExitCode([], { strict: true })).toBe(0);
  });

  it('returns 1 for an error finding (non-strict)', () => {
    expect(calculateExitCode([finding('error')], { strict: false })).toBe(1);
  });

  it('returns 1 for an error finding (strict)', () => {
    expect(calculateExitCode([finding('error')], { strict: true })).toBe(1);
  });

  it('returns 0 for warn-only findings when not strict', () => {
    expect(calculateExitCode([finding('warn'), finding('warn')], { strict: false })).toBe(0);
  });

  it('returns 1 for warn-only findings under strict', () => {
    expect(calculateExitCode([finding('warn')], { strict: true })).toBe(1);
  });

  it('returns 1 for mixed findings when not strict', () => {
    expect(calculateExitCode([finding('warn'), finding('error')], { strict: false })).toBe(1);
  });

  it('returns 1 for mixed findings under strict', () => {
    expect(calculateExitCode([finding('warn'), finding('error')], { strict: true })).toBe(1);
  });
});
