import * as child_process from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { BaseExtractor } from './base.js';
import type { AgentType, Session, Message, ToolCall, FileChange } from '../types/index.js';

const exec = util.promisify(child_process.exec);

interface OpenCodeExport {
  info: {
    id: string;
    title?: string;
    summary?: { additions: number; deletions: number; files: number };
    time?: { created: number; updated: number };
  };
  messages: OpenCodeMessage[];
}

interface OpenCodeMessage {
  info: {
    role: 'user' | 'assistant';
    time?: { created?: number };
    summary?: { diffs: { file: string; additions: number; deletions: number }[] };
  };
  parts: OpenCodePart[];
}

interface OpenCodePart {
  type: string;
  text?: string;
  tool?: string;
  callID?: string;
  input?: Record<string, unknown>;
  output?: string;
}

export class OpenCodeExtractor extends BaseExtractor {
  readonly agent: AgentType = 'opencode';

  getSessionLocation(): string {
    return path.join(os.homedir(), '.local', 'share', 'opencode');
  }

  async listSessions(_projectPath: string): Promise<Session[]> {
    try {
      const { stdout } = await exec('opencode session list --format json', {
        maxBuffer: 1024 * 1024 * 10,
      });

      const sessions: { id: string; title?: string; created?: string; updated?: string }[] = JSON.parse(stdout);
      
      return sessions.map((s) => ({
        id: s.id,
        agent: this.agent,
        project_path: _projectPath,
        created_at: s.created ?? new Date().toISOString(),
        updated_at: s.updated ?? new Date().toISOString(),
        messages: [],
        summary: s.title,
      })).sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } catch {
      return [];
    }
  }

  async extractSession(sessionId: string, _projectPath: string): Promise<Session> {
    const tempFile = path.join(os.tmpdir(), `opencode-session-${sessionId}.json`);
    
    try {
      await exec(`opencode export ${sessionId} 2>/dev/null > ${tempFile}`);
      const content = await fs.readFile(tempFile, 'utf-8');
      await fs.unlink(tempFile).catch(() => {});
      
      const data: OpenCodeExport = JSON.parse(content);
      const messages: Message[] = this.parseMessages(data.messages);
      
      return {
        id: sessionId,
        agent: this.agent,
        project_path: _projectPath,
        messages,
        tool_calls: this.parseToolCalls(data.messages),
        files_read: [],
        files_modified: this.extractFilesModified(data),
        created_at: data.info.time?.created ? new Date(data.info.time.created).toISOString() : new Date().toISOString(),
        updated_at: data.info.time?.updated ? new Date(data.info.time.updated).toISOString() : new Date().toISOString(),
        summary: data.info.title ?? '',
      };
    } catch (error) {
      await fs.unlink(tempFile).catch(() => {});
      return {
        id: sessionId,
        agent: this.agent,
        project_path: _projectPath,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  private parseMessages(messages: OpenCodeMessage[]): Message[] {
    return messages.map((msg) => {
      const textParts = msg.parts
        .filter((p) => p.type === 'text' && p.text)
        .map((p) => p.text)
        .join('\n');
      
      const reasoningParts = msg.parts
        .filter((p) => p.type === 'reasoning' && p.text)
        .map((p) => p.text)
        .join('\n');

      const content = reasoningParts 
        ? `${textParts}${textParts && reasoningParts ? '\n\n' : ''}<reasoning>\n${reasoningParts}\n</reasoning>`
        : textParts;

      return {
        role: msg.info.role,
        content,
        timestamp: msg.info.time?.created ? new Date(msg.info.time.created).toISOString() : undefined,
      };
    });
  }

  private parseToolCalls(messages: OpenCodeMessage[]): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    
    for (const msg of messages) {
      for (const part of msg.parts) {
        if (part.type === 'tool' && part.tool) {
          toolCalls.push({
            name: part.tool,
            input: part.input ?? {},
            result: part.output ?? '',
            timestamp: msg.info.time?.created ? new Date(msg.info.time.created).toISOString() : new Date().toISOString(),
          });
        }
      }
    }
    
    return toolCalls;
  }

  private extractFilesModified(data: OpenCodeExport): FileChange[] {
    const files: Map<string, FileChange> = new Map();
    
    for (const msg of data.messages) {
      const diffs = msg.info.summary?.diffs ?? [];
      for (const diff of diffs) {
        if (!files.has(diff.file)) {
          files.set(diff.file, {
            path: diff.file,
            change_type: 'modified',
            summary: `+${diff.additions} -${diff.deletions}`,
          });
        }
      }
    }
    
    return Array.from(files.values());
  }
}