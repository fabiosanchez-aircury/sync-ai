import type { HandoffFormat, HandoffContinuation } from '../types/index.js';
import type { Session, Message } from '../types/index.js';
import { generateSummary, type SessionSummary as SessionSummaryType } from './session-summary.js';

export function buildHandoff(
  session: Session,
  targetAgent: 'claude-code' | 'opencode' | 'cursor'
): HandoffFormat {
  const summary = generateSummary(session);
  
  const handoff: HandoffFormat = {
    version: '1.0.0',
    metadata: {
      version: '1.0.0',
      source: {
        agent: session.agent,
        version: '',
        session_id: session.id,
        timestamp: new Date().toISOString(),
      },
      target: {
        agent: targetAgent,
      },
      project: {
        path: session.project_path,
        git_branch: session.git_branch ?? '',
        git_status: '',
      },
    },
    summary: {
      goal: summary.goal,
      progress_percentage: summary.progressPercentage,
      current_task: summary.currentTask,
      status: 'in_progress',
      blockers: summary.blockers.length > 0 ? summary.blockers : undefined,
    },
    context: {
      conversation_summary: buildConversationSummary(session.messages),
      decisions: summary.decisions,
      learnings: summary.learnings,
      assumptions: extractAssumptions(session.messages),
    },
    files: {
      modified: session.files_modified ?? [],
      read: session.files_read ?? [],
      created: session.files_created ?? [],
      pending_changes: [],
    },
    conversation: {
      key_messages: extractKeyMessages(session.messages),
      tool_calls: session.tool_calls ?? [],
    },
    continuation: buildContinuation(session, summary, targetAgent),
  };

  return handoff;
}

function buildConversationSummary(messages: Message[]): string {
  if (!messages || messages.length === 0) return '';

  const totalMessages = messages.length;
  const userMessages = messages.filter((m: Message) => m.role === 'user').length;
  const assistantMessages = messages.filter((m: Message) => m.role === 'assistant').length;

  const topics = extractTopics(messages);
  
  return `Conversation with ${totalMessages} messages (${userMessages} user, ${assistantMessages} assistant). ` +
    `Main topics: ${topics.join(', ')}.`;
}

function extractTopics(messages: Message[]): string[] {
  const topics: string[] = [];
  const keywordPatterns = [
    /(?:implement|add|create|build)\s+([a-zA-Z-]+)/gi,
    /(?:fix|debug|resolve)\s+([a-zA-Z-]+)/gi,
    /(?:refactor|improve|optimize)\s+([a-zA-Z-]+)/gi,
  ];

  for (const msg of messages.slice(0, 10)) {
    for (const pattern of keywordPatterns) {
      for (const match of msg.content.matchAll(pattern)) {
        if (match[1] && !topics.includes(match[1])) {
          topics.push(match[1].toLowerCase());
        }
      }
    }
  }

  return topics.slice(0, 5);
}

function extractAssumptions(messages: Message[]): string[] {
  const assumptions: string[] = [];
  const patterns = [
    /assuming\s+(?:that\s+)?([^\n]+)/gi,
    /presuming\s+(?:that\s+)?([^\n]+)/gi,
    /expecting\s+(?:that\s+)?([^\n]+)/gi,
  ];

  for (const msg of messages) {
    for (const pattern of patterns) {
      for (const match of msg.content.matchAll(pattern)) {
        const assumption = match[1]?.trim();
        if (assumption && assumption.length > 5) {
          assumptions.push(assumption);
        }
      }
    }
  }

  return assumptions;
}

function extractKeyMessages(messages: Message[]): Message[] {
  if (!messages || messages.length < 5) {
    return messages;
  }

  const keyMessages: Message[] = [];
  
  // First user message (sets context)
  const firstUser = messages.find(m => m.role === 'user');
  if (firstUser) {
    keyMessages.push({ ...firstUser, important: true });
  }

  // Last few messages (most recent context)
  const recentMessages = messages.slice(-4);
  for (const msg of recentMessages) {
    if (!keyMessages.includes(msg)) {
      keyMessages.push(msg);
    }
  }

  return keyMessages;
}

function buildContinuation(
  session: Session,
  summary: SessionSummaryType,
  targetAgent: string
): HandoffContinuation {
  const filesToFocus = extractFilesToFocus(session);
  const suggestedAction = buildSuggestedAction(summary);
  const prompt = buildContinuationPrompt(session, summary, targetAgent);

  return {
    prompt,
    suggested_first_action: suggestedAction,
    files_to_focus: filesToFocus,
  };
}

function extractFilesToFocus(session: Session): string[] {
  const files = new Set<string>();

  // Files most recently read
  if (session.files_read) {
    const recentRead = session.files_read.slice(-5);
    recentRead.forEach((f: string) => files.add(f));
  }

  // Files modified
  if (session.files_modified) {
    session.files_modified.forEach((f: { path: string }) => files.add(f.path));
  }

  // Files created
  if (session.files_created) {
    session.files_created.forEach((f: string) => files.add(f));
  }

  return Array.from(files).slice(0, 10);
}

function buildSuggestedAction(summary: SessionSummaryType): string {
  if (summary.blockers.length > 0) {
    return `Address blocker: ${summary.blockers[0]}`;
  }

  if (summary.currentTask) {
    return `Continue with: ${summary.currentTask}`;
  }

  return 'Review the conversation context and continue from where we left off.';
}

function buildContinuationPrompt(
  session: Session,
  summary: SessionSummaryType,
  targetAgent: string
): string {
  const agentNames: Record<string, string> = {
    'claude-code': 'Claude Code',
    opencode: 'OpenCode',
    cursor: 'Cursor',
  };

  const sourceName = agentNames[session.agent] || session.agent;
  const targetName = agentNames[targetAgent] || targetAgent;

  let prompt = `## Session Handoff from ${sourceName} to ${targetName}\n\n`;
  
  prompt+= `### Context\n`;
  prompt += `This is a continuation of a previous session. The following context has been transferred from ${sourceName}.\n\n`;

  prompt += `### Goal\n${summary.goal}\n\n`;
  
  prompt += `### Progress\n`;
  prompt += `- Estimated completion: ${summary.progressPercentage}%\n`;
  prompt += `- Current task: ${summary.currentTask || 'N/A'}\n\n`;

  if (session.files_modified && session.files_modified.length > 0) {
    prompt += `### Files Modified\n`;
    session.files_modified.forEach((f: { path: string; summary?: string; change_type: string }) => {
      prompt += `- ${f.path}: ${f.summary ?? f.change_type}\n`;
    });
    prompt += '\n';
  }

  if (summary.decisions.length > 0) {
    prompt += `### Key Decisions\n`;
    summary.decisions.forEach((d: { decision: string; rationale?: string }) => {
      prompt += `- ${d.decision}\n`;
      if (d.rationale) {
        prompt += `  Rationale: ${d.rationale}\n`;
      }
    });
    prompt += '\n';
  }

  if (summary.learnings.length > 0) {
    prompt += `###Learnings\n`;
    summary.learnings.forEach((l: string) => {
      prompt += `- ${l}\n`;
    });
    prompt += '\n';
  }

  if (summary.blockers.length > 0) {
    prompt += `### Blockers\n`;
    summary.blockers.forEach((b: string) => {
      prompt += `- ${b}\n`;
    });
    prompt += '\n';
  }

  prompt += `### What to do next\n`;
  prompt += `${buildSuggestedAction(summary)}\n\n`;

  prompt += `Please continue from where we left off, maintaining consistency with the decisions and patterns already established.`;

  return prompt;
}