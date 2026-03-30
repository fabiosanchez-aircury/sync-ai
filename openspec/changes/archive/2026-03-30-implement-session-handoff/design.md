## Context

sync-ai is a new CLI tool for transferring session context between AI coding agents. Currently, users who switch between agents (due to credit limits, model preferences, or tool capabilities) lose all conversation context and must manually re-explain their work.

The tool needs to work with three agent formats:
- **Claude Code**: Stores sessions as JSONL files in `~/.claude/projects/<encoded-path>/`
- **OpenCode**: Uses `opencode export/import` commands and stores data in `~/.local/share/opencode/`
- **Cursor**: Stores transcripts as JSONL in `~/.cursor/projects/<encoded-path>/agent-transcripts/`

Each format has different structures for messages, tool calls, and file operations. The tool must normalize these into a common `HandoffFormat` that can be injected into target agents.

## Goals / Non-Goals

**Goals:**
- Extract session data from Claude Code, OpenCode, and Cursor
- Transform sessions into a standardized handoff format with summaries, decisions, and file changes
- Inject context into OpenCode (native import) and Cursor (rules files)
- Provide an interactive CLI for session selection and agent targeting
- Support both interactive and direct (flag-based) operation modes

**Non-Goals:**
- Real-time sync between agents (session must be explicitly extracted)
- Bidirectional sync (only source→target flow)
- Support for agents not listed (future expandability via plugin system)
- Automatic conflict resolution in file changes
- Merging multiple sessions into one

## Decisions

### Decision 1: TypeScript with ES Modules

**Choice:** Use TypeScript with ES Modules (NodeNext) and strict mode.

**Rationale:** 
- Strong typing is critical for data transformation between different formats
- ES Modules align with Node.js ecosystem direction
- Strict mode catches errors early in data handling code

**Alternatives considered:**
- JavaScript with JSDoc: Less type safety, more runtime errors in transformation logic
- CommonJS: Going against Node.js ecosystem direction, issues with some dependencies

### Decision 2: Functional Architecture over Classes

**Choice:** Use functional approach for extractors/injectors with abstract base classes for shared logic.

**Rationale:**
- Extractors and injectors are primarily data transformations
- State-less functions are easier to test and reason about
- Base classes provide common path handling and validation

**Alternatives considered:**
- Pure classes: More boilerplate for simple data operations
- No base classes: Code duplication for path encoding/decoding

### Decision 3: Commander.js + Inquirer.js for CLI

**Choice:** Use Commander.js for command parsing and Inquirer.js for interactive prompts.

**Rationale:**
- Commander.js is the most popular Node CLI framework
- Inquirer.js provides excellent interactive prompt UX
- Both have strong TypeScript support

**Alternatives considered:**
- Yargs: More configuration-heavy, less intuitive API
- Oclif: Overkill for single-command tool with subcommands
- Prompts (Terminus): Smaller but less mature

### Decision 4: Handoff JSON as Primary Transfer Format

**Choice:** Use a versioned JSON format as the canonical handoff representation.

**Rationale:**
- JSON is universally parseable by all target agents
- Versioning allows format evolution without breaking existing tools
- Can be saved to file for manual inspection or debugging
- Natural fit for `opencode import` and TypeScript

**Alternatives considered:**
- YAML: Requires additional parser, less native JSON support
- Binary: Not human-readable, debugging difficulty
- Direct API calls: Tighter coupling, version compatibility issues

### Decision 5: Native Import First, Fallback to Context Files

**Choice:** Attempt native `opencode import` first, fallback to AGENTS.md injection.

**Rationale:**
- Native import provides seamless handoff experience
- Fallback ensures tool works even when import isn't available
- AGENTS.md is interpreted by both OpenCode and Claude Code

**Alternatives considered:**
- Only native import: Fails when feature unavailable
- Only context files: Less seamless experience
- Clipboard injection: Not reliable across environments

### Decision 6: Lazy Extraction with Full History Option

**Choice:** Extract summary by default, full history only when requested.

**Rationale:**
- Most handoffs don't need complete transcript
- Summaries + key messages provide sufficient context
- Reduces handoff JSON size significantly
- `'conversation.full_history'` can be enabled for complex sessions

**Alternatives considered:**
- Always full history: Large files, slower processing
- No history option: Insufficient context for complex sessions

## Risks / Trade-offs

### Risk: Agent Format Changes → Mitigation
Agents may change their session storage format, breaking extractors.
- **Mitigation**: Version the handoff format; maintain backward compatibility; test against multiple agent versions.

### Risk: Session Size → Mitigation
Large sessions (100+ messages, many tool calls) may create massive handoff files.
- **Mitigation**: Limit key messages to last 4; truncate file lists to 10; offer `--compact` flag to exclude history entirely.

### Risk: Git State Mismatch → Mitigation
Session may reference files that have been modified or deleted since extraction.
- **Mitigation**: Include `git_status` in metadata; warn on injection if branch changed; files_to_focus helps user find correct state.

### Risk: Agent Location Discovery → Mitigation
Users may have non-standard agent installation locations.
- **Mitigation**: Support `AGENT_HOME` environment variables; allow `--agent-home` CLI override; graceful error messages.

### Trade-off: Native Import vs Portability
Native `opencode import` provides best UX but limits portability.
- **Trade-off accepted**: Primary use case is OpenCode; other agents use file-based injection.

### Trade-off: Accuracy vs Speed
Full transcript analysis provides better summaries but takes longer.
- **Trade-off accepted**: Fast heuristics (first message for goal, pattern matching for decisions) provide good-enough summaries for typical use.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           sync-ai CLI                               │
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────────────┐   │
│  │  EXTRACTOR   │──►│   TRANSFORMER    │──►│     INJECTOR        │   │
│  │             │   │                  │   │                     │   │
│  │ - Claude    │   │ - Session Summary│   │ - OpenCode import  │   │
│  │ - OpenCode  │   │ - File Changes   │   │ - Cursor rules     │   │
│  │ - Cursor    │   │ - Decisions      │   │ - Claude CLAUDE.md  │   │
│  │             │   │ - Learnings       │   │                     │   │
│  └─────────────┘   └──────────────────┘   └─────────────────────┘   │
│                                                                     │
│                      Handoff Format (JSON)                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User runs: sync-ai handoff
↓
CLI prompts for:
- Source agent (if not --from)
- Session ID (if not --session)
- Target agent (if not --to)
↓
Extractor.listSessions(projectPath)
↓
User selects session
↓
Extractor.extractSession(sessionId, projectPath)
↓
buildHandoff(session, targetAgent)
↓
Injector.validateHandoff(handoff)
↓
Injector.inject(handoff)
↓
Success or error message
```

## Migration Plan

### Phase 1: Core Infrastructure (This PR)
- Set up TypeScript project with strict mode
- DefineHandoffFormat and related types
- Implement CLI structure with Commander.js

### Phase 2: Claude Code Extraction
- Implement ClaudeCodeExtractor
- Parse JSONL format
- Extract messages, tool calls, file operations

### Phase 3: Transformation
- Implement session summary generation
- Implement decision/learning extraction
- Implement continuation prompt generation

### Phase 4: OpenCode Injection
- Implement OpenCodeInjector
- Native import support
- AGENTS.md fallback

### Phase 5: Cursor Support
- Implement CursorExtractor
- Implement CursorInjector
- Rules-based injection

### Rollback Strategy
If critical issues arise:
1. Revert to previous version via `npm install sync-ai@previous`
2. Manual handoff: Copy AGENTS.md context manually between agents
3. No data loss risk - sessions remain in source agent

## Open Questions

1. **Should we support bi-directional handoff?**
   - Current design is source→target only
   - Could add `sync-ai pull` to extract from target back to source
   - **Resolution**: Defer to future release; current use case is one-way

2. **Should we track handoff history?**
   - Could store handoff metadata in `.sync-ai/history/`
   - Would enable "undo last handoff" feature
   - **Resolution**: Defer to future release; keep initial scope minimal

3. **Should we merge multiple sessions?**
   - Could combine context from multiple sessions
   - Would require conflict resolution for overlapping decisions
   - **Resolution**: Defer to future release; complexity not justified for initial use case