import * as child_process from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as os from 'os';
import { BaseExtractor } from './base.js';
import type { AgentType, Session, Message, ToolCall, FileChange } from '../types/index.js';

const exec = util.promisify(child_process.exec);

interface OpenCodeSession {
  id: string;
  project?: string;
  created?: string;
  updated?: string;
  title?: string;
}

interface OpenCodeMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
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

      const sessions: OpenCodeSession[] = JSON.parse(stdout);
      
      return sessions.map((s: OpenCodeSession) => ({
        id: s.id,
        agent: this.agent,
        project_path: _projectPath,
        created_at: s.created ?? new Date().toISOString(),
        updated_at: s.updated ?? new Date().toISOString(),
        messages: [],
        summary: s.title,
      })).sort((a: Session, b: Session) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } catch {
      // If command fails, return empty array
      return [];
    }
  }

  async extractSession(sessionId: string, _projectPath: string): Promise<Session> {
    try {
      const { stdout } = await exec(`opencode export ${sessionId}`, {
        maxBuffer: 1024 * 1024 * 50,
      });

      const data = JSON.parse(stdout);
      const messages: Message[] = this.parseMessages(data);
      
      return {
        id: sessionId,
        agent: this.agent,
        project_path: _projectPath,
        messages,
        tool_calls: this.parseToolCalls(data),
        files_read: this.extractFilesRead(data),
        files_modified: this.extractFilesModified(data),
        created_at: data.metadata?.created ?? new Date().toISOString(),
        updated_at: data.metadata?.updated ?? new Date().toISOString(),
        summary: this.extractSummary(data),
      };
    } catch (error) {
      // Fallback: return minimal session data
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

  private parseMessages(data: { conversation?: OpenCodeMessage[]; messages?: OpenCodeMessage[] }): Message[] {
    const rawMessages = data.conversation ?? data.messages ?? [];
    
    return rawMessages.map((m: OpenCodeMessage) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      timestamp: m.timestamp,
    }));
  }

  private parseToolCalls(data: { toolCalls?: ToolCall[]; tool_calls?: ToolCall[] }): ToolCall[] {
    return data.toolCalls ?? data.tool_calls ?? [];
  }

  private extractFilesRead(data: { filesRead?: string[]; files_read?: string[] }): string[] {
    return data.filesRead ?? data.files_read ?? [];
  }

  private extractFilesModified(data: { filesModified?: { path: string; summary: string; change_type?: string }[] }): FileChange[] {
    const files = data.filesModified ?? [];
    return files.map(f => ({
      path: f.path,
      summary: f.summary,
      change_type: (f.change_type as 'created' | 'modified' | 'deleted') ?? 'modified',
    }));
  }

  private extractSummary(data: { summary?: string; title?: string }): string {
    return data.summary ?? data.title ?? '';
  }
}