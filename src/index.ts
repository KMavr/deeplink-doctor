#!/usr/bin/env node
import { createRequire } from 'node:module';
import chalk from 'chalk';
import { Command } from 'commander';
import { runCheck } from './commands/check.js';
import { readLinkConfig } from './parsers/expoConfig.js';
import { parseRoutes } from './parsers/routes.js';
import * as human from './report/human.js';
import * as json from './report/json.js';
import { loadAssociations } from './sources/loadAssociations.js';
import { readSuppressionConfig } from './suppressions/readSuppressionConfig.js';

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
  .command('check', { isDefault: true })
  .description('Reconcile routes against native deep-link config and report mismatches')
  .option('--json', 'Emit machine-readable JSON; suppress human output')
  .option('--strict', 'Promote warnings to failures (exit non-zero on any finding)')
  .option(
    '--remote',
    'Also fetch and check hosted association files (AASA, assetlinks) — makes network requests',
  )
  .option('--domain <host>', 'Override the domain(s) probed by --remote')
  .option('--config <path>', 'Path to a deeplink.config.json (defaults to the project root)')
  .option('--silent', 'Hide warnings (errors only); ignored when --strict is set')
  .option('--explain', 'Append a long-form explanation to each finding')
  .action(
    async (options: {
      json?: boolean;
      strict?: boolean;
      remote?: boolean;
      domain?: string;
      config?: string;
      silent?: boolean;
      explain?: boolean;
    }) => {
      if (options.domain && !options.remote) {
        console.warn(
          chalk.yellow(
            'Warning: --domain has no effect without --remote; no association files will be fetched',
          ),
        );
      }
      const { report, exitCode } = await runCheck(
        process.cwd(),
        { readRoutes: parseRoutes, readLinkConfig, readSuppressionConfig, loadAssociations },
        options,
      );
      if (exitCode === 2) {
        console.error(report);
      } else {
        console.log(report);
      }
      process.exitCode = exitCode;
    },
  );

program.parse(process.argv);
