#!/usr/bin/env node

import { Command } from 'commander';
import { handoffCommand } from './commands/handoff';
import { listCommand } from './commands/list';

const program = new Command();

program
  .name('sync-ai')
  .description('AI Session Handoff Tool - Transfer context between AI coding agents')
  .version('0.1.0');

program
  .command('handoff')
  .description('Transfer session context from one AI agent to another')
  .option('-f, --from <agent>', 'Source agent (claude-code, opencode, cursor)')
  .option('-t, --to <agent>', 'Target agent (opencode, cursor, claude-code)')
  .option('-s, --session <id>', 'Session ID to transfer')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .option('-o, --output <file>', 'Output file for handoff JSON')
  .action(handoffCommand);

program
  .command('list')
  .description('List available sessions from an AI agent')
  .requiredOption('-f, --from <agent>', 'Source agent (claude-code, opencode, cursor)')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .option('--json', 'Output as JSON')
  .action(listCommand);

program.parse();