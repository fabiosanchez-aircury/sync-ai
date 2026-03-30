import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { BaseExtractor } from './base';
import type { AgentType, Session, Message, ToolCall } from '../types';

interface ClaudeCodeEntry {
  type: string;
  message?: string;
  content?: string;
  role?: string;
  uuid?: string;
  sessionId?: string;
  timestamp?: string;
  cwd?: string;
  gitBranch?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: unknown;
}

export class ClaudeCodeExtractor extends BaseExtractor {
  readonly agent: AgentType = 'claude-code';

  getSessionLocation(): string {
    return path.join(os.homedir(), '.claude', 'projects');
  }

  async listSessions(projectPath: string): Promise<Session[]> {
    const sessionsDir = path.join(this.getSessionLocation(), this.encodeProjectPath(projectPath));
    
    try {
      await fs.access(sessionsDir);
    } catch {
      return [];
    }

    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files.filter(f => f.endsWith('.jsonl'));

    const sessions: Session[] = [];
    for (const file of sessionFiles) {
      const sessionId = file.replace('.jsonl', '');
      const filePath = path.join(sessionsDir, file);
      const stats = await fs.stat(filePath);
      
      sessions.push({
        id: sessionId,
        agent: this.agent,
        project_path: projectPath,
        created_at: stats.birthtime.toISOString(),
        updated_at: stats.mtime.toISOString(),
        messages: [],
        summary: await this.extractSummary(filePath),
      });
    }

    return sessions.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  async extractSession(sessionId: string, projectPath: string): Promise<Session> {
    const filePath = path.join(
      this.getSessionLocation(),
      this.encodeProjectPath(projectPath),
      `${sessionId}.jsonl`
    );

    const content = await fs.readFile(filePath, 'utf-8');
    const entries = this.parseJsonl(content);

    const messages: Message[] = [];
    const toolCalls: ToolCall[] = [];
    const filesRead: Set<string> = new Set();
    const filesModified: Map<string, { path: string; summary: string }> = new Map();

    for (const entry of entries) {
      if (entry.type === 'user' && entry.message) {
        messages.push({
          role: 'user',
          content: entry.message,
          timestamp: entry.timestamp,
        });
      } else if (entry.type === 'assistant' && entry.message) {
        const content = typeof entry.message === 'string' 
          ? entry.message 
          : JSON.stringify(entry.message);
        messages.push({
          role: 'assistant',
          content,
          timestamp: entry.timestamp,
        });
      } else if (entry.type === 'tool_use') {
        toolCalls.push({
          name: entry.toolName || 'unknown',
          input: entry.toolInput || {},
          result: entry.toolResult,
          timestamp: entry.timestamp,
        });
        
        if (entry.toolInput?.file_path) {
          filesRead.add(entry.toolInput.file_path as string);
        }
        if (entry.toolInput?.path) {
          filesRead.add(entry.toolInput.path as string);
        }
      }
    }

    return {
      id: sessionId,
      agent: this.agent,
      project_path: projectPath,
      messages,
      tool_calls: toolCalls,
      files_read: Array.from(filesRead),
      files_modified: Array.from(filesModified.values()).map(f => ({
        path: f.path,
        change_type: 'modified' as const,
        summary: f.summary,
      })),
      summary: await this.extractSummary(filePath),
      created_at: entries[0]?.timestamp || new Date().toISOString(),
      updated_at: entries[entries.length - 1]?.timestamp || new Date().toISOString(),
    };
  }

  private parseJsonl(content: string): ClaudeCodeEntry[] {
    const lines = content.trim().split('\n');
    const entries: ClaudeCodeEntry[] = [];

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip malformed lines
      }
    }

    return entries;
  }

  private async extractSummary(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'summary' && entry.summary) {
          return entry.summary;
        }
      } catch {
        // Continue looking for summary
      }
    }

    return '';
  }
}