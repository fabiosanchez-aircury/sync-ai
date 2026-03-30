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
- [ ] 4.13 Add tests for Claude Code extractor

## 5. OpenCode Extraction

- [x] 5.1 Implement `OpenCodeExtractor.getSessionLocation()` returning `~/.local/share/opencode`
- [ ] 5.2 Implement `OpenCodeExtractor.listSessions(projectPath)` using `opencode session list` command
- [ ] 5.3 Parse JSON output from `opencode session list`
- [ ] 5.4 Implement `OpenCodeExtractor.extractSession(sessionId, projectPath)` using `opencode export sessionId`
- [ ] 5.5 Map OpenCode format to Session interface
- [ ] 5.6 Add error handling for missing/invalid sessions
- [ ] 5.7 Add tests for OpenCode extractor

## 6. Cursor Extraction

- [x] 6.1 Implement `CursorExtractor.getSessionLocation()` returning `~/.cursor/projects`
- [x] 6.2 Implement `CursorExtractor.listSessions(projectPath)` to scan agent-transcripts directories
- [x] 6.3 Implement JSONL parsing for Cursor format (role, message.content array)
- [x] 6.4 Handle Cursor content format (array of {type, text} objects)
- [x] 6.5 Extract text from `<user_query>` tags when present
- [x] 6.6 Implement `CursorExtractor.extractSession(sessionId, projectPath)`
- [x] 6.7 Add error handling for missing/invalid sessions
- [ ] 6.8 Add tests for Cursor extractor

## 7. Session Transformation

- [x] 7.1 Implement `generateSummary(session)` function
- [x] 7.2 Implement goal extraction from first user message
- [x] 7.3 Implement progress estimation based on message count
- [x] 7.4 Implement current task extraction from recent assistant messages
- [x] 7.5 Implement blocker extraction using pattern matching
- [x] 7.6 Implement decision extraction with rationale
- [x] 7.7 Implement learning extraction
- [x] 7.8 Implement assumption extraction
- [x] 7.9 Implement `buildHandoff(session, targetAgent)` main transformation function
- [x] 7.10 Build conversation summary with topic extraction
- [x] 7.11 Implement key message selection (first user + last 4 messages)
- [x] 7.12 Implement file focus extraction (recent reads + modified)
- [x] 7.13 Implement continuation prompt generation with all sections
- [ ] 7.14 Add tests for transformation functions

## 8. OpenCode Injection

- [x] 8.1 Implement `OpenCodeInjector.validateHandoff(handoff)`
- [x] 8.2 Implement native import attempt using `opencode import <file>`
- [x] 8.3 Parse session ID from `opencode import` output
- [x] 8.4 Implement fallback: create sync-ai-context.md in opencode data directory
- [x] 8.5 Implement fallback: append continuation prompt to AGENTS.md
- [x] 8.6 Create AGENTS.md if it doesn't exist
- [x] 8.7 Add error handling for import failures
- [ ] 8.8 Add tests for OpenCode injector

## 9. Cursor Injection

- [x] 9.1 Implement `CursorInjector.validateHandoff(handoff)`
- [x] 9.2 Create `.cursor/` directory if needed
- [x] 9.3 Implement `formatAsCursorRules(handoff)` for markdown rules format
- [x] 9.4 Create `.cursor/sync-ai-handoff.md` with formatted content
- [x] 9.5 Create `.cursor/sync-ai-context.json` with full handoff JSON
- [x] 9.6 Add error handling for permission issues
- [ ] 9.7 Add tests for Cursor injector

## 10. CLI Implementation

- [x] 10.1 Set up Commander.js program with name, description, version
- [x] 10.2 Implement `handoff` command definition with options
- [x] 10.3 Implement `list` command definition with options
- [x] 10.4 Implement agent selection prompts using Inquirer
- [x] 10.5 Implement session listing and selection prompts
- [x] 10.6 Implement project path resolution (cwd, relative, home expansion)
- [x] 10.7 Wire up command handlers to extractor/transformer/injector flow
- [x] 10.8 Add progress indicators with ora (extracting, transforming, injecting)
- [x] 10.9 Format success messages with chalk (✅ checkmarks, colors)
- [x] 10.10 Format error messages with chalk (❌ X marks, red colors)
- [x] 10.11 Handle --output flag to save handoff JSON instead of injecting
- [x] 10.12 Add `--json` flag to list command for JSON output
- [x] 10.13 Add CLI entry point with shebang (#!/usr/bin/env node)
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

- [ ] 12.1 Update README.md with installation instructions
- [ ] 12.2 Add usage examples for all commands
- [ ] 12.3 Document HandoffFormat specification in README
- [ ] 12.4 Document supported agents and their locations
- [ ] 12.5 Add troubleshooting section to README
- [ ] 12.6 Update AGENTS.md with implementation notes
- [ ] 12.7 Add JSDoc comments to all public functions
- [ ] 12.8 Create example handoff JSON in docs/

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