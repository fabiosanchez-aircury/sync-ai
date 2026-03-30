## ADDED Requirements

### Requirement: Injector Interface
The system SHALL provide a base `SessionInjector` interface that all agent-specific injectors MUST implement.

#### Scenario: Injector implements required methods
- **WHEN** a new injector is created
- **THEN** it MUST implement `inject(handoff: HandoffFormat)` and `validateHandoff(handoff: HandoffFormat)`

### Requirement: Handoff Validation
The system SHALL validate handoff data before injection.

#### Scenario: Validate required fields
- **WHEN** `validateHandoff` is called
- **THEN** the system SHALL check for required version, source session ID, target agent, goal, and continuation prompt
- **AND** return validation result with any errors

### Requirement: OpenCode Native Import
The system SHALL inject handoff context into OpenCode using native import functionality.

#### Scenario: Import via OpenCode CLI
- **WHEN** injecting into OpenCode
- **THEN** the system SHALL attempt `opencode import <file>` with the handoff JSON
- **AND** return the session ID from the output

#### Scenario: Fallback to context injection
- **WHEN** native import is unavailable
- **THEN** the system SHALL create context files in the project
- **AND** append continuation prompt to AGENTS.md or create it
- **AND** save full handoff JSON to sync-ai-context.json in OpenCode data directory

### Requirement: Cursor Rules Injection
The system SHALL inject handoff context into Cursor via rules files.

#### Scenario: Create .cursor/sync-ai-handoff.md
- **WHEN** injecting into Cursor
- **THEN** the system SHALL create a markdown file in `.cursor/` directory
- **AND** format handoff data as Cursor rules context
- **AND** include decisions as "Key Decisions Made" section
- **AND** include learnings as "Learnings" section

#### Scenario: Create context JSON
- **WHEN** injecting into Cursor
- **THEN** the system SHALL also save the full handoff JSON to `.cursor/sync-ai-context.json`
- **AND** allow manual reference if needed

### Requirement: Claude Code Injection
The system SHALL support injecting handoff context into Claude Code.

#### Scenario: Create context in CLAUDE.md
- **WHEN** injecting into Claude Code
- **THEN** the system SHALL append continuation prompt to project's CLAUDE.md
- **AND** include decisions and learnings as context sections
- **AND** save full handoff JSON to `.claude/sync-ai-context.json`
- **AND** preserve existing CLAUDE.md content

### Requirement: Error Handling
The system SHALL handle injection failures gracefully.

#### Scenario: Invalid handoff data
- **WHEN** handoff validation fails
- **THEN** the system SHALL return a descriptive error message
- **AND** list all validation errors
- **AND** NOT attempt injection

#### Scenario: Target agent unavailable
- **WHEN** the target agent's data directory does not exist
- **THEN** the system SHALL create the necessary directories
- **AND** proceed with injection

#### Scenario: Write permission denied
- **WHEN** the system cannot write to the target location
- **THEN** the system SHALL return an error with the file path
- **AND** suggest permission resolution steps