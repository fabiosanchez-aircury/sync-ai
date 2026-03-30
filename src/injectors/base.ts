import type { SessionInjector } from '../types/session.js';
import type { AgentType, HandoffFormat } from '../types/index.js';

/**
 * Base class for session injectors.
 * Provides common validation utilities for handoff formats.
 */
export abstract class BaseInjector implements SessionInjector {
  abstract readonly agent: AgentType;

  /**
   * Injects a handoff into the target agent.
   * @param handoff - The handoff format to inject
   * @returns Promise resolving to injection result with session ID or error
   */
  abstract inject(handoff: HandoffFormat): Promise<{ 
    success: boolean; 
    session_id?: string; 
    error?: string 
  }>;

  /**
   * Validates a handoff format for required fields.
   * @param handoff - The handoff format to validate
   * @returns Promise resolving to validation result with any errors
   */
  async validateHandoff(handoff: HandoffFormat): Promise<{ 
    valid: boolean; 
    errors: string[] 
  }> {
    const errors: string[] = [];

    if (!handoff.version) {
      errors.push('Missing version');
    }

    if (!handoff.metadata?.source?.session_id) {
      errors.push('Missing source session ID');
    }

    if (!handoff.metadata?.target?.agent) {
      errors.push('Missing target agent');
    }

    if (!handoff.summary?.goal) {
      errors.push('Missing goal in summary');
    }

    if (!handoff.continuation?.prompt) {
      errors.push('Missing continuation prompt');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}