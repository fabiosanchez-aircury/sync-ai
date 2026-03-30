import { describe, it, expect } from 'vitest';
import { generateSummary } from '../../src/transformers/session-summary.js';
import type { Session, Message } from '../../src/types/index.js';

describe('generateSummary', () => {
  it('should extract goal from first user message', () => {
    const session: Session = {
      id: 'test-1',
      agent: 'claude-code',
      project_path: '/test',
      messages: [
        { role: 'user', content: 'Implement a dark mode feature' },
        { role: 'assistant', content: 'I will help you implement dark mode' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const summary = generateSummary(session);
    expect(summary.goal).toBe('Implement a dark mode feature');
  });

  it('should extract goal from user_query tags', () => {
    const session: Session = {
      id: 'test-2',
      agent: 'claude-code',
      project_path: '/test',
      messages: [
        { role: 'user', content: '<user_query>Fix the login bug</user_query>' },
        { role: 'assistant', content: 'I will fix it' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const summary = generateSummary(session);
    expect(summary.goal).toBe('Fix the login bug');
  });

  it('should estimate progress based on message count', () => {
    const messages: Message[] = Array(15).fill(null).map((_, i) => ({
      role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `Message ${i}`,
    }));

    const session: Session = {
      id: 'test-3',
      agent: 'claude-code',
      project_path: '/test',
      messages,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const summary = generateSummary(session);
    expect(summary.progressPercentage).toBeGreaterThan(0);
    expect(summary.progressPercentage).toBeLessThanOrEqual(100);
  });

  it('should return 90% when completion indicators found', () => {
    const session: Session = {
      id: 'test-4',
      agent: 'claude-code',
      project_path: '/test',
      messages: [
        { role: 'user', content: 'Test' },
        { role: 'assistant', content: 'The implementation is complete and done!' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const summary = generateSummary(session);
    expect(summary.progressPercentage).toBe(90);
  });

  it('should return empty strings for empty sessions', () => {
    const session: Session = {
      id: 'test-5',
      agent: 'claude-code',
      project_path: '/test',
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const summary = generateSummary(session);
    expect(summary.goal).toBe('');
    expect(summary.currentTask).toBe('');
    expect(summary.blockers).toEqual([]);
    expect(summary.decisions).toEqual([]);
    expect(summary.learnings).toEqual([]);
  });
});