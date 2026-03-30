import type { AgentType } from './session.js';

/**
 * Configuration for a supported AI agent.
 */
export interface AgentConfig {
  name: AgentType;
  displayName: string;
  sessionLocation: string;
  sessionFormat: 'jsonl' | 'json' | 'custom';
  supportsInjection: boolean;
  supportsExtraction: boolean;
}

/**
 * Configuration for all supported AI agents.
 */
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    sessionLocation: '~/.claude/projects',
    sessionFormat: 'jsonl',
    supportsInjection: true,
    supportsExtraction: true,
  },
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    sessionLocation: '~/.local/share/opencode',
    sessionFormat: 'json',
    supportsInjection: true,
    supportsExtraction: true,
  },
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    sessionLocation: '~/.cursor/projects',
    sessionFormat: 'jsonl',
    supportsInjection: true,
    supportsExtraction: true,
  },
};

/**
 * Gets the configuration for a specific agent.
 * @param agent - The agent type to get configuration for
 * @returns The agent configuration
 */
export function getAgentConfig(agent: AgentType): AgentConfig {
  return AGENT_CONFIGS[agent];
}

/**
 * Gets a list of all supported agent types.
 * @returns Array of supported agent types
 */
export function getSupportedAgents(): AgentType[] {
  return Object.keys(AGENT_CONFIGS) as AgentType[];
}