# sync-ai

AI Session Handoff Tool - Transfer context between AI coding agents.

## Description

Sync-ai enables seamless session handoff between AI coding assistants. When you need to switch from one AI agent to another (e.g., running out of credits, different model preferences), sync-ai extracts your session context and injects it into the target agent.

## Supported Agents

| Agent | Extraction | Injection |
|-------|------------|-----------|
| Claude Code | ✅ Full | 🔄 Planned |
| OpenCode | ✅ Full | ✅ Full |
| Cursor | ✅ Full | 🔄 Planned |

## Installation

```bash
npm install -g sync-ai
```

## Usage

```bash
# Interactive handoff
sync-ai handoff

# List available sessions
sync-ai list --from claude-code

# Direct handoff (non-interactive)
sync-ai handoff --from claude-code --to opencode --session <session-id>
```

## How It Works

1. **Extract**: Reads session data from the source agent's storage
2. **Transform**: Generates a comprehensive handoff format including:
   - Executive summary
   - File changes and diffs
   - Key decisions and learnings
   - Conversation highlights
3. **Inject**: Creates or updates session in the target agent

## Handoff Format

The handoff format captures:

- Session metadata (agent, project, branch)
- Executive summary (goal, progress, current task)
- Context (decisions, learnings, assumptions)
- File changes (modified, read, created, pending)
- Conversation history (full or key messages)
- Continuation prompt (ready-to-use for target agent)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## License

MIT