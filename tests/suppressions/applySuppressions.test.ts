import { describe, it, expect } from 'vitest';
import { applySuppressions } from '../../src/suppressions/applySuppressions.js';
import type { Finding, SuppressionRule } from '../../src/types.js';

/**
 * `applySuppressions(findings, rules) -> { active, suppressed }`
 *
 *   - a finding matched by a rule moves to `suppressed`
 *   - an incomplete rule (missing reason/owner) STILL suppresses, plus emits
 *     a DL901 (warn) into `active`
 *   - a rule with an unknown (non-check) code emits a DL902 (warn) likely-typo
 *   - a valid-code rule that matches nothing is silent (preemptive suppression)
 *
 * Match: rule.code === finding.code AND (no rule.route, OR rule.route equals
 * the finding's `route` or `target`).
 */

const finding = (over: Partial<Finding> = {}): Finding => ({
  code: 'DL002',
  severity: 'warn',
  message: 'm',
  ...over,
});

const rule = (over: Partial<SuppressionRule> = {}): SuppressionRule => ({
  code: 'DL002',
  reason: 'r',
  owner: 'o',
  ...over,
});

const codes = (fs: Finding[]) => fs.map((f) => f.code);

describe('applySuppressions', () => {
  it('with no rules, every finding stays active', () => {
    const fs = [finding(), finding({ code: 'DL001' })];
    expect(applySuppressions(fs, [])).toEqual({ active: fs, suppressed: [] });
  });

  describe('matching', () => {
    it('a complete rule suppresses a finding matched by route (DL002.route)', () => {
      const f = finding({ code: 'DL002', route: '/debug' });
      const result = applySuppressions([f], [rule({ code: 'DL002', route: '/debug' })]);
      expect(result.active).toEqual([]);
      expect(result.suppressed).toEqual([f]);
    });

    it('a route-less rule suppresses ALL findings of its code', () => {
      const fs = [finding({ route: '/a' }), finding({ route: '/b' }), finding({ code: 'DL001' })];
      const result = applySuppressions(fs, [rule({ code: 'DL002' })]);
      expect(codes(result.suppressed)).toEqual(['DL002', 'DL002']);
      expect(codes(result.active)).toEqual(['DL001']);
    });

    it("matches a DL001 finding via the rule's route against the finding target", () => {
      const f = finding({ code: 'DL001', severity: 'error', target: '/ghost' });
      const result = applySuppressions([f], [rule({ code: 'DL001', route: '/ghost' })]);
      expect(result.suppressed).toEqual([f]);
    });

    it('does not suppress when the route does not match', () => {
      const f = finding({ code: 'DL002', route: '/a' });
      const result = applySuppressions([f], [rule({ code: 'DL002', route: '/b' })]);
      expect(result.active).toEqual([f]);
      expect(result.suppressed).toEqual([]);
    });

    it('a complete rule that matches nothing is silent (no governance finding)', () => {
      const f = finding({ code: 'DL002', route: '/a' });
      const result = applySuppressions([f], [rule({ code: 'DL002', route: '/never' })]);
      expect(result.active).toEqual([f]);
    });
  });

  describe('DL901 — missing reason/owner', () => {
    it('an incomplete rule still suppresses AND emits one DL901 warn', () => {
      const f = finding({ code: 'DL002', route: '/debug' });
      const result = applySuppressions([f], [rule({ route: '/debug', owner: undefined })]);
      expect(result.suppressed).toEqual([f]);
      const gov = result.active.filter((g) => g.code === 'DL901');
      expect(gov).toHaveLength(1);
      expect(gov[0]?.severity).toBe('warn');
    });

    it('emits exactly one DL901 even when the rule matches several findings', () => {
      const fs = [finding({ route: '/a' }), finding({ route: '/b' })];
      const result = applySuppressions(fs, [rule({ reason: undefined })]);
      expect(result.active.filter((g) => g.code === 'DL901')).toHaveLength(1);
    });
  });

  describe('DL902 — unknown code (likely typo)', () => {
    it('warns on a rule whose code is not a real check code', () => {
      const result = applySuppressions([finding()], [rule({ code: 'DL020' })]);
      expect(result.active.filter((g) => g.code === 'DL902')).toHaveLength(1);
      // the typo'd rule suppresses nothing
      expect(result.suppressed).toEqual([]);
    });

    it('does NOT warn (DL902) for a valid code that simply matches no finding', () => {
      const result = applySuppressions([finding({ code: 'DL002' })], [rule({ code: 'DL003' })]);
      expect(result.active.filter((g) => g.code === 'DL902')).toEqual([]);
    });
  });

  it('orders active as surviving findings first, then governance findings', () => {
    const fs = [finding({ code: 'DL001', severity: 'error', target: '/x' })];
    const result = applySuppressions(fs, [rule({ code: 'DL020' })]); // unknown -> DL902
    expect(codes(result.active)).toEqual(['DL001', 'DL902']);
  });
});
