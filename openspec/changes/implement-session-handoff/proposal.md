# Proposal: Implement Session Handoff

## Why

AI coding assistants (Claude Code, OpenCode, Cursor) have siloed session contexts. When users need to switch between agents—due to credit limits, model preferences, or tool capabilities—they lose all context and must manually re-explain their work. This friction wastes time and degrades productivity.

**sync-ai** solves this by enabling seamless context transfer between AI agents. Users can start work in one agent and continue in another without losing progress, decisions, or file context.

## What Changes

### New Features

- **CLI Tool**: Interactive command-line interface for session handoff
- **Session Extraction**: Parse session data from Claude Code, OpenCode, and Cursor
- **Context Transformation**: Generate executive summaries, track decisions, extractlearnings
- **Context Injection**: Import contexts into target agents (OpenCode, Cursor)
- **Handoff Format**: Standardized JSON format for session data interchange

### Technical Implementation

- TypeScript-based CLI with Commander.js and Inquirer
- Agent-specific extractors for each supported AI tool
- Transformers for context summarization and continuation prompts
- Injectors for native session import in target agents
- Support for file change tracking, tool call history, and conversation summaries

## Capabilities

### New Capabilities

- `session-extraction`: Parse and extract session data from Claude Code (JSONL), OpenCode (export), and Cursor (JSONL transcripts). Detect session location, read history, extract file operations.
  
- `session-transformation`: Transform raw session data into standardized handoff format. Generate executive summaries, extract decisions/learnings/assumptions, build continuation prompts, identify key messages.
  
- `session-injection`: Inject handoff context into target agents. Support OpenCode native import, Cursor rules-based injection, and manual JSON export for other agents.
  
- `cli-interface`: Interactive command-line interface with `handoff`, `list`, `extract`, `inject` commands. Support project path detection, session selection, and cross-agent operations.
  
- `handoff-format`: Define and implement the HandoffFormat v1.0.0 specification. Include metadata, summary, context, files, conversation, and continuation sections.

### Modified Capabilities

- None (initial implementation)

## Impact

### Code Organization

- `src/extractors/` - Agent-specific session parsers
- `src/transformers/` - Context transformation logic
- `src/injectors/` - Agent-specific context injectors
- `src/types/` - TypeScript type definitions forHandoffFormat
- `src/cli/` - Command-line interface implementation

### Dependencies

- Commander.js (CLI framework)
- Inquirer.js (Interactive prompts)
- chalk (Terminal styling)
- Node.js built-infs, path, os, child_process

### Agent Data Locations

| Agent | Location | Format |
|-------|----------|--------|
| Claude Code | `~/.claude/projects/<encoded-path>/*.jsonl` | JSONL |
| OpenCode | `~/.local/share/opencode/` | JSON (via `opencode export`) |
| Cursor | `~/.cursor/projects/<encoded-path>/agent-transcripts/<id>/*.jsonl` | JSONL |

### User Experience

1. User runs `sync-ai handoff`
2. CLI prompts for source agent, session, target agent
3. Tool extracts session, transforms to handoff format
4. Tool injects context into target agent
5. User continues working in target agent无缝

### Breaking Changes

None (new tool, no existing contracts to break)