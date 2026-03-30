import { describe, it, expect } from 'vitest';
import { buildHandoff } from '../../src/transformers/context-builder.js';
import type { Session } from '../../src/types/index.js';

describe('buildHandoff', () => {
  it('should create handoff with correct metadata', () => {
    const session: Session = {
      id: 'session-123',
      agent: 'claude-code',
      project_path: '/home/user/myproject',
      git_branch: 'feature/test',
      messages: [
        { role: 'user', content: 'Add authentication' },
        { role: 'assistant', content: 'I will add authentication' },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T01:00:00Z',
    };

    const handoff = buildHandoff(session, 'opencode');

    expect(handoff.version).toBe('1.0.0');
    expect(handoff.metadata.source.agent).toBe('claude-code');
    expect(handoff.metadata.source.session_id).toBe('session-123');
    expect(handoff.metadata.target.agent).toBe('opencode');
    expect(handoff.metadata.project.path).toBe('/home/user/myproject');
  });

  it('should include messages in conversation', () => {
    const session: Session = {
      id: 'session-456',
      agent: 'cursor',
      project_path: '/project',
      messages: [
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Another question' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const handoff = buildHandoff(session, 'claude-code');

    expect(handoff.conversation.key_messages.length).toBeGreaterThan(0);
  });

  it('should extract goal as first user message', () => {
    const session: Session = {
      id: 'session-789',
      agent: 'opencode',
      project_path: '/app',
      messages: [
        { role: 'user', content: 'Implement user registration' },
        { role: 'assistant', content: 'Ok' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const handoff = buildHandoff(session, 'cursor');

    expect(handoff.summary.goal).toBe('Implement user registration');
  });

  it('should include files from session', () => {
    const session: Session = {
      id: 'session-files',
      agent: 'claude-code',
      project_path: '/project',
      messages: [],
      files_read: ['/src/index.ts', '/src/utils.ts'],
      files_modified: [
        { path: '/src/auth.ts', change_type: 'modified', summary: 'Added login' },
      ],
      files_created: ['/src/new.ts'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const handoff = buildHandoff(session, 'opencode');

    expect(handoff.files.read).toContain('/src/index.ts');
    expect(handoff.files.modified).toHaveLength(1);
    expect(handoff.files.created).toContain('/src/new.ts');
  });

  it('should generate continuation prompt', () => {
    const session: Session = {
      id: 'session-prompt',
      agent: 'claude-code',
      project_path: '/project',
      messages: [
        { role: 'user', content: 'Build a REST API' },
        { role: 'assistant', content: 'I will build it' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const handoff = buildHandoff(session, 'cursor');

    expect(handoff.continuation.prompt).toContain('Session Handoff');
    expect(handoff.continuation.prompt).toContain('Claude Code');
    expect(handoff.continuation.prompt).toContain('Cursor');
    expect(handoff.continuation.suggested_first_action).toBeTruthy();
  });
});