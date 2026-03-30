import type { SessionInjector } from '../types/session.js';
import type { AgentType, HandoffFormat } from '../types/index.js';

export abstract class BaseInjector implements SessionInjector {
  abstract readonly agent: AgentType;

  abstract inject(handoff: HandoffFormat): Promise<{ 
    success: boolean; 
    session_id?: string; 
    error?: string 
  }>;

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