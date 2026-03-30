import type { SessionExtractor } from '../types/session.js';
import type { AgentType, Session } from '../types/index.js';

export abstract class BaseExtractor implements SessionExtractor {
  abstract readonly agent: AgentType;

  abstract listSessions(projectPath: string): Promise<Session[]>;
  abstract extractSession(sessionId: string, projectPath: string): Promise<Session>;
  abstract getSessionLocation(): string;

  protected encodeProjectPath(projectPath: string): string {
    return projectPath.replace(/\//g, '-').replace(/^/, '-');
  }

  protected decodeProjectPath(encodedPath: string): string {
    return encodedPath.replace(/^-/, '').replace(/-/g, '/');
  }
}