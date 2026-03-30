import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { BaseExtractor } from './base.js';
import type { AgentType, Session, Message } from '../types/index.js';

interface CursorEntry {
  role: 'user' | 'assistant';
  message: {
    content: Array<{ type: string; text?: string }> | string;
  };
}

export class CursorExtractor extends BaseExtractor {
  readonly agent: AgentType = 'cursor';

  getSessionLocation(): string {
    return path.join(os.homedir(), '.cursor', 'projects');
  }

  async listSessions(projectPath: string): Promise<Session[]> {
    const sessionsDir = path.join(
      this.getSessionLocation(),
      this.encodeProjectPath(projectPath),
      'agent-transcripts'
    );

    try {
      await fs.access(sessionsDir);
    } catch {
      return [];
    }

    const sessionDirs = await fs.readdir(sessionsDir);
    const sessions: Session[] = [];

    for (const sessionDir of sessionDirs) {
      const sessionFilePath = path.join(sessionsDir, sessionDir, `${sessionDir}.jsonl`);
      
      try {
        const stats = await fs.stat(sessionFilePath);
        sessions.push({
          id: sessionDir,
          agent: this.agent,
          project_path: projectPath,
          created_at: stats.birthtime.toISOString(),
          updated_at: stats.mtime.toISOString(),
          messages: [],
          summary: await this.extractSummary(sessionFilePath),
        });
      } catch {
        // Skip invalid sessions
      }
    }

    return sessions.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  async extractSession(sessionId: string, projectPath: string): Promise<Session> {
    const filePath = path.join(
      this.getSessionLocation(),
      this.encodeProjectPath(projectPath),
      'agent-transcripts',
      sessionId,
      `${sessionId}.jsonl`
    );

    const content = await fs.readFile(filePath, 'utf-8');
    const entries = this.parseJsonl(content);

    const messages: Message[] = entries.map(entry => ({
      role: entry.role,
      content: this.extractContent(entry.message.content),
    }));

    return {
      id: sessionId,
      agent: this.agent,
      project_path: projectPath,
      messages,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      summary: messages[0]?.content.slice(0, 100) || '',
    };
  }

  private parseJsonl(content: string): CursorEntry[] {
    const lines = content.trim().split('\n');
    const entries: CursorEntry[] = [];

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip malformed lines
      }
    }

    return entries;
  }

  private extractContent(content: CursorEntry['message']['content']): string {
    if (typeof content === 'string') {
      return content;
    }

    return content
      .filter((c: { type: string; text?: string }) => c.type === 'text' && c.text)
      .map((c: { type: string; text?: string }) => c.text)
      .filter((text): text is string => text !== undefined)
      .join('\n');
  }

  private async extractSummary(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      try {
        const entry: CursorEntry = JSON.parse(line);
        if (entry.role === 'user') {
          const text = this.extractContent(entry.message.content);
          const match = text.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/);
          if (match && match[1]) {
            return match[1].slice(0, 200);
          }
          return text.slice(0, 200);
        }
      } catch {
        // Continue
      }
    }

    return '';
  }
}