import { describe, it, expect, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(() => JSON.stringify({ scheme: 'draft' })),
}));

import { execFileSync } from 'node:child_process';
import { readLinkConfig } from '../../src/parsers/expoConfig.js';

describe('readLinkConfig default runner', () => {
  it('shells out to `npx expo config --json` in the project root', () => {
    const result = readLinkConfig('/my/project');

    expect(execFileSync).toHaveBeenCalledWith('npx', ['expo', 'config', '--json'], {
      cwd: '/my/project',
      encoding: 'utf8',
    });
    expect(result.schemes).toEqual(['draft']);
  });
});
