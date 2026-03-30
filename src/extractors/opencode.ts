import { BaseExtractor } from './base.js';
import type { AgentType, Session } from '../types/index.js';

export class OpenCodeExtractor extends BaseExtractor {
  readonly agent: AgentType = 'opencode';

  getSessionLocation(): string {
    return '';
  }

  async listSessions(_projectPath: string): Promise<Session[]> {
    // OpenCode uses 'opencode export' command for session extraction
    // This is a placeholder - actual implementation will shell out to opencode CLI
    return [];
  }

  async extractSession(sessionId: string, _projectPath: string): Promise<Session> {
    // OpenCode uses 'opencode export <sessionId>' for session extraction
    // This is a placeholder - actual implementation will shell out to opencode CLI
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