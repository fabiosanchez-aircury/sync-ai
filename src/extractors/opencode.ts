import { BaseExtractor } from './base';
import type { AgentType, Session } from '../types';

export class OpenCodeExtractor extends BaseExtractor {
  readonly agent: AgentType = 'opencode';

  getSessionLocation(): string {
    return '';
  }

  async listSessions(projectPath: string): Promise<Session[]> {
    // OpenCode uses 'opencode export' command for session extraction
    // This is a placeholder - actual implementation will shell out to opencode CLI
    return [];
  }

  async extractSession(sessionId: string, projectPath: string): Promise<Session> {
    // OpenCode uses 'opencode export <sessionId>' for session extraction
    // This is a placeholder - actual implementation will shell out to opencode CLI
    return {
      id: sessionId,
      agent: this.agent,
      project_path: projectPath,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}