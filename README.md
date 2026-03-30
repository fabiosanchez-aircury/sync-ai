# sync-ai

AI Session Handoff Tool - Transfer context between AI coding agents.

## Why sync-ai?

When working with AI coding assistants, you may need to switch between tools:
- **Credits exhausted** in one agent
- **Different model preferences** for specific tasks
- **Tool-specific capabilities** (e.g., one agent better at refactoring)

Sync-ai lets you Seamlessly transfer your session context from one agent to another, preserving:
- Your conversation history and decisions
- Files you've read and modified
- Key learnings and assumptions
- Current task and progress

## Supported Agents

| Agent | Extraction | Injection |
|-------|------------|-----------|
| Claude Code | ✅ Full | 🔄 Planned |
| OpenCode | ✅ Full | ✅ Full |
| Cursor | ✅ Full | ✅ Full |

## Installation

```bash
npm install -g sync-ai
```

Or run directly:

```bash
npx sync-ai handoff
```

## Usage

### Interactive Handoff

```bash
sync-ai handoff
```

This will prompt you to:
1. Select the source agent (where your session is)
2. Select the session to transfer
3. Select the target agent (where you want to continue)
4. Confirm and transfer

### List Available Sessions

```bash
# List sessions from Claude Code
sync-ai list --from claude-code

# List sessions from OpenCode
sync-ai list --from opencode

# Output as JSON
sync-ai list --from cursor --json
```

### Direct Handoff (Non-interactive)

```bash
# Specify all options
sync-ai handoff \
  --from claude-code \
  --to opencode \
  --session <session-id> \
  --project /path/to/project

# Save to file instead of injecting
sync-ai handoff \
  --from cursor \
  --to opencode \
  --session <session-id> \
  --output handoff.json
```

## How It Works

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Claude Code     │───►│   sync-ai        │───►│   OpenCode      │
│  (source)        │    │   Transform      │    │   (target)      │
│                  │    │                  │    │                 │
│ ~/.claude/       │    │ - Extract session│    │ ~/.local/share/ │
│  projects/       │    │ - Generate handoff│   │  opencode/      │
│  *.jsonl         │    │ - Inject context │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Extraction

Sync-ai reads session data from the source agent's storage:

| Agent | Location | Format |
|-------|----------|--------|
| Claude Code | `~/.claude/projects/<encoded-path>/*.jsonl` | JSONL |
| OpenCode | `~/.local/share/opencode/` | JSON (via CLI) |
| Cursor | `~/.cursor/projects/<encoded-path>/agent-transcripts/<id>/*.jsonl` | JSONL |

### Transformation

The session is transformed into a standardized `HandoffFormat`:

```json
{
  "version": "1.0.0",
  "metadata": {
    "source": { "agent": "claude-code", "session_id": "abc123" },
    "target": { "agent": "opencode" },
    "project": { "path": "/home/user/myapp", "git_branch": "feature/auth" }
  },
  "summary": {
    "goal": "Implement user authentication",
    "progress_percentage": 65,
    "current_task": "Adding JWT token refresh"
  },
  "context": {
    "decisions": [{ "decision": "Use JWT for auth", "rationale": "Better for mobile apps" }],
    "learnings": ["Bcrypt is faster than Argon2 for our use case"],
    "assumptions": ["Users will have modern browsers"]
  },
  "files": {
    "modified": [{ "path": "src/auth.ts", "summary": "Added login/logout" }],
    "read": ["src/utils.ts", "package.json"]
  },
  "continuation": {
    "prompt": "## Session Handoff from Claude Code to OpenCode...",
    "suggested_first_action": "Continue with: Adding JWT token refresh",
    "files_to_focus": ["src/auth.ts", "src/middleware/auth.ts"]
  }
}
```

### Injection

Sync-ai injects the context into the target agent:

**OpenCode:**
- Attempts native `opencode import` first
- Falls back to creating context files:
  - `sync-ai-context.md` in OpenCode data directory
  - Updates `AGENTS.md` with continuation prompt

**Cursor:**
- Creates `.cursor/sync-ai-handoff.md` with formatted rules context
- Creates `.cursor/sync-ai-context.json` with full handoff data

## Handoff Format Specification

### Metadata

```typescript
interface HandoffMetadata {
  version: "1.0.0";
  source: {
    agent: AgentType;
    version: string;
    session_id: string;
    timestamp: string;
  };
  target: { agent: AgentType };
  project: {
    path: string;
    git_branch: string;
    git_status: string;
  };
}
```

### Summary

```typescript
interface HandoffSummary {
  goal: string;
  progress_percentage: number;
  current_task: string;
  status: 'in_progress' | 'blocked' | 'completed' | 'awaiting_input';
  blockers?: string[];
}
```

### Context

```typescript
interface HandoffContext {
  conversation_summary: string;
  decisions: Decision[];
  learnings: string[];
  assumptions: string[];
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Architecture

```
src/
├── cli/
│   ├── index.ts           # CLI entry point
│   └── commands/          # Command implementations
├── extractors/            # Agent-specific extractors
│   ├── base.ts           # Base extractor interface
│   ├── claude-code.ts    # Claude Code JSONL parser
│   ├── opencode.ts       # OpenCode CLI integration
│   └── cursor.ts         # Cursor transcript parser
├── transformers/          # Session transformation
│   ├── session-summary.ts # Generate summaries
│   └── context-builder.ts # Build handoff format
├── injectors/            # Agent-specific injectors
│   ├── base.ts           # Base injector interface
│   ├── opencode.ts       # OpenCode import/inject
│   └── cursor.ts         # Cursor rules injection
└── types/                # TypeScript definitions
    ├── session.ts        # Session types
    ├── handoff.ts        # Handoff format types
    └── agents.ts         # Agent configuration
```

## Troubleshooting

### No sessions found

```
❌ No sessions found for this project.
```

Make sure you've used the source agent in this project. Sessions are stored per-project.

### Invalid agent

```
❌ Handoff failed: Unknown agent: some-agent
```

Supported agents are: `claude-code`, `opencode`, `cursor`

### Injection failed

```
❌ Handoff failed: Unable to write to target location
```

Check that you have write permissions to the project directory.

## License

MIT