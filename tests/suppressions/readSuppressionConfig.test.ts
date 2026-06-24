import { describe, it, expect } from 'vitest';
import { readSuppressionConfig } from '../../src/suppressions/readSuppressionConfig.js';

/**
 * `readSuppressionConfig(projectRoot, read?)` — thin fs adapter. The `read`
 * dependency is injected (returns the file's contents, or undefined if absent)
 * so these tests never touch the real filesystem. Delegates validation to
 * parseSuppressionConfig.
 */

describe('readSuppressionConfig', () => {
  it('returns [] when the config file is absent', () => {
    const read = () => undefined;
    expect(readSuppressionConfig('/root', read)).toEqual([]);
  });

  it('parses a present, valid config file', () => {
    const read = () =>
      JSON.stringify({
        ignore: [{ code: 'DL002', route: '/x', reason: 'r', owner: 'o' }],
      });
    const rules = readSuppressionConfig('/root', read);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ code: 'DL002', route: '/x' });
  });

  it('throws, naming the config file, on invalid JSON', () => {
    const read = () => '{ not json';
    expect(() => readSuppressionConfig('/root', read)).toThrow(/deeplink\.config\.json/);
  });

  it('throws, naming the config file, when validation fails', () => {
    const read = () => JSON.stringify({ ignore: 'not-an-array' });
    expect(() => readSuppressionConfig('/root', read)).toThrow(/deeplink\.config\.json/);
  });

  it('passes the project root to the reader', () => {
    let seen = '';
    const read = (root: string) => {
      seen = root;
      return undefined;
    };
    readSuppressionConfig('/some/project', read);
    expect(seen).toBe('/some/project');
  });
});
