# AGENTS.md - AI Session Handoff Tool

> This file provides context for AI coding assistants working on this project.

## Project Overview

sync-ai is a CLI tool that enables session handoff between AI coding agents. It extracts context from one agent and injects it into another, allowing seamless continuation of work when switching tools.

## Architecture

```
src/
├── cli/                    # CLI commands and prompts
│   ├── index.ts           # Entry point
│   └── commands/          # Individual commands (handoff, list, extract, inject)
├── extractors/            # Agent-specific session extractors
│   ├── base.ts            # Base extractor interface
│   ├── claude-code.ts     # Claude Code JSONL parser
│   ├── opencode.ts        # OpenCode export parser
│   └── cursor.ts          # Cursor transcript parser
├── transformers/          # Session transformation logic
│   ├── session-summary.ts # Generate executive summaries
│   ├── context-builder.ts # Build rich context
│   └── handoff-prompt.ts # Generate continuation prompts
├── injectors/             # Agent-specific context injectors
│   ├── base.ts            # Base injector interface
│   ├── opencode.ts        # OpenCode importer
│   └── cursor.ts          # Cursor context import
└── types/                 # TypeScript type definitions
    ├── session.ts         # Session types
    ├── handoff.ts         # Handoff format types
    └── agents.ts          # Agent-specific types
```

## Key Types

### HandoffFormat

```typescript
interface HandoffFormat {
  version: "1.0.0";
  metadata: {
    source: { agent: AgentType; session_id: string; timestamp: string };
    target: { agent: AgentType };
    project: { path: string; git_branch: string };
  };
  summary: {
    goal: string;
    progress_percentage: number;
    current_task: string;
    status: SessionStatus;
  };
  context: {
    conversation_summary: string;
    decisions: Decision[];
    learnings: string[];
    assumptions: string[];
  };
  files: {
    modified: FileChange[];
    read: string[];
    created: string[];
    pending_changes: PendingChange[];
  };
  conversation: {
    full_history?: Message[];
    key_messages: Message[];
    tool_calls: ToolCall[];
  };
  continuation: {
    prompt: string;
    suggested_first_action: string;
    files_to_focus: string[];
  };
}
```

## Session Locations

| Agent | Location |
|-------|----------|
| Claude Code | `~/.claude/projects/<encoded-path>/*.jsonl` |
| OpenCode | `~/.local/share/opencode/` (uses `opencode export`) |
| Cursor | `~/.cursor/projects/<encoded-path>/agent-transcripts/<id>/*.jsonl` |

## Coding Conventions

- **Language**: TypeScript with strict mode
- **Module**: ES Modules (NodeNext)
- **Style**: Functional over class-based where appropriate
- **Error handling**: Result types with explicit error handling
- **Testing**: Vitest for unit tests

## Commands

```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode compilation
npm run test       # Run tests
npm run lint       # ESLint
npm run typecheck  # Type checking
```

## OpenSpec Workflow

This project uses OpenSpec for spec-driven development:

- `openspec/` contains specifications and change proposals
- Use `/opsx:propose` to create new features
- Use `/opsx:apply` to implement changes
- Use `/opsx:archive` to complete changes

## When Making Changes

1. Check existing specs in `openspec/specs/`
2. Create or update specs before implementation
3. Follow the handoff format specification for compatibility
4. Add tests for new extractors/transformers/injectors
5. Update AGENTS.md when architecture changes