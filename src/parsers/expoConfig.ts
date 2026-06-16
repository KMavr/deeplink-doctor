import { execFileSync } from 'node:child_process';
import { extractLinkConfig } from '../lib/extractLinkConfig.js';
import type { LinkConfig, ResolvedExpoConfig } from '../types.js';

type ConfigRunner = (projectRoot: string) => string;

const runExpoConfig: ConfigRunner = (projectRoot) =>
  execFileSync('npx', ['expo', 'config', '--json'], { cwd: projectRoot, encoding: 'utf8' });

export const readLinkConfig = (
  projectRoot: string,
  run: ConfigRunner = runExpoConfig,
): LinkConfig => {
  try {
    const runOutput = run(projectRoot);
    const parsed = JSON.parse(runOutput);

    return extractLinkConfig(parsed as ResolvedExpoConfig);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to read Expo config via \`npx expo config --json\` in "${projectRoot}": ${reason}. ` +
        `Ensure this is an Expo project with expo installed.`,
      { cause: error },
    );
  }
};
