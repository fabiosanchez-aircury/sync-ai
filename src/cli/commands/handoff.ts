import inquirer from 'inquirer';
import chalk from 'chalk';
import { getSupportedAgents, getAgentConfig } from '../types/agents';
import { ClaudeCodeExtractor } from '../extractors/claude-code';
import { OpenCodeExtractor } from '../extractors/opencode';
import { CursorExtractor } from '../extractors/cursor';
import { buildHandoff } from '../transformers';
import { OpenCodeInjector } from '../injectors/opencode';
import { CursorInjector } from '../injectors/cursor';
import type { AgentType, HandoffFormat } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

interface HandoffOptions {
  from?: AgentType;
  to?: AgentType;
  session?: string;
  project: string;
  output?: string;
}

export async function handoffCommand(options: HandoffOptions): Promise<void> {
  console.log(chalk.bold.blue('\n🔄 sync-ai: AI Session Handoff\n'));

  const supportedAgents = getSupportedAgents();
  
  // Get source agent
  let sourceAgent = options.from;
  if (!sourceAgent) {
    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'source',
      message: 'Select source agent:',
      choices: supportedAgents.map(a => ({
        name: getAgentConfig(a).displayName,
        value: a,
      })),
    }]);
    sourceAgent = answer.source;
  }

  // Get target agent
  let targetAgent = options.to;
  if (!targetAgent) {
    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'target',
      message: 'Select target agent:',
      choices: supportedAgents
        .filter(a => a !== sourceAgent)
        .map(a => ({
          name: getAgentConfig(a).displayName,
          value: a,
        })),
    }]);
    targetAgent = answer.target;
  }

  // Get extractor
  const extractor = getExtractor(sourceAgent);

  // List sessions
  console.log(chalk.gray(`\nLooking for sessions in ${getAgentConfig(sourceAgent).displayName}...`));
  const sessions = await extractor.listSessions(options.project);

  if (sessions.length === 0) {
    console.log(chalk.red('\n❌ No sessions found for this project.'));
    console.log(chalk.gray(`Make sure you have used ${getAgentConfig(sourceAgent).displayName} in this project.`));
    process.exit(1);
  }

  // Get session
  let sessionId = options.session;
  if (!sessionId) {
    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'session',
      message: 'Select session to transfer:',
      choices: sessions.slice(0, 20).map(s => ({
        name: `${s.summary || s.id.slice(0, 8)} - ${new Date(s.updated_at).toLocaleString()}`,
        value: s.id,
        short: s.id.slice(0, 8),
      })),
    }]);
    sessionId = answer.session;
  }

  // Extract session
  console.log(chalk.gray('\n📝 Extracting session...'));
  const session = await extractor.extractSession(sessionId, options.project);
  console.log(chalk.green(`✓ Extracted ${session.messages.length} messages`));

  // Transform to handoff format
  console.log(chalk.gray('🔄 Transforming session...'));
  const handoff = buildHandoff(session, targetAgent);

  // Inject or save
  if (options.output) {
    await fs.writeFile(options.output, JSON.stringify(handoff, null, 2));
    console.log(chalk.green(`\n✓ Handoff saved to ${options.output}`));
  } else {
    // Get injector
    const injector = getInjector(targetAgent);
    
    console.log(chalk.gray(`\n📤 Injecting into ${getAgentConfig(targetAgent).displayName}...`));
    const result = await injector.inject(handoff);

    if (result.success) {
      console.log(chalk.green('\n✅ Handoff complete!'));
      if (result.session_id) {
        console.log(chalk.gray(`   Session ID: ${result.session_id}`));
      }
      console.log(chalk.gray(`\nYou can now continue working in ${getAgentConfig(targetAgent).displayName}.`));
    } else {
      console.log(chalk.red('\n❌ Handoff failed:'), result.error);
      process.exit(1);
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

function getInjector(agent: AgentType) {
  switch (agent) {
    case 'opencode':
      return new OpenCodeInjector();
    case 'cursor':
      return new CursorInjector();
    default:
      throw new Error(`Injection not supported for agent: ${agent}`);
  }
}