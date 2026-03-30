import chalk from 'chalk';
import { getAgentConfig } from '../../types/agents.js';
import { ClaudeCodeExtractor } from '../../extractors/claude-code.js';
import { OpenCodeExtractor } from '../../extractors/opencode.js';
import { CursorExtractor } from '../../extractors/cursor.js';
import type { AgentType } from '../../types/index.js';

interface ListOptions {
  from: AgentType;
  project: string;
  json: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  const extractor = getExtractor(options.from);

  console.log(chalk.gray(`\nLooking for sessions in ${getAgentConfig(options.from).displayName}...`));
  const sessions = await extractor.listSessions(options.project);

  if (sessions.length === 0) {
    console.log(chalk.red('\n❌ No sessions found for this project.'));
    console.log(chalk.gray(`Make sure you have used ${getAgentConfig(options.from).displayName} in this project.`));
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify(sessions, null, 2));
  } else {
    console.log(chalk.bold.blue(`\nFound ${sessions.length} session(s) in ${getAgentConfig(options.from).displayName}:\n`));
    
    for (const session of sessions) {
      const date = new Date(session.updated_at).toLocaleString();
      const summary = session.summary ?? session.id.slice(0, 8);
      console.log(chalk.cyan(`  • ${summary}`));
      console.log(chalk.gray(`    ID: ${session.id}`));
      console.log(chalk.gray(`    Last updated: ${date}`));
      console.log();
    }
  }
}

function getExtractor(agent: AgentType) {
  switch (agent) {
    case 'claude-code':
      return new ClaudeCodeExtractor();
    case 'opencode':
      return new OpenCodeExtractor();
    case 'cursor':
      return new CursorExtractor();
    default:
      throw new Error(`Unknown agent: ${agent}`);
  }
}