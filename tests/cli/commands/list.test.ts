import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listCommand } from '../../../src/cli/commands/list';

vi.mock('../../../src/extractors/claude-code', () => ({
  ClaudeCodeExtractor: vi.fn().mockImplementation(() => ({
    listSessions: vi.fn().mockResolvedValue([
      {
        id: 'test-session-1',
        agent: 'claude-code',
        project_path: '/test/project',
        messages: [],
        summary: 'Test session 1',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T01:00:00.000Z',
      },
      {
        id: 'test-session-2',
        agent: 'claude-code',
        project_path: '/test/project',
        messages: [],
        summary: 'Test session 2',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T02:00:00.000Z',
      },
    ]),
  })),
}));

vi.mock('../../../src/extractors/opencode', () => ({
  OpenCodeExtractor: vi.fn().mockImplementation(() => ({
    listSessions: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('../../../src/extractors/cursor', () => ({
  CursorExtractor: vi.fn().mockImplementation(() => ({
    listSessions: vi.fn().mockResolvedValue([]),
  })),
}));

describe('listCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list sessions from claude-code agent', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await listCommand({
      from: 'claude-code',
      project: '/test/project',
      json: false,
    });

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join(' ');
    expect(output).toContain('Found 2 session(s)');
    expect(output).toContain('Test session 1');
    expect(output).toContain('Test session 2');

    consoleSpy.mockRestore();
  });

  it('should output JSON when json flag is true', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await listCommand({
      from: 'claude-code',
      project: '/test/project',
      json: true,
    });

    expect(consoleSpy).toHaveBeenCalled();
    const allOutput = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    const jsonMatch = allOutput.match(/\[\s*\{[\s\S]*\}\s*\]/);
    expect(jsonMatch).not.toBeNull();
    const parsed = JSON.parse(jsonMatch[0]);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('test-session-1');

    consoleSpy.mockRestore();
  });
});