import type { AgentType } from './session';

export interface AgentConfig {
  name: AgentType;
  displayName: string;
  sessionLocation: string;
  sessionFormat: 'jsonl' | 'json' | 'custom';
  supportsInjection: boolean;
  supportsExtraction: boolean;
}

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

export function getAgentConfig(agent: AgentType): AgentConfig {
  return AGENT_CONFIGS[agent];
}

export function getSupportedAgents(): AgentType[] {
  return Object.keys(AGENT_CONFIGS) as AgentType[];
}