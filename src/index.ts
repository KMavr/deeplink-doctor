#!/usr/bin/env node
import { createRequire } from 'node:module';
import { Command } from 'commander';
import { parseRoutes } from './parsers/routes.js';
import * as human from './report/human.js';
import * as json from './report/json.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string; description: string };

const program = new Command();
program.name('deeplink-doctor').description(pkg.description).version(pkg.version, '-v, --version');

program
  .command('routes')
  .description('Print the route tree parsed from the app/ directory')
  .option('--json', 'Emit machine-readable JSON; suppress human output')
  .action((options: { json?: boolean }) => {
    try {
      const routes = parseRoutes(process.cwd());
      if (options.json) {
        console.log(json.renderRoutes(routes));
      } else {
        console.log(human.renderRoutes(routes));
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    }
  });

program.parse(process.argv);
