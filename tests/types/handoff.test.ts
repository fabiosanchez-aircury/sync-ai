import { describe, it, expect } from 'vitest';
import { createEmptyHandoff } from '../../src/types/handoff.js';

describe('createEmptyHandoff', () => {
  it('should create handoff with correct source and target', () => {
    const handoff = createEmptyHandoff('claude-code', 'opencode', '/test/project');

    expect(handoff.version).toBe('1.0.0');
    expect(handoff.metadata.source.agent).toBe('claude-code');
    expect(handoff.metadata.target.agent).toBe('opencode');
    expect(handoff.metadata.project.path).toBe('/test/project');
  });

  it('should initialize all arrays as empty', () => {
    const handoff = createEmptyHandoff('cursor', 'claude-code', '/project');

    expect(handoff.context.decisions).toEqual([]);
    expect(handoff.context.learnings).toEqual([]);
    expect(handoff.context.assumptions).toEqual([]);
    expect(handoff.files.modified).toEqual([]);
    expect(handoff.files.read).toEqual([]);
    expect(handoff.files.created).toEqual([]);
    expect(handoff.files.pending_changes).toEqual([]);
    expect(handoff.conversation.key_messages).toEqual([]);
    expect(handoff.conversation.tool_calls).toEqual([]);
    expect(handoff.continuation.files_to_focus).toEqual([]);
  });

  it('should set status to in_progress', () => {
    const handoff = createEmptyHandoff('opencode', 'cursor', '/app');

    expect(handoff.summary.status).toBe('in_progress');
    expect(handoff.summary.progress_percentage).toBe(0);
    expect(handoff.summary.goal).toBe('');
    expect(handoff.summary.current_task).toBe('');
  });

  it('should set timestamp to current time', () => {
    const before = new Date().toISOString();
    const handoff = createEmptyHandoff('claude-code', 'opencode', '/test');
    const after = new Date().toISOString();

    expect(handoff.metadata.source.timestamp >= before).toBe(true);
    expect(handoff.metadata.source.timestamp <= after).toBe(true);
  });
});