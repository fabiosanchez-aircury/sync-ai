## ADDED Requirements

### Requirement: Extractor Interface
The system SHALL provide a base `SessionExtractor` interface that all agent-specific extractors MUST implement.

#### Scenario: Extractor implements required methods
- **WHEN** a new extractor is created
- **THEN** it MUST implement `listSessions(projectPath: string)`, `extractSession(sessionId: string, projectPath: string)`, and `getSessionLocation()`

### Requirement: Claude Code Session Extraction
The system SHALL extract session data from Claude Code's JSONL storage format.

#### Scenario: List Claude Code sessions
- **WHEN** `listSessions` is called with a project path
- **THEN** the system SHALL scan `~/.claude/projects/<encoded-path>/` for `.jsonl` files
- **AND** return an array of Session objects with id, summary, and timestamps

#### Scenario: Extract Claude Code session content
- **WHEN** `extractSession` is called with a valid session ID
- **THEN** the system SHALL parse the JSONL file
- **AND** extract all user and assistant messages
- **AND** extract tool calls with their inputs and results
- **AND** extract file read/write operations from tool calls
- **AND** return a complete Session object

#### Scenario: Handle Claude Code message types
- **WHEN** parsing Claude Code JSONL entries
- **THEN** the system SHALL correctly identify `user`, `assistant`, `summary`, `tool_use`, and `tool_result` entry types
- **AND** map them to the appropriate Session fields

### Requirement: OpenCode Session Extraction
The system SHALL extract session data using OpenCode's built-in export functionality.

#### Scenario: List OpenCode sessions
- **WHEN** `listSessions` is called with a project path
- **THEN** the system SHALL use `opencode session list` command
- **AND** parse the output to return Session objects

#### Scenario: Extract OpenCode session via export
- **WHEN** `extractSession` is called with a valid session ID
- **THEN** the system SHALL execute `opencode export <session-id>`
- **AND** parse the JSON output
- **AND** map OpenCode's format to the Session type

### Requirement: Cursor Session Extraction
The system SHALL extract session data from Cursor's agent transcript files.

#### Scenario: List Cursor sessions
- **WHEN** `listSessions` is called with a project path
- **THEN** the system SHALL scan `~/.cursor/projects/<encoded-path>/agent-transcripts/` for session directories
- **AND** return Session objects for each transcript found

#### Scenario: Extract Cursor session content
- **WHEN** `extractSession` is called with a valid session ID
- **THEN** the system SHALL parse the JSONL transcript file
- **AND** extract conversation messages with role and content
- **AND** handle Cursor's content format (array of text objects)

### Requirement: Encoded Path Handling
The system SHALL correctly encode and decode project paths for session storage locations.

#### Scenario: Encode project path for Claude Code
- **WHEN** a project path like `/home/user/project` needs to be encoded
- **THEN** the system SHALL convert it to `-home-user-project` format

#### Scenario: Decode encoded path
- **WHEN** an encoded path like `-home-user-project` is encountered
- **THEN** the system SHALL convert it back to `/home/user/project`

### Requirement: Summary Extraction
The system SHALL attempt to extract session summaries from all agent formats.

#### Scenario: Extract summary from Claude Code
- **WHEN** parsing a Claude Code session
- **THEN** the system SHALL look for entries with `type: "summary"`
- **AND** use the summary field if present

#### Scenario: Extract summary from Cursor
- **WHEN** parsing a Cursor transcript
- **THEN** the system SHALL extract the first user message
- **AND** use content within `<user_query>` tags if present
- **AND** truncate to first 200 characters otherwise