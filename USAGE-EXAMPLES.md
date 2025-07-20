# Usage Examples and Troubleshooting Guide

This document provides detailed usage examples and comprehensive troubleshooting information for the Claude PR Analysis Tool.

## 📋 Complete Workflow Examples

### Example 1: Basic PR Analysis

```bash
# 1. Set up environment
export JIRA_TICKET_PREFIX=RIZDEV
export GITHUB_REPOSITORY=myorg/salesforce-app

# 2. Analyze PR #393 (with Jira ticket RIZDEV-2055)
analyze-pr 393

# Output: Creates temp/claude-prompt-2025-01-20-19-30-45.txt
# Contains comprehensive prompt for Claude AI analysis
```

### Example 2: Complete Analysis + Comment Workflow

```bash
# 1. Generate analysis prompt
analyze-pr 123
# Creates: temp/claude-prompt-2025-01-20-19-30-45.txt

# 2. Run Claude AI analysis (external step)
# Copy the prompt to Claude AI interface
# Save Claude's response to: temp/claude-analysis-123.txt

# 3. Post analysis as PR comment
comment-pr 123 temp/claude-analysis-123.txt
# Prompts: "Post comment to PR #123? (y/N)"
# Posts formatted comment to GitHub PR
```

### Example 3: Multiple PRs Analysis

```bash
#!/bin/bash
# Batch analyze multiple PRs

JIRA_PREFIX=PROJECT
GITHUB_REPO=myorg/myapp

export JIRA_TICKET_PREFIX=$JIRA_PREFIX
export GITHUB_REPOSITORY=$GITHUB_REPO

# Analyze PRs 100, 101, 102
for pr in 100 101 102; do
  echo "Analyzing PR #$pr..."
  analyze-pr $pr
  
  # Optional: List generated files
  ls -la temp/claude-prompt-*$pr* 2>/dev/null || echo "No prompt generated for PR #$pr"
done
```

## 🔧 Development Environment Setup

### Setup Script Example

```bash
#!/bin/bash
# setup-claude-pr-tool.sh

# Install required CLI tools
echo "Installing GitHub CLI..."
brew install gh  # macOS
# sudo apt install gh  # Ubuntu
# winget install GitHub.cli  # Windows

echo "Installing Jira CLI..."
brew install jira-cli  # macOS
# Or download from: https://github.com/ankitpokhrel/jira-cli

# Authenticate GitHub CLI
echo "Authenticating GitHub CLI..."
gh auth login

# Authenticate Jira CLI
echo "Authenticating Jira CLI..."
read -p "Enter your Jira server URL: " JIRA_SERVER
jira auth login --server $JIRA_SERVER

# Set up environment variables
echo "Setting up environment variables..."
read -p "Enter your Jira ticket prefix (e.g., PROJECT): " JIRA_PREFIX
read -p "Enter your GitHub repository (owner/repo): " GITHUB_REPO

echo "export JIRA_TICKET_PREFIX=$JIRA_PREFIX" >> ~/.bashrc
echo "export GITHUB_REPOSITORY=$GITHUB_REPO" >> ~/.bashrc

echo "Setup complete! Please restart your terminal or run: source ~/.bashrc"
```

### Verification Script

```bash
#!/bin/bash
# verify-setup.sh

echo "=== Claude PR Analysis Tool Setup Verification ==="

# Check Node.js
echo "Node.js version:"
node --version || echo "❌ Node.js not found"

# Check GitHub CLI
echo "GitHub CLI version:"
gh --version || echo "❌ GitHub CLI not found"

# Check Jira CLI
echo "Jira CLI version:"
jira version || echo "❌ Jira CLI not found"

# Check environment variables
echo "Environment variables:"
echo "JIRA_TICKET_PREFIX: ${JIRA_TICKET_PREFIX:-❌ Not set}"
echo "GITHUB_REPOSITORY: ${GITHUB_REPOSITORY:-❌ Not set}"

# Check authentication
echo "GitHub authentication:"
gh auth status || echo "❌ GitHub CLI not authenticated"

echo "Jira authentication:"
jira auth status || echo "❌ Jira CLI not authenticated"

echo "=== Verification complete ==="
```

## 📊 Real-World Usage Examples

### Example: Bug Fix PR Analysis

```bash
# PR Title: "RIZDEV-1234: Fix validation error on form submission"
analyze-pr 567

# Generated prompt includes:
# - PR diff showing validation logic changes
# - Jira ticket describing the validation bug
# - Instructions for Claude to verify the fix addresses the root cause
```

### Example: Feature Implementation PR

```bash
# PR Title: "PROJECT-456: Add user role management interface"
analyze-pr 789

# Generated prompt includes:
# - Comprehensive diff of new UI components
# - Jira epic/story describing user role requirements
# - Analysis instructions for feature completeness
```

### Example: Refactoring PR

```bash
# PR Title: "TECH-123: Refactor authentication service"
analyze-pr 321

# Generated prompt includes:
# - Large diff showing code restructuring
# - Technical task description from Jira
# - Focus on maintainability and backward compatibility
```

## 🚨 Comprehensive Troubleshooting

### Issue: PR Number Not Found

```bash
# Error:
analyze-pr 999
# Error: Pull request #999 not found

# Solution 1: Verify PR exists
gh pr view 999

# Solution 2: Check repository context
echo $GITHUB_REPOSITORY
gh repo view

# Solution 3: List available PRs
gh pr list --limit 20
```

### Issue: Jira Ticket Not Found in PR Title

```bash
# Error:
analyze-pr 123
# Warning: No Jira ticket found in PR title

# Solution 1: Check PR title format
gh pr view 123 --json title

# Solution 2: Verify ticket prefix
echo $JIRA_TICKET_PREFIX

# Solution 3: Check actual PR title
# Should be: "RIZDEV-1234: Description"
# Not: "Fix bug in form validation"
```

### Issue: GitHub CLI Authentication

```bash
# Error:
analyze-pr 123
# Error: GitHub CLI not authenticated

# Solution:
gh auth login
# Choose: GitHub.com
# Choose: HTTPS or SSH
# Follow authentication flow

# Verify:
gh auth status
```

### Issue: Jira CLI Authentication

```bash
# Error:
analyze-pr 123
# Error: Jira CLI authentication failed

# Solution:
jira auth login --server https://yourcompany.atlassian.net
# Enter email and API token

# Verify:
jira auth status

# Test access:
jira issue list --limit 5
```

### Issue: Missing Environment Variables

```bash
# Error:
analyze-pr 123
# Error: JIRA_TICKET_PREFIX environment variable is required

# Solution:
export JIRA_TICKET_PREFIX=YOURPROJECT
export GITHUB_REPOSITORY=yourorg/yourrepo

# Persist in shell config:
echo 'export JIRA_TICKET_PREFIX=YOURPROJECT' >> ~/.bashrc
echo 'export GITHUB_REPOSITORY=yourorg/yourrepo' >> ~/.bashrc
source ~/.bashrc
```

### Issue: Permission Denied for PR Comments

```bash
# Error:
comment-pr 123 analysis.txt
# Error: Permission denied when posting comment

# Solution 1: Check GitHub permissions
gh api repos/yourorg/yourrepo --jq .permissions

# Solution 2: Re-authenticate with broader scope
gh auth refresh --scopes repo

# Solution 3: Verify repository access
gh repo view yourorg/yourrepo
```

### Issue: Build or Runtime Errors

```bash
# Error:
npm run build
# Error: TypeScript compilation failed

# Solution 1: Clean and rebuild
npm run clean
npm install
npm run build

# Solution 2: Check Node.js version
node --version  # Should be >=16.0.0

# Solution 3: Reset to known good state
git status
git stash  # if you have local changes
npm ci     # clean install
npm run build
```

## 📈 Performance Optimization

### Large Repository Optimization

```bash
# For repos with large diffs, optimize analysis:

# 1. Analyze specific files only
analyze-pr 123
# Edit generated prompt to focus on key files

# 2. Use shallow PR analysis
# Modify generated prompt to exclude large dependency changes

# 3. Split large PRs
# Encourage smaller, focused PRs for better analysis
```

### CI/CD Integration Example

```yaml
# .github/workflows/pr-analysis.yml
name: PR Analysis
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Claude PR Tool
        run: npm install -g claude-pr-analisys
        
      - name: Setup GitHub CLI
        run: |
          gh auth login --with-token <<< "${{ secrets.GITHUB_TOKEN }}"
          
      - name: Setup Jira CLI
        env:
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
        run: |
          jira auth login --server ${{ secrets.JIRA_SERVER }} --user ${{ secrets.JIRA_EMAIL }} --token $JIRA_API_TOKEN
          
      - name: Generate Analysis Prompt
        env:
          JIRA_TICKET_PREFIX: ${{ secrets.JIRA_TICKET_PREFIX }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: |
          analyze-pr ${{ github.event.pull_request.number }}
          
      - name: Upload Analysis Prompt
        uses: actions/upload-artifact@v3
        with:
          name: claude-prompt
          path: temp/claude-prompt-*.txt
```

## 🧪 Testing Examples

### Unit Testing
```bash
# Set test environment
export JIRA_TICKET_PREFIX=TEST
export GITHUB_REPOSITORY=test-org/test-repo

# Run specific test suites
npm run test:analyze   # Test analyze-pr functionality
npm run test:comment   # Test comment-pr functionality
npm run test:utils     # Test shared utilities

# Run with debugging
DEBUG=true npm test
```

### Integration Testing
```bash
# Test against real (development) repository
export JIRA_TICKET_PREFIX=DEVPROJECT
export GITHUB_REPOSITORY=myorg/myrepo-dev

# Test with existing PR
analyze-pr 1

# Verify output
ls -la temp/
cat temp/claude-prompt-*.txt
```

### Performance Testing
```bash
# Time analysis of large PR
time analyze-pr 123

# Profile memory usage
node --inspect dist/analyze-pr.js 123

# Test with various PR sizes
for size in small medium large; do
  echo "Testing $size PR..."
  analyze-pr $(get_pr_by_size $size)
done
```

## 💡 Advanced Tips

### Custom Jira Patterns
```bash
# For non-standard ticket formats
export JIRA_TICKET_PATTERN="CUSTOM-[A-Z]+-\\d+"

# Test pattern matching
node -e "
const pattern = new RegExp(process.env.JIRA_TICKET_PATTERN);
console.log(pattern.test('CUSTOM-ABC-123'));
"
```

### Prompt Customization
```bash
# After generating prompt, customize before using with Claude
analyze-pr 123
# Edit temp/claude-prompt-*.txt to:
# - Add specific focus areas
# - Include additional context
# - Modify analysis instructions
```

### Automation Scripts
```bash
#!/bin/bash
# analyze-and-comment.sh - Full automation

PR_NUMBER=$1
ANALYSIS_FILE="temp/claude-analysis-$PR_NUMBER.txt"

echo "Analyzing PR #$PR_NUMBER..."
analyze-pr $PR_NUMBER

echo "Prompt generated. Please:"
echo "1. Copy temp/claude-prompt-*.txt to Claude AI"
echo "2. Save Claude's response as $ANALYSIS_FILE"
echo "3. Press Enter to continue..."
read

if [ -f "$ANALYSIS_FILE" ]; then
  comment-pr $PR_NUMBER $ANALYSIS_FILE
else
  echo "Analysis file not found: $ANALYSIS_FILE"
fi
```

This comprehensive guide should help users successfully implement and troubleshoot the Claude PR Analysis Tool in various environments and scenarios.