# PR Analysis Script

**Author**: Anthony Rizzo, Co-pilot: Claude

## Overview

Smart PR analysis tool that gathers GitHub PR and Jira ticket data, sends it to Claude AI for intelligent analysis, and posts comprehensive analysis as a PR comment.

## Quick Example

```bash
node scripts/analyze-pr.js 392
```

## What It Does

1. **Validates PR**: Checks if PR exists and is accessible
2. **Gathers PR Data**: Fetches PR details, diff, and metadata  
3. **Extracts Jira Ticket**: Finds ticket pattern (e.g., `RIZDEV-XXXX`) in PR title using JIRA_TICKET_PREFIX environment variable
4. **Validates Jira Ticket**: Checks if ticket exists and is accessible
5. **Gathers Jira Data**: Fetches complete ticket details
6. **Calls Claude AI**: Sends structured prompt with all data for analysis
7. **Shows Preview**: Displays generated analysis
8. **Posts Comment**: Posts analysis to PR (with confirmation unless auto-approved)

## Usage

```bash
# Interactive mode (asks for confirmation)  
node scripts/analyze-pr.js 391

# Automated mode (no confirmation - perfect for CI/CD)
node scripts/analyze-pr.js 392 --auto-approve
node scripts/analyze-pr.js 392 -y
```

## Requirements

- Node.js
- GitHub CLI (`gh`) - authenticated
- Jira CLI (`jira`) - authenticated  
- Claude CLI (`claude`) - authenticated

## Analysis Output

Claude generates a comprehensive analysis including:

- **Ticket Summary**: Brief description of the Jira issue
- **PR Solution Analysis**: How the PR addresses the issue  
- **Confidence Level**: Percentage-based assessment with reasoning
- **Recommendations**: Testing steps and follow-up tasks

## Features

- **Smart Validation**: Validates PR and Jira ticket accessibility
- **Jira Integration**: Automatically extracts ticket ID from PR title using configurable JIRA_TICKET_PREFIX
- **AI Analysis**: Uses Claude to intelligently compare PR vs ticket requirements
- **Interactive/Automated Modes**: Confirmation prompt or auto-post for CI/CD
- **Error Handling**: Clear error messages with solutions

---
*Created by Anthony Rizzo with Claude as co-pilot*