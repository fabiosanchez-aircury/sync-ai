## ADDED Requirements

### Requirement: TypeScript Type Definitions
The system SHALL define TypeScript interfaces for all handoff data structures.

#### Scenario: Export core types
- **WHEN** importing from `src/types`
- **THEN** the system SHALL export `AgentType`, `SessionStatus`, `Session`, `Message`, `ToolCall`, `Decision`, `FileChange`, `PendingChange`, `SessionExtractor`, `SessionInjector`

#### Scenario: Export handoff types
- **WHEN** importing from `src/types`
- **THEN** the system SHALL export `HandoffFormat`, `HandoffMetadata`, `HandoffSummary`, `HandoffContext`, `HandoffFiles`, `HandoffConversation`, `HandoffContinuation`

### Requirement: HandoffFormat Version
The system SHALL use semantic versioning for the handoff format.

#### Scenario: Version field
- **WHEN** creating a handoff
- **THEN** the `version` field SHALL be set to `"1.0.0"`

#### Scenario: Version validation
- **WHEN** reading a handoff
- **THEN** the system SHALL check the version is supported
- **AND** reject unsupported versions with clear error message

### Requirement: Agent Type Safety
The system SHALL enforce type safety for agent identifiers.

#### Scenario: Agent type constraint
- **WHEN** specifying an agent
- **THEN** the type SHALL be limited to `'claude-code' | 'opencode' | 'cursor'`

#### Scenario: Agent config lookup
- **WHEN** getting agent configuration
- **THEN** `getAgentConfig(agent)` SHALL return display name, session location, and capabilities
- **AND** throw Type error for unknown agents

### Requirement: Session Structure
The system SHALL define a consistent Session interface across all agents.

#### Scenario: Session required fields
- **WHEN** creating a Session object
- **THEN** it MUST include `id`, `agent`, `project_path`, `messages`, `created_at`, `updated_at`

#### Scenario: Session optional fields
- **WHEN** extracting a session
- **THEN** it MAY include `git_branch`, `tool_calls`, `files_read`, `files_modified`, `files_created`, `summary`

### Requirement: Message Structure
The system SHALL define a common Message interface.

#### Scenario: Message fields
- **WHEN** creating a Message object
- **THEN** it MUST include `role` ('user' or 'assistant') and `content` (string)
- **AND** MAY include `timestamp` and `important` flag

### Requirement: FileChange Structure
The system SHALL track file modifications with required metadata.

#### Scenario: FileChange fields
- **WHEN** recording a file change
- **THEN** it MUST include `path` and `change_type` ('created' | 'modified' | 'deleted')
- **AND** MAY include `diff` and `summary`

### Requirement: Decision Structure
The system SHALL record decisions with optional rationale.

#### Scenario: Decision fields
- **WHEN** extracting a decision
- **THEN** it MUST include `decision` (string) and `timestamp` (string)
- **AND** MAY include `rationale` and `alternatives_considered` arrays

### Requirement: Empty Handoff Factory
The system SHALL provide a function to create empty handoff objects.

#### Scenario: Create empty handoff
- **WHEN** calling `createEmptyHandoff(sourceAgent, targetAgent, projectPath)`
- **THEN** the system SHALL return a valid HandoffFormat with empty arrays
- **AND** set current timestamp in metadata
- **AND** initialize all required fields with appropriate defaults

### Requirement: Type Re-exports
The system SHALL re-export all types from a single entry point.

#### Scenario: Import all types from index
- **WHEN** importing from `src/types/index`
- **THEN** all public types SHALL be available
- **AND** internal implementation types SHALL NOT be exported