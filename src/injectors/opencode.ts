import * as child_process from 'child_process';
import * as util from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { BaseInjector } from './base.js';
import type { AgentType, HandoffFormat } from '../types/index.js';

const exec = util.promisify(child_process.exec);

export class OpenCodeInjector extends BaseInjector {
  readonly agent: AgentType = 'opencode';

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
      // Create a temporary file for the handoff
      const tempFile = path.join(os.tmpdir(), `sync-ai-handoff-${Date.now()}.json`);
      await fs.writeFile(tempFile, JSON.stringify(handoff, null, 2));

      // Try to import using OpenCode's import command
      try {
        const { stdout } = await exec(`opencode import ${tempFile}`);
        const sessionIdMatch = stdout.match(/session[:\s]+([a-zA-Z0-9-]+)/i);
        
        await fs.unlink(tempFile);
        
        return {
          success: true,
          session_id: sessionIdMatch?.[1] ?? `manual-${Date.now()}`,
        };
      } catch {
        // If import doesn't work, create a context file for manual continuation
        const contextFile = path.join(
          os.homedir(),
          '.local',
          'share',
          'opencode',
          'sync-ai-context.md'
        );

        const contextContent = this.formatContextForOpenCode(handoff);
        await fs.writeFile(contextFile, contextContent);

        // Create AGENTS.md or append to it
        const agentsPath = path.join(handoff.metadata.project.path, 'AGENTS.md');
        const agentsContent = `\n\n---\n\n## Session Context (sync-ai handoff)\n\n${handoff.continuation.prompt}\n`;

        try {
          await fs.appendFile(agentsPath, agentsContent);
        } catch {
          // AGENTS.md doesn't exist, create it
          await fs.writeFile(agentsPath, `# AGENTS.md\n\n${agentsContent}`);
        }

        await fs.unlink(tempFile);

        return {
          success: true,
          session_id: `manual-${Date.now()}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during injection',
      };
    }
  }

  private formatContextForOpenCode(handoff: HandoffFormat): string {
    let content = `# Session Context\n\n`;
    content += `Transferred from ${handoff.metadata.source.agent}\n\n`;
    content += `## Goal\n${handoff.summary.goal}\n\n`;
    
    if (handoff.context.decisions.length > 0) {
      content += `## Decisions\n`;
      handoff.context.decisions.forEach((d: { decision: string; rationale?: string }) => {
        content += `- **${d.decision}**\n`;
        if (d.rationale) {
          content += `  - Rationale: ${d.rationale}\n`;
        }
      });
      content += '\n';
    }

    if (handoff.context.learnings.length > 0) {
      content += `## Learnings\n`;
      handoff.context.learnings.forEach((l: string) => {
        content += `- ${l}\n`;
      });
      content += '\n';
    }

    return content;
  }
}