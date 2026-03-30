## ADDED Requirements

### Requirement: CLI Entry Point
The system SHALL provide a command-line interface using Commander.js.

#### Scenario: CLI starts with sync-ai command
- **WHEN** user runs `sync-ai` or `sync-ai --help`
- **THEN** the system SHALL display available commands and options
- **AND** show version with `--version` flag

### Requirement: Handoff Command
The system SHALL provide an interactive `handoff` command for session transfer.

#### Scenario: Interactive source agent selection
- **WHEN** user runs `sync-ai handoff` without `--from` flag
- **THEN** the system SHALL prompt user to select from supported agents
- **AND** display agent display names

#### Scenario: Interactive target agent selection
- **WHEN** user runs `sync-ai handoff` without `--to` flag
- **THEN** the system SHALL prompt user to select target agent
- **AND** exclude source agent from options

#### Scenario: Interactive session selection
- **WHEN** user runs `sync-ai handoff` without `--session` flag
- **THEN** the system SHALL list available sessions from source agent
- **AND** show session summary and timestamp
- **AND** limit to 20 most recent sessions

#### Scenario: Direct handoff with all flags
- **WHEN** user runs `sync-ai handoff --from claude-code --to opencode --session <id> --project /path`
- **THEN** the system SHALL skip all prompts
- **AND** proceed directly to extraction and injection

#### Scenario: Output to file
- **WHEN** user runs `sync-ai handoff --output handoff.json`
- **THEN** the system SHALL save the handoff JSON to the specified file
- **AND** NOT perform injection

### Requirement: List Command
The system SHALL provide a `list` command to show available sessions.

#### Scenario: List sessions with required --from flag
- **WHEN** user runs `sync-ai list --from claude-code --project /path`
- **THEN** the system SHALL display all sessions for the project
- **AND** show session ID, summary, and last modified date

#### Scenario: JSON output format
- **WHEN** user runs `sync-ai list --from opencode --json`
- **THEN** the system SHALL output session list as JSON array
- **AND** include all session fields

### Requirement: Project Path Handling
The system SHALL correctly resolve project paths.

#### Scenario: Default to current directory
- **WHEN** user runs command without `--project` flag
- **THEN** the system SHALL use current working directory (`process.cwd()`)

#### Scenario: Handle relative paths
- **WHEN** user provides relative path like `./project`
- **THEN** the system SHALL resolve to absolute path

#### Scenario: Handle home directory shorthand
- **WHEN** user provides path like `~/project`
- **THEN** the system SHALL expand to full home directory path

### Requirement: Progress Indication
The system SHALL provide visual feedback during operations.

#### Scenario: Show extraction progress
- **WHEN** extracting session data
- **THEN** the system SHALL display "📝 Extracting session..."
- **AND** show message count when complete

#### Scenario: Show transformation progress
- **WHEN** transforming session data
- **THEN** the system SHALL display "🔄 Transforming session..."

#### Scenario: Show injection progress
- **WHEN** injecting into target agent
- **THEN** the system SHALL display "📤 Injecting into <agent>..."

#### Scenario: Show success message
- **WHEN** handoff completes successfully
- **THEN** the system SHALL display "✅ Handoff complete!"
- **AND** show session ID if available
- **AND** show which agent to use next

### Requirement: Error Display
The system SHALL display clear error messages.

#### Scenario: No sessions found
- **WHEN** list or handoff finds no sessions
- **THEN** the system SHALL display "❌ No sessions found for this project."
- **AND** suggest verifying the agent was used in this project

#### Scenario: Invalid session ID
- **WHEN** user provides non-existent session ID
- **THEN** the system SHALL display error with the session ID
- **AND** exit with non-zero status

#### Scenario: Injection failure
- **WHEN** injection fails
- **THEN** the system SHALL display "❌ Handoff failed:" with error message
- **AND** exit with non-zero status

### Requirement: Agent Configuration Display
The system SHALL show agent names consistently.

#### Scenario: Display agent names
- **WHEN** showing agent names in prompts or messages
- **THEN** use display names: "Claude Code", "OpenCode", "Cursor"
- **AND** NOT use kebab-case names in user-facing output