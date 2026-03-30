import type { SessionExtractor } from '../types/session.js';
import type { AgentType, Session } from '../types/index.js';

/**
 * Base class for session extractors.
 * Provides common path encoding/decoding utilities for session locations.
 */
export abstract class BaseExtractor implements SessionExtractor {
  abstract readonly agent: AgentType;

  abstract listSessions(projectPath: string): Promise<Session[]>;
  abstract extractSession(sessionId: string, projectPath: string): Promise<Session>;
  abstract getSessionLocation(): string;

  /**
   * Encodes a project path for use in session directory names.
   * Converts slashes to dashes and prepends a dash.
   * @param projectPath - The original project path
   * @returns The encoded path
   */
  protected encodeProjectPath(projectPath: string): string {
    return projectPath.replace(/\//g, '-').replace(/^/, '-');
  }

  /**
   * Decodes an encoded project path back to its original form.
   * Note: This is lossy for paths that originally contained hyphens.
   * @param encodedPath - The encoded path
   * @returns The decoded path
   */
  protected decodeProjectPath(encodedPath: string): string {
    return encodedPath.replace(/^-/, '').replace(/-/g, '/');
  }
}