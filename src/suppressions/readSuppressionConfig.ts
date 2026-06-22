import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SuppressionRule } from '../types.js';
import { parseSuppressionConfig } from './parseSuppressionConfig.js';

export const CONFIG_FILENAME = 'deeplink.config.json';

type ConfigReader = (projectRoot: string) => string | undefined;

const defaultRead: ConfigReader = (projectRoot) => {
  try {
    return readFileSync(join(projectRoot, CONFIG_FILENAME), 'utf8');
  } catch {
    return undefined;
  }
};

export const readSuppressionConfig = (
  projectRoot: string,
  read: ConfigReader = defaultRead,
): SuppressionRule[] => {
  const contents = read(projectRoot);
  if (contents === undefined) {
    return [];
  }

  try {
    return parseSuppressionConfig(JSON.parse(contents));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read "${CONFIG_FILENAME}" in "${projectRoot}": ${reason}.`, {
      cause: error,
    });
  }
};
