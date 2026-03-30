import { describe, it, expect } from 'vitest';
import { ClaudeCodeExtractor } from '../../src/extractors/claude-code.js';

describe('ClaudeCodeExtractor', () => {
  const extractor = new ClaudeCodeExtractor();

  describe('getSessionLocation', () => {
    it('should return the correct path', () => {
      const location = extractor.getSessionLocation();
      expect(location).toContain('.claude');
      expect(location).toContain('projects');
    });
  });

  describe('encodeProjectPath', () => {
    it('should encode path with leading dash', () => {
      const result = extractor['encodeProjectPath']('/home/user/project');
      expect(result).toBe('--home-user-project');
    });

    it('should handle paths with multiple slashes', () => {
      const result = extractor['encodeProjectPath']('/home/user/my/project');
      expect(result).toBe('--home-user-my-project');
    });
  });

  describe('decodeProjectPath', () => {
    it('should decode encoded path back to original', () => {
      const original = '/home/user/project';
      const encoded = extractor['encodeProjectPath'](original);
      const decoded = extractor['decodeProjectPath'](encoded);
      expect(decoded).toBe(original);
    });
  });

  describe('listSessions', () => {
    it('should return empty array for non-existent directory', async () => {
      const sessions = await extractor.listSessions('/non/existent/path');
      expect(sessions).toEqual([]);
    });
  });
});