## ADDED Requirements

### Requirement: Handoff Format Definition
The system SHALL define a standardized `HandoffFormat` interface version 1.0.0 for session data interchange.

#### Scenario: Handoff format structure
- **WHEN** a handoff is created
- **THEN** it MUST include `metadata`, `summary`, `context`, `files`, `conversation`, and `continuation` sections
- **AND** have a `version` field set to `"1.0.0"`

### Requirement: Metadata Section
The system SHALL include metadata identifying source and target agents.

#### Scenario: Metadata includes source information
- **WHEN** creating a handoff
- **THEN** the metadata section SHALL include source agent, version, session ID, and timestamp
- **AND** include target agent
- **AND** include project path and git branch

### Requirement: Summary Generation
The system SHALL generate an executive summary of the session.

#### Scenario: Goal extraction from first message
- **WHEN** generating a session summary
- **THEN** the system SHALL extract the first user message as the goal
- **AND** use content within `<user_query>` tags if present
- **AND** truncate to 500 characters maximum

#### Scenario: Progress estimation
- **WHEN** generating a session summary
- **THEN** the system SHALL estimate progress percentage based on conversation length
- **AND** mark as 90% complete if completion indicators are found
- **AND** otherwise estimate based on message count

#### Scenario: Current task extraction
- **WHEN** generating a session summary
- **THEN** the system SHALL scan recent assistant messages for task indicators
- **AND** extract text following "working on:", "implementing:", "fixing:", "adding:" patterns

### Requirement: Decision Extraction
The system SHALL extract decisions made during the session.

#### Scenario: Identify decision patterns
- **WHEN** processing conversation messages
- **THEN** the system SHALL look for decision patterns: "decision:", "decided to:", "using X instead of", "going with"
- **AND** extract nearby rationale if present

#### Scenario: Decision structure
- **WHEN** a decision is extracted
- **THEN** it SHALL include the decision text, rationale (if found), alternatives considered, and timestamp

### Requirement: Learning Extraction
The system SHALL extract learnings discovered during the session.

#### Scenario: Identify learning patterns
- **WHEN** processing conversation messages
- **THEN** the system SHALL look for learning patterns: "learned that", "discovered", "noted that", "found that"
- **AND** filter out duplicates and entries shorter than 10 characters

### Requirement: Assumption Extraction
The system SHALL identify assumptions made during the session.

#### Scenario: Identify assumption patterns
- **WHEN** processing conversation messages
- **THEN** the system SHALL look for assumption patterns: "assuming", "presuming", "expecting that"

### Requirement: File Change Tracking
The system SHALL track all file operations from the session.

#### Scenario: Track modified files
- **WHEN** processing tool calls
- **THEN** the system SHALL identify file write operations
- **AND** record path, change type, and summary

#### Scenario: Track read files
- **WHEN** processing tool calls
- **THEN** the system SHALL identify file read operations
- **AND** maintain a unique set of file paths

#### Scenario: Track created files
- **WHEN** processing tool calls
- **THEN** the system SHALL identify file creation operations
- **AND** record file paths

### Requirement: Key Message Selection
The system SHALL identify the most important messages from the conversation.

#### Scenario: Include first user message
- **WHEN** selecting key messages
- **THEN** the system SHALL always include the first user message
- **AND** mark it as important

#### Scenario: Include recent messages
- **WHEN** selecting key messages
- **THEN** the system SHALL include the last 4 messages for context

### Requirement: Continuation Prompt Generation
The system SHALL generate a ready-to-use prompt for the target agent.

#### Scenario: Format continuation prompt
- **WHEN** building the continuation
- **THEN** the system SHALL include a context header
- **AND** include the goal
- **AND** include progress and current task
- **AND** include key decisions with rationale
- **AND** include learnings
- **AND** include blockers if present
- **AND** suggest next action

#### Scenario: Files to focus
- **WHEN** building the continuation
- **THEN** the system SHALL list recently read files (up to 5)
- **AND** list modified files
- **AND** limit total to 10 files