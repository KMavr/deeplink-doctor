import { describe, it, expect } from 'vitest';
import { readSuppressionConfig } from '../../src/suppressions/readSuppressionConfig.js';

/**
 * `readSuppressionConfig(projectRoot, configPath?, read?)` — thin fs adapter.
 * The `read` dependency is injected (returns the file's contents, or undefined
 * if absent) so these tests never touch the real filesystem. `configPath` is
 * the `--config` override; absent, the reader falls back to the project root.
 * Delegates validation to parseSuppressionConfig.
 */

describe('readSuppressionConfig', () => {
  it('returns [] when the default config file is absent', () => {
    const read = () => undefined;
    expect(readSuppressionConfig('/root', undefined, read)).toEqual([]);
  });

  it('parses a present, valid config file', () => {
    const read = () =>
      JSON.stringify({
        ignore: [{ code: 'DL002', route: '/x', reason: 'r', owner: 'o' }],
      });
    const rules = readSuppressionConfig('/root', undefined, read);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ code: 'DL002', route: '/x' });
  });

  it('throws, naming the config file, on invalid JSON', () => {
    const read = () => '{ not json';
    expect(() => readSuppressionConfig('/root', undefined, read)).toThrow(/deeplink\.config\.json/);
  });

  it('throws, naming the config file, when validation fails', () => {
    const read = () => JSON.stringify({ ignore: 'not-an-array' });
    expect(() => readSuppressionConfig('/root', undefined, read)).toThrow(/deeplink\.config\.json/);
  });

  it('passes the project root to the reader', () => {
    let seen = '';
    const read = (root: string) => {
      seen = root;
      return undefined;
    };
    readSuppressionConfig('/some/project', undefined, read);
    expect(seen).toBe('/some/project');
  });

  it('forwards an explicit --config path to the reader', () => {
    let seenPath: string | undefined = '';
    const read = (_root: string, configPath?: string) => {
      seenPath = configPath;
      return JSON.stringify({ ignore: [] });
    };
    readSuppressionConfig('/root', './custom/dl.json', read);
    expect(seenPath).toBe('./custom/dl.json');
  });

  it('throws when an explicit --config path is missing (vs silent default)', () => {
    const read = () => undefined;
    expect(() => readSuppressionConfig('/root', './nope.json', read)).toThrow(/nope\.json/);
  });

  it('names the explicit path in a parse error', () => {
    const read = () => '{ not json';
    expect(() => readSuppressionConfig('/root', './custom/dl.json', read)).toThrow(
      /custom\/dl\.json/,
    );
  });
});
