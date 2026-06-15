import { existsSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parseRoutePath } from '../lib/parseRoutePath.js';
import type { PathData } from '../types.js';

const ROUTE_FILE = /(?<!\.(d|test|stories|spec))\.(js|ts|jsx|tsx)$/;

const resolveAppDir = (projectRoot: string): string => {
  const appPath = join(projectRoot, 'app');
  if (existsSync(appPath)) {
    return appPath;
  }
  const srcAppPath = join(projectRoot, 'src', 'app');
  if (existsSync(srcAppPath)) {
    return srcAppPath;
  }
  throw new Error(
    `No expo-router app directory found in "${projectRoot}" (looked for ./app and ./src/app).`,
  );
};

export const parseRoutes = (projectRoot: string): PathData[] => {
  const appDir = resolveAppDir(projectRoot);

  return readdirSync(appDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && ROUTE_FILE.test(entry.name))
    .map(({ name, parentPath }) =>
      parseRoutePath(relative(appDir, join(parentPath, name)).split(sep).join('/')),
    )
    .sort((a, b) => a.filePath.localeCompare(b.filePath));
};
