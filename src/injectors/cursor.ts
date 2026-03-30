import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { BaseInjector } from './base.js';
import type { AgentType, HandoffFormat } from '../types/index.js';

export class CursorInjector extends BaseInjector {
  readonly agent: AgentType = 'cursor';

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
      const transcriptsDir = path.join(
        os.homedir(),
        '.cursor',
        'projects',
        encodedPath,
        'agent-transcripts',
        sessionId
      );

      await fs.mkdir(transcriptsDir, { recursive: true });

      const transcriptFile = path.join(transcriptsDir, `${sessionId}.jsonl`);
      const transcriptContent = this.formatAsTranscript(handoff);
      await fs.writeFile(transcriptFile, transcriptContent);

      const rulesDir = path.join(handoff.metadata.project.path, '.cursor', 'rules');
      await fs.mkdir(rulesDir, { recursive: true });
      
      const rulesFile = path.join(rulesDir, 'sync-ai-handoff.md');
      const rulesContent = this.formatAsCursorRules(handoff);
      await fs.writeFile(rulesFile, rulesContent);

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
    return projectPath.replace(/^\//, '').replace(/\//g, '-');
  }

  private formatAsTranscript(handoff: HandoffFormat): string {
    const lines: string[] = [];

    const contextMessage = this.buildContextMessage(handoff);
    lines.push(JSON.stringify({
      role: 'user',
      message: {
        content: [{ type: 'text', text: contextMessage }]
      }
    }));

    const continuationPrompt = `I'll continue from where we left off. Here's what we were working on:

**Goal:** ${handoff.summary.goal}

**Progress:** ${handoff.summary.progress_percentage}%

**Next Steps:**
${handoff.continuation.suggested_first_action}

Please review the context above and let me know if you have any questions before we continue.`;

    lines.push(JSON.stringify({
      role: 'assistant',
      message: {
        content: [{ type: 'text', text: continuationPrompt }]
      }
    }));

    const keyMessages = handoff.conversation.key_messages || [];
    for (const msg of keyMessages.slice(0, 10)) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        lines.push(JSON.stringify({
          role: msg.role,
          message: {
            content: [{ type: 'text', text: msg.content }]
          }
        }));
      }
    }

    return lines.join('\n');
  }

  private buildContextMessage(handoff: HandoffFormat): string {
    let message = `<user_query>\nSession Handoff from ${handoff.metadata.source.agent}\n\n`;
    
    message += `## Goal\n${handoff.summary.goal}\n\n`;
    
    message += `## Progress\n`;
    message += `- Status: ${handoff.summary.status}\n`;
    message += `- Completion: ${handoff.summary.progress_percentage}%\n`;
    if (handoff.summary.current_task) {
      message += `- Current Task: ${handoff.summary.current_task}\n`;
    }
    message += '\n';

    if (handoff.summary.blockers && handoff.summary.blockers.length > 0) {
      message += `## Blockers\n`;
      handoff.summary.blockers.forEach((b: string) => {
        message += `- ${b}\n`;
      });
      message += '\n';
    }

    if (handoff.context.decisions.length > 0) {
      message += `## Key Decisions\n`;
      handoff.context.decisions.slice(0, 5).forEach((d: { decision: string; rationale?: string }) => {
        message += `- **${d.decision}**\n`;
        if (d.rationale) {
          message += `  - Rationale: ${d.rationale}\n`;
        }
      });
      message += '\n';
    }

    if (handoff.context.learnings.length > 0) {
      message += `## Learnings\n`;
      handoff.context.learnings.slice(0, 5).forEach((l: string) => {
        message += `- ${l}\n`;
      });
      message += '\n';
    }

    if (handoff.files.modified.length > 0) {
      message += `## Files Modified\n`;
      handoff.files.modified.slice(0, 10).forEach((f: { path: string; summary?: string }) => {
        message += `- \`${f.path}\``;
        if (f.summary) {
          message += `: ${f.summary}`;
        }
        message += '\n';
      });
      message += '\n';
    }

    if (handoff.continuation.files_to_focus.length > 0) {
      message += `## Files to Focus\n`;
      handoff.continuation.files_to_focus.slice(0, 5).forEach((f: string) => {
        message += `- \`${f}\`\n`;
      });
      message += '\n';
    }

    message += `</user_query>`;
    return message;
  }

  private formatAsCursorRules(handoff: HandoffFormat): string {
    let content = `# Session Handoff Context\n\n`;
    content += `Transferred from ${handoff.metadata.source.agent} on ${handoff.metadata.source.timestamp}\n\n`;
    
    content += `## Current Goal\n`;
    content += `${handoff.summary.goal}\n\n`;
    
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
      content += `## Key Decisions Made\n`;
      content += `Follow these decisions for consistency:\n\n`;
      handoff.context.decisions.forEach((d: { decision: string; rationale?: string; alternatives_considered: string[] }) => {
        content += `### ${d.decision}\n`;
        if (d.rationale) {
          content += `Rationale: ${d.rationale}\n`;
        }
        if (d.alternatives_considered.length > 0) {
          content += `Alternatives considered: ${d.alternatives_considered.join(', ')}\n`;
        }
        content += '\n';
      });
    }

    if (handoff.context.learnings.length > 0) {
      content += `## Learnings\n`;
      content += `Important discoveries from the previous session:\n\n`;
      handoff.context.learnings.forEach((l: string) => {
        content += `- ${l}\n`;
      });
      content += '\n';
    }

    if (handoff.context.assumptions.length > 0) {
      content += `## Assumptions\n`;
      content += `Working assumptions to maintain:\n\n`;
      handoff.context.assumptions.forEach((a: string) => {
        content += `- ${a}\n`;
      });
      content += '\n';
    }

    if (handoff.files.modified.length > 0 || handoff.files.created.length > 0) {
      content += `## Files Changed\n`;
      if (handoff.files.modified.length > 0) {
        content += `### Modified\n`;
        handoff.files.modified.forEach((f: { path: string; summary: string }) => {
          content += `- \`${f.path}\`: ${f.summary}\n`;
        });
        content += '\n';
      }
      if (handoff.files.created.length > 0) {
        content += `### Created\n`;
        handoff.files.created.forEach((f: string) => {
          content += `- \`${f}\`\n`;
        });
        content += '\n';
      }
    }

    if (handoff.continuation.files_to_focus.length > 0) {
      content += `## Files to Focus On\n`;
      content += `Start by reviewing these files:\n\n`;
      handoff.continuation.files_to_focus.forEach((f: string) => {
        content += `- \`${f}\`\n`;
      });
      content += '\n';
    }

    content += `## Next Steps\n`;
    content += `${handoff.continuation.suggested_first_action}\n\n`;

    content += `---\n`;
    content += `*This context was generated by sync-ai handoff tool.*\n`;

    return content;
  }
}