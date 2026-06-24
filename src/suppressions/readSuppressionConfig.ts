import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SuppressionRule } from '../types.js';
import { parseSuppressionConfig } from './parseSuppressionConfig.js';

export const CONFIG_FILENAME = 'deeplink.config.json';

type ConfigReader = (projectRoot: string, configPath?: string) => string | undefined;

const defaultRead: ConfigReader = (projectRoot, configPath) => {
  try {
    return readFileSync(configPath ?? join(projectRoot, CONFIG_FILENAME), 'utf8');
  } catch {
    return undefined;
  }
};

export const readSuppressionConfig = (
  projectRoot: string,
  configPath?: string,
  read: ConfigReader = defaultRead,
): SuppressionRule[] => {
  const contents = read(projectRoot, configPath);
  const source = configPath ?? CONFIG_FILENAME;

  if (contents === undefined) {
    if (configPath !== undefined) {
      throw new Error(`Suppression config not found at "${configPath}".`);
    }
    return [];
  }

  try {
    return parseSuppressionConfig(JSON.parse(contents));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read "${source}" in "${projectRoot}": ${reason}.`, {
      cause: error,
    });
  }
};
