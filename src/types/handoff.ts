import type {
  AgentType,
  SessionStatus,
  Message,
  ToolCall,
  Decision,
  FileChange,
  PendingChange,
} from './session';

export interface HandoffMetadata {
  version: '1.0.0';
  source: {
    agent: AgentType;
    version: string;
    session_id: string;
    timestamp: string;
  };
  target: {
    agent: AgentType;
  };
  project: {
    path: string;
    git_branch: string;
    git_status: string;
  };
}

export interface HandoffSummary {
  goal: string;
  progress_percentage: number;
  current_task: string;
  status: SessionStatus;
  blockers?: string[];
}

export interface HandoffContext {
  conversation_summary: string;
  decisions: Decision[];
  learnings: string[];
  assumptions: string[];
}

export interface HandoffFiles {
  modified: FileChange[];
  read: string[];
  created: string[];
  pending_changes: PendingChange[];
}

export interface HandoffConversation {
  full_history?: Message[];
  key_messages: Message[];
  tool_calls: ToolCall[];
}

export interface HandoffContinuation {
  prompt: string;
  suggested_first_action: string;
  files_to_focus: string[];
}

export interface HandoffFormat {
  version: '1.0.0';
  metadata: HandoffMetadata;
  summary: HandoffSummary;
  context: HandoffContext;
  files: HandoffFiles;
  conversation: HandoffConversation;
  continuation: HandoffContinuation;
}

export function createEmptyHandoff(
  sourceAgent: AgentType,
  targetAgent: AgentType,
  projectPath: string
): HandoffFormat {
  return {
    version: '1.0.0',
    metadata: {
      version: '1.0.0',
      source: {
        agent: sourceAgent,
        version: '',
        session_id: '',
        timestamp: new Date().toISOString(),
      },
      target: {
        agent: targetAgent,
      },
      project: {
        path: projectPath,
        git_branch: '',
        git_status: '',
      },
    },
    summary: {
      goal: '',
      progress_percentage: 0,
      current_task: '',
      status: 'in_progress',
    },
    context: {
      conversation_summary: '',
      decisions: [],
      learnings: [],
      assumptions: [],
    },
    files: {
      modified: [],
      read: [],
      created: [],
      pending_changes: [],
    },
    conversation: {
      key_messages: [],
      tool_calls: [],
    },
    continuation: {
      prompt: '',
      suggested_first_action: '',
      files_to_focus: [],
    },
  };
}