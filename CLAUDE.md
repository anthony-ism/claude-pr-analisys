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

# Run individual test files
node src/analyze-pr.test.js            # Main analyze-pr tests (13 tests)
node src/tests/analyze-pr.test.js      # Refactored analyze-pr tests (8 tests)
node src/tests/comment-pr.test.js      # Comment-pr script tests (15 tests)
node src/tests/pr-utils.test.js        # Shared utilities tests (20 tests)

# All tests use shared mock system and environment-aware data
```

**Main Scripts:**
```bash
node src/analyze-pr.js <pr_number>                    # Generate Claude analysis prompt for PR
node src/comment-pr.js <pr_number> <output_file>      # Post analysis as PR comment
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
- **`src/analyze-pr.js`** - Main analysis script that gathers PR and Jira data, creates comprehensive Claude prompts
- **`src/comment-pr.js`** - Comment posting script that takes analysis results and posts them to GitHub PRs

### Shared Utilities
- **`src/utils/pr-utils.js`** - Centralized utilities for GitHub/Jira integration with dependency injection support
- **`src/utils/test-utils.js`** - Testing framework with mocking capabilities

### Key Design Patterns

**Dependency Injection**: The codebase uses dependency injection in `pr-utils.js` to enable comprehensive testing:
```javascript
// Production usage
const prUtils = require('./utils/pr-utils');

// Testing usage  
prUtils.setDependencies({ execAsync: mockExec, readline: mockReadline });
```

**CLI Integration**: Heavy reliance on external CLI tools (`gh`, `jira`) with proper error handling and validation.

**File-based Workflow**: Analysis prompts are saved to timestamped files in `temp/` directory, enabling manual review before posting.

### Data Flow
1. **analyze-pr.js** extracts Jira ticket from PR title (using JIRA_TICKET_PREFIX environment variable pattern)
2. Gathers PR metadata, diff, and Jira ticket details via CLI tools
3. Creates comprehensive Claude prompt with context gathering instructions
4. Saves prompt to `temp/claude-prompt-[timestamp].txt`
5. **comment-pr.js** posts Claude's analysis response as PR comment

### Testing Architecture
- Custom testing framework in `test-utils.js` with `TestRunner`, `MockExecutor`, `MockReadline`
- Comprehensive mocking of CLI commands and user interactions
- Isolated test execution with proper cleanup
- Pattern-based command matching for flexible test scenarios

## Project-Specific Patterns

**Jira Integration**: Expects Jira tickets in format defined by JIRA_TICKET_PREFIX environment variable (e.g., RIZDEV-XXXX).

**Claude Prompt Structure**: Generated prompts include specific instructions for context gathering and analysis format.

**Error Handling**: Extensive validation of PR numbers, file existence, CLI tool availability, and API responses.

**User Interaction**: Interactive confirmations for destructive operations (posting comments).

**File Management**: Automatic temp directory creation and timestamped file generation for workflow artifacts.