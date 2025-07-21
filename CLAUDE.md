# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

PR analysis automation tool that integrates GitHub pull requests with Jira tickets using Claude AI for intelligent analysis. Automates the review process by analyzing PR changes against their corresponding Jira requirements.

## Essential Commands

**Testing:**
```bash
# Environment automatically loaded from .env file

# Run all tests
npm test
```

**Main Scripts:**
```bash
# Production usage
npm run build
node dist/analyze-pr.js <pr_number>                    # Generate Claude analysis prompt
node dist/comment-pr.js <pr_number> <output_file>      # Post analysis as PR comment

# Development usage  
npm run start <pr_number>                              # Build and run analyze-pr
npm run start:comment <pr_number> <output_file>        # Build and run comment-pr
```

**Quality Checks:**
```bash
npm run build          # Build TypeScript to JavaScript
npm run lint           # Run ESLint (must have 0 errors, 0 warnings)
npm run format         # Format code with Prettier
npm run typecheck      # Run TypeScript type checking
```

## Architecture

**Core Scripts:**
- `src/analyze-pr.ts` - Gathers PR and Jira data, creates Claude prompts
- `src/comment-pr.ts` - Posts analysis results to GitHub PRs

**Service Architecture:**
- `src/services/claude/` - Claude AI integration
- `src/services/github/` - GitHub API/CLI integration  
- `src/services/jira/` - Jira API/CLI integration
- `src/core/` - Configuration, environment, errors
- `src/testing/` - Test infrastructure and mocks

## Environment Variables

**Quick Start:**
```bash
# Copy the example file and edit with your values
cp .env.example .env
```

**Required (via .env file or export):**
```bash
GITHUB_REPOSITORY=owner/repository            # GitHub repository format
JIRA_TICKET_PREFIX=PROJ                       # Your Jira project prefix
```

**Optional (via .env file or export):**
```bash
NODE_ENV=development                          # development|testing|production  
DEBUG=true                                    # Enable debug logging
JIRA_USER_EMAIL=user@company.com              # Jira user email
JIRA_SERVER_URL=https://company.atlassian.net/ # Jira server URL
JIRA_TICKET_PATTERN="CUSTOM-\d+"              # Override default ticket pattern
CLAUDE_MODEL=claude-3-sonnet-20240229         # Claude model
TEMP_DIR=./temp                               # Temporary file directory
MAX_RETRIES=3                                 # Maximum retry attempts
TIMEOUT=30000                                 # Timeout in milliseconds
```

## Quality Gates

**CRITICAL: Tests Must Pass Before New Tasks**
- Run `npm test` to verify all tests pass
- Required validation before any todo completion:
  1. `npm test` - ALL tests must pass
  2. `npm run build` - TypeScript compilation  
  3. `npm run lint` - ESLint (0 errors, 0 warnings)
  4. `npm run typecheck` - TypeScript strict validation

## Code Organization

**Service Boundaries:**
- Never mix service boundaries (GitHub logic stays in `src/services/github/`)
- Prefer shared utilities in `src/utils/`
- Keep files under 200 lines maximum
- Static data in separate `constants.ts` files

**Testing:**
- Use Vitest framework with `describe/test` structure
- Mock CLI commands via dependency injection
- All new features require tests