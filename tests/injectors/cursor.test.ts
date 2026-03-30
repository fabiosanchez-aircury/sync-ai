import { describe, it, expect } from 'vitest';
import { CursorInjector } from '../../src/injectors/cursor.js';
import type { HandoffFormat } from '../../src/types/index.js';

describe('CursorInjector', () => {
  const injector = new CursorInjector();

  describe('validateHandoff', () => {
    it('should validate a correct handoff', async () => {
      const handoff: HandoffFormat = {
        version: '1.0.0',
        metadata: {
          version: '1.0.0',
          source: {
            agent: 'claude-code',
            version: '1.0',
            session_id: 'test-session',
            timestamp: new Date().toISOString(),
          },
          target: { agent: 'cursor' },
          project: {
            path: '/test/project',
            git_branch: 'main',
            git_status: '',
          },
        },
        summary: {
          goal: 'Test goal',
          progress_percentage: 50,
          current_task: 'Test task',
          status: 'in_progress',
        },
        context: {
          conversation_summary: 'Test summary',
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
          prompt: 'Test prompt',
          suggested_first_action: 'Test action',
          files_to_focus: [],
        },
      };

      const result = await injector.validateHandoff(handoff);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing version', async () => {
      const handoff = {
        metadata: {},
        summary: {},
        context: {},
        files: {},
        conversation: {},
        continuation: {},
      };

      const result = await injector.validateHandoff(handoff as HandoffFormat);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});