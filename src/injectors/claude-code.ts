import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { BaseInjector } from './base.js';
import type { AgentType, HandoffFormat } from '../types/index.js';

export class ClaudeCodeInjector extends BaseInjector {
  readonly agent: AgentType = 'claude-code';

  async inject(handoff: HandoffFormat): Promise<{ 
    success: boolean; 
    session_id?: string; 
    error?: string 
  }> {
    const validation = await this.validateHandoff(handoff);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid handoff: ${validation.errors.join(', ')}`,
      };
    }

    try {
      const sessionId = crypto.randomUUID();
      const encodedPath = this.encodeProjectPath(handoff.metadata.project.path);
      const claudeDir = path.join(os.homedir(), '.claude', 'projects', encodedPath);
      
      await fs.mkdir(claudeDir, { recursive: true });

      const sessionFile = path.join(claudeDir, `${sessionId}.jsonl`);
      const lines = this.formatAsClaudeSession(handoff, sessionId);
      
      await fs.writeFile(sessionFile, lines.join('\n'));

      return {
        success: true,
        session_id: sessionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during injection',
      };
    }
  }

  private encodeProjectPath(projectPath: string): string {
    return projectPath.replace(/^\//, '').replace(/\//g, '-').replace(/^/, '-');
  }

  private formatAsClaudeSession(handoff: HandoffFormat, sessionId: string): string[] {
    const lines: string[] = [];
    const cwd = handoff.metadata.project.path;
    const timestamp = new Date().toISOString();
    const promptId = crypto.randomUUID();
    const version = '2.1.73';
    const gitBranch = handoff.metadata.project.git_branch || 'main';

    const contextMessage = this.buildContextMessage(handoff);
    const firstUserUuid = crypto.randomUUID();
    
    lines.push(JSON.stringify({
      parentUuid: null,
      isSidechain: false,
      promptId,
      userType: 'external',
      cwd,
      sessionId,
      version,
      gitBranch,
      type: 'user',
      message: {
        role: 'user',
        content: contextMessage,
      },
      uuid: firstUserUuid,
      timestamp,
      permissionMode: 'default',
    }));

    const assistantUuid = crypto.randomUUID();
    const continuationPrompt = this.buildAssistantMessage(handoff);
    
    lines.push(JSON.stringify({
      parentUuid: firstUserUuid,
      isSidechain: false,
      userType: 'external',
      cwd,
      sessionId,
      version,
      gitBranch,
      message: {
        model: 'claude-sonnet-4-6',
        id: `msg_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`,
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: continuationPrompt,
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 200,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      },
      requestId: `req_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`,
      type: 'assistant',
      uuid: assistantUuid,
      timestamp: new Date(Date.now() + 1000).toISOString(),
    }));

    const keyMessages = handoff.conversation.key_messages || [];
    let lastUuid = assistantUuid;
    
    for (const msg of keyMessages.slice(0, 5)) {
      const msgUuid = crypto.randomUUID();
      
      if (msg.role === 'user') {
        lines.push(JSON.stringify({
          parentUuid: lastUuid,
          isSidechain: false,
          promptId,
          userType: 'external',
          cwd,
          sessionId,
          version,
          gitBranch,
          type: 'user',
          message: {
            role: 'user',
            content: msg.content,
          },
          uuid: msgUuid,
          timestamp: new Date(Date.now() + Math.random() * 1000).toISOString(),
          permissionMode: 'default',
        }));
      } else if (msg.role === 'assistant') {
        lines.push(JSON.stringify({
          parentUuid: lastUuid,
          isSidechain: false,
          userType: 'external',
          cwd,
          sessionId,
          version,
          gitBranch,
          message: {
            model: 'claude-sonnet-4-6',
            id: `msg_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`,
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: msg.content,
              },
            ],
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: {
              input_tokens: 50,
              output_tokens: 100,
              cache_creation_input_tokens: 0,
              cache_read_input_tokens: 0,
            },
          },
          requestId: `req_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`,
          type: 'assistant',
          uuid: msgUuid,
          timestamp: new Date(Date.now() + Math.random() * 1000).toISOString(),
        }));
      }
      
      lastUuid = msgUuid;
    }

    lines.push('');

    return lines;
  }

  private buildContextMessage(handoff: HandoffFormat): string {
    let content = `I'm continuing a session from ${handoff.metadata.source.agent}. Here's the context:\n\n`;
    
    content += `## Goal\n${handoff.summary.goal}\n\n`;
    
    content += `## Progress\n`;
    content += `- Status: ${handoff.summary.status}\n`;
    content += `- Completion: ${handoff.summary.progress_percentage}%\n`;
    if (handoff.summary.current_task) {
      content += `- Current Task: ${handoff.summary.current_task}\n`;
    }
    content += '\n';

    if (handoff.summary.blockers && handoff.summary.blockers.length > 0) {
      content += `## Blockers\n`;
      handoff.summary.blockers.forEach((b: string) => {
        content += `- ${b}\n`;
      });
      content += '\n';
    }

    if (handoff.context.decisions.length > 0) {
      content += `## Key Decisions\n`;
      handoff.context.decisions.slice(0, 5).forEach((d: { decision: string; rationale?: string }) => {
        content += `- ${d.decision}\n`;
        if (d.rationale) {
          content += `  - Rationale: ${d.rationale}\n`;
        }
      });
      content += '\n';
    }

    if (handoff.context.learnings.length > 0) {
      content += `## Learnings\n`;
      handoff.context.learnings.slice(0, 5).forEach((l: string) => {
        content += `- ${l}\n`;
      });
      content += '\n';
    }

    if (handoff.files.modified.length > 0 || handoff.files.created.length > 0) {
      content += `## Files Changed\n`;
      if (handoff.files.modified.length > 0) {
        content += `### Modified\n`;
        handoff.files.modified.slice(0, 10).forEach((f: { path: string; summary?: string }) => {
          content += `- \`${f.path}\`\n`;
        });
        content += '\n';
      }
      if (handoff.files.created.length > 0) {
        content += `### Created\n`;
        handoff.files.created.slice(0, 10).forEach((f: string) => {
          content += `- \`${f}\`\n`;
        });
        content += '\n';
      }
    }

    if (handoff.continuation.files_to_focus.length > 0) {
      content += `## Files to Focus\n`;
      handoff.continuation.files_to_focus.slice(0, 5).forEach((f: string) => {
        content += `- \`${f}\`\n`;
      });
      content += '\n';
    }

    content += `## Next Steps\n`;
    content += `${handoff.continuation.suggested_first_action}\n\n`;

    content += `Please continue from where we left off, maintaining consistency with the decisions and patterns already established.`;

    return content;
  }

  private buildAssistantMessage(handoff: HandoffFormat): string {
    let content = `I understand the context from your previous session. Let me summarize where we are:\n\n`;
    
    content += `**Goal:** ${handoff.summary.goal}\n\n`;
    content += `**Progress:** ${handoff.summary.progress_percentage}% complete\n\n`;
    
    if (handoff.summary.blockers && handoff.summary.blockers.length > 0) {
      content += `**Current Blockers:**\n`;
      handoff.summary.blockers.forEach((b: string) => {
        content += `- ${b}\n`;
      });
      content += '\n';
    }

    content += handoff.continuation.prompt;

    return content;
  }
}