import type { Session, Decision, Message } from '../types';

export interface SessionSummary {
  goal: string;
  progressPercentage: number;
  currentTask: string;
  blockers: string[];
  decisions: Decision[];
  learnings: string[];
}

export function generateSummary(session: Session): SessionSummary {
  const decisions = extractDecisions(session.messages);
  const learnings = extractLearnings(session.messages);
  const goal = extractGoal(session);
  const currentTask = extractCurrentTask(session.messages);
  const blockers = extractBlockers(session.messages);

  return {
    goal,
    progressPercentage: estimateProgress(session),
    currentTask,
    blockers,
    decisions,
    learnings,
  };
}

function extractGoal(session: Session): string {
  const firstUserMessage = session.messages.find(m => m.role === 'user');
  if (!firstUserMessage) return '';

  const content = firstUserMessage.content;
  // Extract from<user_query> tags if present
  const match = content.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/);
  if (match) {
    return match[1].slice(0, 500);
  }

  return content.slice(0, 500);
}

function extractCurrentTask(messages: Message[]): string {
  // Find the most recent task or incomplete work
  const recentMessages = messages.slice(-10);
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const msg = recentMessages[i];
    if (msg.role === 'assistant') {
      // Look for task indicators
      const taskMatch = msg.content.match(/(?:working on|implementing|fixing|adding):\s*([^\n]+)/i);
      if (taskMatch) {
        return taskMatch[1];
      }
    }
  }
  return '';
}

function estimateProgress(session: Session): number {
  if (!session.messages || session.messages.length === 0) return 0;
  
  // Rough estimate based on conversation length
  const messageCount = session.messages.length;
  const hasCompletedIndicators = session.messages.some(m => 
    m.content.toLowerCase().includes('done') ||
    m.content.toLowerCase().includes('complete') ||
    m.content.toLowerCase().includes('finished')
  );

  if (hasCompletedIndicators) return 90;
  if (messageCount < 5) return 10;
  if (messageCount < 10) return 30;
  if (messageCount < 20) return 50;
  if (messageCount < 40) return 70;
  return 80;
}

function extractBlockers(messages: Message[]): string[] {
  const blockers: string[] = [];
  const blockerPatterns = [
    /blocked on[:\s]+([^\n]+)/gi,
    /waiting for[:\s]+([^\n]+)/gi,
    /error[:\s]+([^\n]+)/gi,
    /failed[:\s]+([^\n]+)/gi,
    /cannot (?:proceed|continue)[:\s]+([^\n]+)/gi,
  ];

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      for (const pattern of blockerPatterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && !blockers.includes(match[1])) {
            blockers.push(match[1].trim());
          }
        }
      }
    }
  }

  return blockers;
}

function extractDecisions(messages: Message[]): Decision[] {
  const decisions: Decision[] = [];
  const decisionPatterns = [
    /decision[:\s]+([^\n]+)/gi,
    /decided to[:\s]+([^\n]+)/gi,
    /using\s+([^\s]+)\s+instead of/gi,
    /going with\s+([^\n]+)/gi,
  ];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'assistant') {
      for (const pattern of decisionPatterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          decisions.push({
            decision: match[1] || match[0],
            rationale: extractRationale(messages, i),
            alternatives_considered: [],
            timestamp: msg.timestamp || new Date().toISOString(),
          });
        }
      }
    }
  }

  return decisions;
}

function extractRationale(messages: Message[], msgIndex: number): string {
  // Look for rationale in nearby messages
  const start = Math.max(0, msgIndex - 2);
  const end = Math.min(messages.length, msgIndex + 3);
  const nearbyContent = messages.slice(start, end).map(m => m.content).join(' ');

  const rationaleMatch = nearbyContent.match(/because\s+([^\n]+)/i);
  return rationaleMatch?.[1] || '';
}

function extractLearnings(messages: Message[]): string[] {
  const learnings: string[] = [];
  const learningPatterns = [
    /learned\s+(?:that|how)\s+([^\n]+)/gi,
    /discovered\s+(?:that\s+)?([^\n]+)/gi,
    /note(?:d)?\s+(?:that\s+)?([^\n]+)/gi,
    /found\s+(?:out\s+)?(?:that\s+)?([^\n]+)/gi,
  ];

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      for (const pattern of learningPatterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          const learning = match[1]?.trim();
          if (learning && learning.length > 10 && !learnings.includes(learning)) {
            learnings.push(learning);
          }
        }
      }
    }
  }

  return learnings;
}