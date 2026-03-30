## 1. Project Setup & Infrastructure

- [x] 1.1 Install dependencies (commander, inquirer, chalk, ora, @types/inquirer, @types/node, typescript, vitest, eslint)
- [x] 1.2 Configure TypeScript with strict mode and NodeNext module resolution
- [x] 1.3 Create directory structure (src/cli/commands, src/extractors, src/transformers, src/injectors, src/types, src/utils)
- [x] 1.4 Set up Vitest for unit testing
- [x] 1.5 Configure ESLint with TypeScript rules

## 2. Type Definitions

- [x] 2.1 Define `AgentType` union type ('claude-code' | 'opencode' | 'cursor')
- [x] 2.2 Define `SessionStatus` enum ('in_progress', 'blocked', 'completed', 'awaiting_input')
- [x] 2.3 Define `Message` interface with role, content, timestamp, important fields
- [x] 2.4 Define `ToolCall` interface with name, input, result, timestamp
- [x] 2.5 Define `Decision` interface with decision, rationale, alternatives_considered, timestamp
- [x] 2.6 Define `FileChange` interface with path, change_type, diff, summary
- [x] 2.7 Define `Session` interface with all required and optional fields
- [x] 2.8 Define `SessionExtractor` interface with listSessions, extractSession, getSessionLocation methods
- [x] 2.9 Define `SessionInjector` interface with inject and validateHandoff methods
- [x] 2.10 Define `HandoffMetadata` interface with version, source, target, project
- [x] 2.11 Define `HandoffSummary` interface with goal, progress_percentage, current_task, status, blockers
- [x] 2.12 Define `HandoffContext` interface with conversation_summary, decisions, learnings, assumptions
- [x] 2.13 Define `HandoffFiles` interface with modified, read, created, pending_changes
- [x] 2.14 Define `HandoffConversation` interface with full_history, key_messages, tool_calls
- [x] 2.15 Define `HandoffContinuation` interface with prompt, suggested_first_action, files_to_focus
- [x] 2.16 Define `HandoffFormat` interface combining all sections
- [x] 2.17 Implement `createEmptyHandoff(sourceAgent, targetAgent, projectPath)` factory function
- [x] 2.18 Create `src/types/index.ts` to re-export all types
- [x] 2.19 Add `AGENT_CONFIGS` constant with display names, session locations, and capabilities
- [x] 2.20 Add `getAgentConfig(agent)` and `getSupportedAgents()` helper functions

## 3. Base Classes

- [x] 3.1 Implement `BaseExtractor` abstract class with common path encoding/decoding logic
- [x] 3.2 Implement `BaseInjector` abstract class with `validateHandoff` implementation

## 4. Claude Code Extraction

- [x] 4.1 Implement `ClaudeCodeExtractor.getSessionLocation()` returning `~/.claude/projects`
- [x] 4.2 Implement path encoding logic (slashes to dashes with leading dash)
- [x] 4.3 Implement path decoding logic (reverse transformation)
- [x] 4.4 Implement `ClaudeCodeExtractor.listSessions(projectPath)` to scan JSONL files
- [x] 4.5 Implement JSONL parsing for Claude Code format
- [x] 4.6 Handle `user` entry type extraction
- [x] 4.7 Handle `assistant` entry type extraction
- [x] 4.8 Handle `summary` entry type extraction
- [x] 4.9 Handle `tool_use` entry type extraction with toolName, toolInput, toolResult
- [x] 4.10 Implement file path extraction from tool calls (Read, Write, Edit operations)
- [x] 4.11 Implement `ClaudeCodeExtractor.extractSession(sessionId, projectPath)`
- [x] 4.12 Add error handling for malformed JSONL lines
- [x] 4.13 Add tests for Claude Code extractor
- [x] 5.7 Add tests for OpenCode extractor
- [ ] 6.8 Add tests for Cursor extractor
- [x] 7.14 Add tests for transformation functions
- [ ] 8.8 Add tests for OpenCode injector
- [x] 9.7 Add tests for Cursor injector
- [ ] 10.14 Add tests for CLI commands

## 11. Testing & Quality

- [ ] 11.1 Write unit tests for all extractors
- [ ] 11.2 Write unit tests for all transformers
- [ ] 11.3 Write unit tests for all injectors
- [ ] 11.4 Write integration tests for full handoff flow
- [x] 11.5 Add npm scripts for test, coverage, lint, typecheck
- [ ] 11.6 Ensure 80%+ code coverage
- [ ] 11.7 Run lint and fix all issues
- [x] 11.8 Run typecheck and fix all errors

## 12. Documentation

- [x] 12.1 Update README.md with installation instructions
- [x] 12.2 Add usage examples for all commands
- [x] 12.3 Document HandoffFormat specification in README
- [x] 12.4 Document supported agents and their locations
- [x] 12.5 Add troubleshooting section to README
- [x] 12.6 Update AGENTS.md with implementation notes
- [ ] 12.7 Add JSDoc comments to all public functions
- [x] 12.8 Create example handoff JSON in docs/

## 13. Final Integration

- [ ] 13.1 Verify CLI works end-to-end with Claude Code → OpenCode
- [ ] 13.2 Verify CLI works end-to-end with Claude Code → Cursor
- [ ] 13.3 Verify CLI works end-to-end with Cursor → OpenCode
- [ ] 13.4 Verify --output flag produces valid JSON
- [ ] 13.5 Verify error handling for missing sessions
- [ ] 13.6 Verify error handling for invalid agents
- [ ] 13.7 Test with real Claude Code session data
- [ ] 13.8 Test with real OpenCode session data
- [ ] 13.9 Test with real Cursor session data
- [ ] 14.0 Create git commit with conventional commit message