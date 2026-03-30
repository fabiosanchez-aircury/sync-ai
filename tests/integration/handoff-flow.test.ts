import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ClaudeCodeExtractor } from '../../src/extractors/claude-code.js';
import { buildHandoff } from '../../src/transformers/index.js';
import { OpenCodeInjector } from '../../src/injectors/opencode.js';
import { CursorInjector } from '../../src/injectors/cursor.js';
import type { Session, HandoffFormat, FileChange } from '../../src/types/index.js';

async function createMockSession(projectPath: string): Promise<Session> {
  return {
    id: 'test-session-' + Date.now(),
    agent: 'claude-code',
    project_path: projectPath,
    messages: [
      { role: 'user', content: '<user_query>Implement a hello world function</user_query>' },
      { role: 'assistant', content: 'I will create a hello world function for you. Decision: Use TypeScript for type safety.' },
      { role: 'user', content: 'Add tests for it too' },
      { role: 'assistant', content: 'Done! Created hello.test.ts. I learned that the project uses ES modules.' },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    summary: 'Implement a hello world function',
    files_read: ['/src/index.ts'],
    files_modified: [{ path: '/src/hello.ts', change_type: 'modified', summary: 'Added hello function' }, { path: '/tests/hello.test.ts', change_type: 'modified', summary: 'Added tests' }],
    files_created: [],
    tool_calls: [
      { name: 'Read', input: { path: '/src/index.ts' }, result: 'file content' },
      { name: 'Write', input: { path: '/src/hello.ts' }, result: 'success' },
    ],
    status: 'in_progress',
  };
}

describe('Full Handoff Flow', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-ai-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Extractor to Handoff transformation', () => {
    it('should transform Claude Code session to handoff format', async () => {
      const session = await createMockSession(tempDir);
      const handoff = buildHandoff(session, 'opencode');

      expect(handoff.version).toBe('1.0.0');
      expect(handoff.metadata.source.agent).toBe('claude-code');
      expect(handoff.metadata.target.agent).toBe('opencode');
      expect(handoff.summary.goal).toBe('Implement a hello world function');
      expect(handoff.summary.status).toBe('in_progress');
      expect(handoff.context.decisions).toHaveLength(1);
      expect(handoff.context.learnings).toHaveLength(1);
      expect(handoff.files.modified).toHaveLength(2);
      expect(handoff.continuation.prompt).toContain('Implement a hello world function');
    });

    it('should transform session to Cursor handoff', async () => {
      const session = await createMockSession(tempDir);
      const handoff = buildHandoff(session, 'cursor');

      expect(handoff.metadata.target.agent).toBe('cursor');
      expect(handoff.continuation.suggested_first_action).toBeDefined();
      expect(handoff.continuation.files_to_focus).toContain('/src/hello.ts');
    });
  });

  describe('Handoff validation', () => {
    it('should validate correct handoff for OpenCode', async () => {
      const session = await createMockSession(tempDir);
      const handoff = buildHandoff(session, 'opencode');
      const injector = new OpenCodeInjector();

      const result = await injector.validateHandoff(handoff);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct handoff for Cursor', async () => {
      const session = await createMockSession(tempDir);
      const handoff = buildHandoff(session, 'cursor');
      const injector = new CursorInjector();

      const result = await injector.validateHandoff(handoff);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid handoff missing version', async () => {
      const injector = new OpenCodeInjector();
      const invalidHandoff = {
        metadata: {},
        summary: {},
        context: {},
        files: {},
        conversation: {},
        continuation: {},
      };

      const result = await injector.validateHandoff(invalidHandoff as HandoffFormat);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Path encoding/decoding', () => {
    it('should correctly encode and decode project paths without hyphens', () => {
      const extractor = new ClaudeCodeExtractor();
      const projectPath = '/home/user/myproject';

      const encoded = extractor['encodeProjectPath'](projectPath);
      const decoded = extractor['decodeProjectPath'](encoded);

      expect(decoded).toBe(projectPath);
    });

    it('should handle paths with spaces', () => {
      const extractor = new ClaudeCodeExtractor();
      const projectPath = '/home/user/my project';

      const encoded = extractor['encodeProjectPath'](projectPath);
      const decoded = extractor['decodeProjectPath'](encoded);

      expect(decoded).toBe(projectPath);
    });
  });

  describe('Session summary generation', () => {
    it('should extract goal from user_query tags', async () => {
      const session: Session = {
        id: 'test',
        agent: 'claude-code',
        project_path: tempDir,
        messages: [
          { role: 'user', content: '<user_query>Fix the bug in login</user_query>' },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const handoff = buildHandoff(session, 'opencode');
      expect(handoff.summary.goal).toBe('Fix the bug in login');
    });

    it('should estimate progress from message count', async () => {
      const session: Session = {
        id: 'test',
        agent: 'claude-code',
        project_path: tempDir,
        messages: [
          { role: 'user', content: 'Start' },
          { role: 'assistant', content: 'Working' },
          { role: 'user', content: 'Continue' },
          { role: 'assistant', content: 'Done' },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const handoff = buildHandoff(session, 'opencode');
      expect(handoff.summary.progress_percentage).toBeGreaterThan(0);
      expect(handoff.summary.progress_percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Injector context creation', () => {
    it('should create valid context file for OpenCode', async () => {
      const session: Session = {
        id: 'test',
        agent: 'claude-code',
        project_path: tempDir,
        messages: [
          { role: 'user', content: '<user_query>Build feature</user_query>' },
          { role: 'assistant', content: 'Decision: Use React for the UI because it is popular' },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const handoff = buildHandoff(session, 'opencode');
      const injector = new OpenCodeInjector();

      const contextContent = injector['formatContextForOpenCode'](handoff);

      expect(contextContent).toContain('# Session Context');
      expect(contextContent).toContain('Build feature');
      if (handoff.context.decisions.length > 0) {
        expect(contextContent).toContain('## Decisions');
      }
    });
  });
});