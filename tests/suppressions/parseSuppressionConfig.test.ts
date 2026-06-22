import { describe, it, expect } from 'vitest';
import { parseSuppressionConfig } from '../../src/suppressions/parseSuppressionConfig.js';

/**
 * `parseSuppressionConfig(raw: unknown): SuppressionRule[]` — pure validation
 * of already-parsed JSON. Lenient on optional fields (reason/owner/route/
 * revisitWhen), strict on structure. Missing reason/owner is NOT an error here
 * (that becomes the DL901 governance warning in M6b).
 */

describe('parseSuppressionConfig', () => {
  describe('empty / absent shapes -> []', () => {
    it('treats undefined as no rules', () => {
      expect(parseSuppressionConfig(undefined)).toEqual([]);
    });

    it('treats null as no rules', () => {
      expect(parseSuppressionConfig(null)).toEqual([]);
    });

    it('treats an object without ignore as no rules', () => {
      expect(parseSuppressionConfig({})).toEqual([]);
    });

    it('treats an empty ignore array as no rules', () => {
      expect(parseSuppressionConfig({ ignore: [] })).toEqual([]);
    });
  });

  describe('well-formed rules', () => {
    it('carries every present field through', () => {
      const rule = {
        code: 'DL002',
        route: '/internal/debug',
        reason: 'admin-only screen',
        owner: 'kmavr',
        revisitWhen: 'expo-router@>=6',
      };
      expect(parseSuppressionConfig({ ignore: [rule] })).toEqual([rule]);
    });

    it('accepts an entry with only a code (reason/owner tolerated as missing)', () => {
      expect(parseSuppressionConfig({ ignore: [{ code: 'DL001' }] })).toEqual([{ code: 'DL001' }]);
    });

    it('keeps an unknown code (it simply will not match anything later)', () => {
      expect(parseSuppressionConfig({ ignore: [{ code: 'DLXYZ' }] })).toEqual([{ code: 'DLXYZ' }]);
    });

    it('ignores extra/unknown keys on an entry', () => {
      const out = parseSuppressionConfig({ ignore: [{ code: 'DL001', wat: true }] });
      expect(out).toEqual([{ code: 'DL001' }]);
    });

    it('preserves order and multiplicity', () => {
      const out = parseSuppressionConfig({
        ignore: [{ code: 'DL001' }, { code: 'DL002' }, { code: 'DL001' }],
      });
      expect(out.map((r) => r.code)).toEqual(['DL001', 'DL002', 'DL001']);
    });
  });

  describe('structural errors throw', () => {
    it('throws when the top level is not an object', () => {
      expect(() => parseSuppressionConfig('nope')).toThrow();
      expect(() => parseSuppressionConfig(42)).toThrow();
    });

    it('throws when ignore is present but not an array', () => {
      expect(() => parseSuppressionConfig({ ignore: {} })).toThrow();
      expect(() => parseSuppressionConfig({ ignore: 'DL001' })).toThrow();
    });

    it('throws when an entry lacks a string code', () => {
      expect(() => parseSuppressionConfig({ ignore: [{ reason: 'x' }] })).toThrow();
      expect(() => parseSuppressionConfig({ ignore: [{ code: 123 }] })).toThrow();
    });
  });
});
