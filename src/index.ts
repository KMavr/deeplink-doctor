#!/usr/bin/env node
import { createRequire } from 'node:module';
import { Command } from 'commander';
import { runCheck } from './commands/check.js';
import { readLinkConfig } from './parsers/expoConfig.js';
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

program
  .command('check')
  .description('Reconcile routes against native deep-link config and report mismatches')
  .option('--json', 'Emit machine-readable JSON; suppress human output')
  .option('--strict', 'Promote warnings to failures (exit non-zero on any finding)')
  .action((options: { json?: boolean; strict?: boolean }) => {
    const { report, exitCode } = runCheck(
      process.cwd(),
      { readRoutes: parseRoutes, readLinkConfig },
      options,
    );
    if (exitCode === 2) {
      console.error(report);
    } else {
      console.log(report);
    }
    process.exitCode = exitCode;
  });

program.parse(process.argv);
