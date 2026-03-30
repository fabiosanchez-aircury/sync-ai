export type AgentType = 'claude-code' | 'opencode' | 'cursor';

export type SessionStatus = 'in_progress' | 'blocked' | 'completed' | 'awaiting_input';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  important?: boolean;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
  timestamp?: string;
}

export interface Decision {
  decision: string;
  rationale: string;
  alternatives_considered: string[];
  timestamp: string;
}

export interface FileChange {
  path: string;
  change_type: 'created' | 'modified' | 'deleted';
  diff?: string;
  summary: string;
}

export interface PendingChange {
  path: string;
  description: string;
}

export interface Session {
  id: string;
  agent: AgentType;
  project_path: string;
  git_branch?: string;
  messages: Message[];
  tool_calls?: ToolCall[];
  files_read?: string[];
  files_modified?: FileChange[];
  files_created?: string[];
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionExtractor {
  readonly agent: AgentType;
  listSessions(projectPath: string): Promise<Session[]>;
  extractSession(sessionId: string, projectPath: string): Promise<Session>;
  getSessionLocation(): string;
}

export interface SessionInjector {
  readonly agent: AgentType;
  inject(handoff: HandoffFormat): Promise<{ success: boolean; session_id?: string; error?: string }>;
  validateHandoff(handoff: HandoffFormat): Promise<{ valid: boolean; errors: string[] }>;
}