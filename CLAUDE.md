# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a PR analysis automation tool that integrates GitHub pull requests with Jira tickets using Claude AI for intelligent analysis. The tool helps automate the review process by analyzing PR changes against their corresponding Jira requirements.

## Commands

**Running Tests:**
```bash
# Set up test environment first
export JIRA_TICKET_PREFIX=TEST
export GITHUB_REPOSITORY=test-org/test-repo

# Run all tests (recommended)
npm test

# Run individual test suites (requires build first)
npm run build
node dist/analyze-pr.test.js            # Main analyze-pr tests (13 tests)
node dist/tests/analyze-pr.test.js      # Refactored analyze-pr tests (8 tests)
node dist/tests/comment-pr.test.js      # Comment-pr script tests (15 tests)
node dist/tests/pr-utils.test.js        # Shared utilities tests (20 tests)

# All tests use shared mock system and environment-aware data
```

**Main Scripts:**
```bash
# Production usage (using built JavaScript)
npm run build
node dist/analyze-pr.js <pr_number>                    # Generate Claude analysis prompt for PR
node dist/comment-pr.js <pr_number> <output_file>      # Post analysis as PR comment

# Development usage
npm run start <pr_number>                              # Build and run analyze-pr
npm run start:comment <pr_number> <output_file>        # Build and run comment-pr
```

**Development & Quality Scripts:**
```bash
npm run build          # Build TypeScript to JavaScript
npm run build:watch    # Build in watch mode for development
npm run clean          # Clean dist and temp directories
npm run lint           # Run ESLint (must have 0 errors, 0 warnings)
npm run lint:fix       # Fix auto-fixable ESLint issues
npm run format         # Format code with Prettier
npm run format:check   # Check Prettier formatting
npm run typecheck      # Run TypeScript type checking
npm run quality        # Run all quality checks (lint + format + typecheck)
```

**Required CLI Tools:**
- `gh` (GitHub CLI) - must be authenticated
- `jira` (Jira CLI) - must be authenticated
- `node` (Node.js runtime)

**Required Environment Variables:**
```bash
export JIRA_TICKET_PREFIX=RIZDEV              # Your Jira project prefix
export GITHUB_REPOSITORY=owner/repository     # GitHub repository format
```

**Optional Environment Variables:**
```bash
export JIRA_TICKET_PATTERN="CUSTOM-\d+"       # Override default ticket pattern
```

## Architecture

### Core Scripts
- **`src/analyze-pr.ts`** - Main analysis script that gathers PR and Jira data, creates comprehensive Claude prompts
- **`src/comment-pr.ts`** - Comment posting script that takes analysis results and posts them to GitHub PRs

### Shared Utilities
- **`src/utils/pr-utils.ts`** - Centralized utilities for GitHub/Jira integration with dependency injection support
- **`src/utils/test-utils.ts`** - Testing framework with mocking capabilities

### Service Architecture
- **`src/services/claude/`** - Claude AI integration (operations, types, config, mock responses)
- **`src/services/github/`** - GitHub API/CLI integration (operations, types, config, mock responses)
- **`src/services/jira/`** - Jira API/CLI integration (operations, types, config, mock responses)
- **`src/core/`** - Core infrastructure (config, environment, errors, types)
- **`src/testing/`** - Test infrastructure, mocks, and utilities

### Key Design Patterns

**Dependency Injection**: The codebase uses dependency injection in `pr-utils.ts` to enable comprehensive testing:
```typescript
// Production usage
import * as prUtils from './utils/pr-utils';

// Testing usage  
prUtils.setDependencies({ execAsync: mockExec, readline: mockReadline });
```

**CLI Integration**: Heavy reliance on external CLI tools (`gh`, `jira`) with proper error handling and validation.

**File-based Workflow**: Analysis prompts are saved to timestamped files in `temp/` directory, enabling manual review before posting.

### Data Flow
1. **analyze-pr.ts** extracts Jira ticket from PR title (using JIRA_TICKET_PREFIX environment variable pattern)
2. Gathers PR metadata, diff, and Jira ticket details via CLI tools
3. Creates comprehensive Claude prompt with context gathering instructions
4. Saves prompt to `temp/claude-prompt-[timestamp].txt`
5. **comment-pr.ts** posts Claude's analysis response as PR comment

### Testing Architecture
- Custom testing framework in `test-utils.ts` with `TestRunner`, `MockExecutor`, `MockReadline`
- Comprehensive mocking of CLI commands and user interactions
- Isolated test execution with proper cleanup
- Pattern-based command matching for flexible test scenarios
- Full TypeScript typing for test infrastructure and mock data

## Project-Specific Patterns

**Jira Integration**: Expects Jira tickets in format defined by JIRA_TICKET_PREFIX environment variable (e.g., RIZDEV-XXXX).

**Claude Prompt Structure**: Generated prompts include specific instructions for context gathering and analysis format.

**Error Handling**: Extensive validation of PR numbers, file existence, CLI tool availability, and API responses.

**User Interaction**: Interactive confirmations for destructive operations (posting comments).

**File Management**: Automatic temp directory creation and timestamped file generation for workflow artifacts.

## Code Organization & Architecture Principles

### Boundary Separation
Maintain strict separation of concerns by organizing code into service-specific directories:
- **`src/services/claude/`** - All Claude AI integration logic
- **`src/services/github/`** - All GitHub API/CLI integration
- **`src/services/jira/`** - All Jira API/CLI integration
- **`src/core/`** - Shared infrastructure (config, errors, types)
- **`src/utils/`** - Shared utility functions
- **`src/testing/`** - Test infrastructure and mocks

**Never mix service boundaries** - GitHub logic should not appear in claude/ directory, etc.

### Shared Functions & DRY Principle
- **Prefer shared utilities** - Move common functionality to `src/utils/`
- **Extract reusable patterns** - If code appears in multiple services, extract to shared location
- **Common interfaces** - Use consistent interfaces across service boundaries
- **Shared types** - Define common types in `src/types/` or `src/core/types.ts`

### File Size & Organization
- **Prefer short files** - Target 100-200 lines per file maximum
- **Single responsibility** - Each file should have one clear purpose
- **Split large files** - Break down complex files into smaller, focused modules
- **Clear naming** - File names should clearly indicate their purpose

### Static Data Management
- **Separate data from logic** - All static data should be in dedicated files
- **Consistent data location** - Use `data.ts`, `constants.ts`, or `config.ts` files
- **Import, don't embed** - Reference static data via imports, never inline
- **Typed constants** - Use TypeScript const assertions for static data

**Examples:**
```typescript
// ✅ Good: Static data in separate file
// src/services/github/constants.ts
export const GITHUB_API_ENDPOINTS = {
  pulls: '/repos/{owner}/{repo}/pulls',
  comments: '/repos/{owner}/{repo}/issues/{number}/comments'
} as const;

// src/services/github/operations.ts
import { GITHUB_API_ENDPOINTS } from './constants';

// ❌ Bad: Static data embedded in logic
const endpoint = '/repos/owner/repo/pulls'; // Embedded in function
```

### Service Directory Structure
Each service directory should follow this pattern:
```
src/services/[service]/
├── index.ts          # Main service interface
├── operations.ts     # Core service operations
├── types.ts          # Service-specific types
├── config.ts         # Service configuration
├── constants.ts      # Static data and constants
├── mock-responses.ts # Test mocking data
└── utils.ts          # Service-specific utilities
```

## Quality Gates and Testing Requirements

### **CRITICAL RULE: Tests Must Pass Before New Tasks**
- **NEVER start a new task** if tests are failing
- **ALWAYS verify tests pass** before marking any todo as completed
- **Exception**: Only when the task itself is specifically to fix failing tests
- **Validation**: Run `npm test` to confirm all tests pass

### Standard Validation Workflow
**Required before any new task or todo completion:**
1. **Test**: `npm test` - **MUST PASS** (all tests)
2. **Build**: `npm run build` - TypeScript compilation
3. **Lint**: `npm run lint` - ESLint validation (0 errors, 0 warnings)
4. **Format**: `npm run format:check` - Prettier validation
5. **Type Check**: `npm run typecheck` - TypeScript strict validation

### Quality Criteria (All Required)
- **Tests**: ALL tests must pass (non-negotiable)
- **TypeScript compilation**: 0 errors required
- **ESLint**: 0 errors AND 0 warnings required
- **Prettier**: 100% compliant formatting required
- **Build**: Clean dist/ output generation required

## Project Management & Progress Tracking

### Context Files and Session Management

When working on complex multi-step tasks in this project, Claude should create and maintain context files to track progress and ensure continuity between sessions.

**Progress Tracking Pattern:**
- Create a session-specific tracking file (e.g., `WORK-SESSION-[topic]-[date].md`)
- Use the TodoWrite tool for complex tasks with 3+ steps
- Update progress after each completed todo with granular detail
- Include timestamps, changes made, files modified, and context for next steps

### Todo Management Best Practices

**When to Use TodoWrite Tool:**
- Complex multi-step tasks requiring 3+ actions
- Non-trivial tasks requiring careful planning  
- User provides multiple tasks (numbered or comma-separated)
- After receiving new complex instructions
- When starting work on a task (mark as in_progress)
- After completing tasks (mark as completed immediately)

**Progress Checkpoint Requirements:**
- **VERIFY TESTS PASS** before marking any todo as completed
- Mark todos as completed IMMEDIATELY after finishing AND tests pass
- Only have ONE todo in_progress at any time
- Include specific file changes and context in each update
- NEVER mark as completed if tests fail, build fails, or lint errors exist

### Session Template for Complex Tasks

For multi-step tasks, create a session tracking file using this template:

```markdown
# Work Session Progress Tracker

**Project**: claude-pr-analisys [Brief task description]
**Session Start**: [Date]
**Objective**: [Main goal and scope]

## Progress Log

### ✅ Todo 1: [Task name]
- **Status**: COMPLETED
- **Timestamp**: [Date/time completed]
- **Changes Made**: 
  - [Detailed list of specific changes]
  - [Files created, modified, or removed]
- **Files Modified**: [Specific file paths]
- **Context for Next**: [What the next developer should know]
- **Issues**: [Any problems encountered and how resolved]

### 🔄 Todo 2: [Current task]
- **Status**: IN PROGRESS
- **Timestamp**: [Date/time started]
- **Changes Made**: [Work completed so far]
- **Files Modified**: [Files being worked on]
- **Context for Next**: [Current state and next steps]
- **Issues**: [Current blockers or challenges]

### ⏳ Todo 3: [Pending task]
- **Status**: PENDING
- **Priority**: [high/medium/low]
- **Dependencies**: [What must be completed first]
- **Estimated Scope**: [Brief description of work involved]

---

## Session Summary
- **Total Todos**: [X completed / Y total]
- **Key Achievements**: [Major accomplishments]
- **Architecture Changes**: [Significant structural changes]
- **Quality Status**: [Test/lint/build status]
- **Next Session Focus**: [What to tackle next]
```

### Claude-Specific Tool Usage

**TodoWrite Tool Usage:**
- Use for ANY task with 3+ steps or significant complexity
- Create todos BEFORE starting work (planning phase)
- Update TodoWrite immediately after completing each task
- Include specific, actionable todo descriptions
- Organize todos into logical phases (Setup, Implementation, Validation, Documentation)

**Best Practices:**
- Break large tasks into smaller, measurable units
- Each todo should be completable in one focused work session
- Include acceptance criteria in todo descriptions
- Reference specific files and functions when relevant
- Always validate quality gates before marking complete