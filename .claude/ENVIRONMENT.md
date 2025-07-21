# Environment Variables Documentation

This document describes all environment variables used by the Claude PR Analysis Tool.

## Required Environment Variables

### `JIRA_TICKET_PREFIX`
- **Description**: The prefix for your Jira project tickets
- **Format**: String (usually uppercase)
- **Examples**: 
  - `RIZDEV` for tickets like `RIZDEV-1234`
  - `PROJECT` for tickets like `PROJECT-567`
  - `TEST` for test environment
- **Usage**: Used to extract Jira ticket IDs from PR titles
- **Pattern**: Creates regex pattern `${JIRA_TICKET_PREFIX}-\\d+`

```bash
export JIRA_TICKET_PREFIX=RIZDEV
```

### `GITHUB_REPOSITORY`
- **Description**: The GitHub repository in owner/repo format
- **Format**: `owner/repository-name`
- **Examples**:
  - `myorg/myproject`
  - `BostonImageReadingCenter/salesforce-new`
  - `test-org/test-repo` (for testing)
- **Usage**: Used by GitHub CLI commands to identify the target repository

```bash
export GITHUB_REPOSITORY=myorg/myproject
```

## Optional Environment Variables

### `JIRA_TICKET_PATTERN`
- **Description**: Custom regex pattern for Jira ticket extraction
- **Format**: Regular expression string
- **Default**: `${JIRA_TICKET_PREFIX}-\\d+`
- **Usage**: Override the default ticket pattern for custom formats
- **Example**: For tickets like `CUSTOM-ABC-123`:

```bash
export JIRA_TICKET_PATTERN="CUSTOM-[A-Z]+-\\d+"
```

## Testing Environment Variables

When running tests, use these specific values:

```bash
export JIRA_TICKET_PREFIX=TEST
export GITHUB_REPOSITORY=test-org/test-repo
```

## Environment Validation

The tool validates environment variables on startup:

### GitHub Repository Validation
- Checks format matches `owner/repo` pattern
- Validates repository exists and is accessible via GitHub CLI
- Reports specific errors for common issues

### Jira Configuration Validation  
- Validates `JIRA_TICKET_PREFIX` is set and non-empty
- Tests Jira CLI connectivity
- Validates pattern matching works correctly

### CLI Tools Validation
- Checks `gh` (GitHub CLI) is installed and authenticated
- Checks `jira` CLI is installed and authenticated
- Reports missing tools with installation instructions

## Configuration Examples

### Development Environment
```bash
# ~/.bashrc or ~/.zshrc
export JIRA_TICKET_PREFIX=MYPROJECT
export GITHUB_REPOSITORY=myorg/myrepo

# Optional: Custom ticket pattern
export JIRA_TICKET_PATTERN="MYPROJECT-\\d+"
```

### CI/CD Environment
```bash
# GitHub Actions
env:
  JIRA_TICKET_PREFIX: ${{ secrets.JIRA_TICKET_PREFIX }}
  GITHUB_REPOSITORY: ${{ github.repository }}
```

### Docker Environment
```dockerfile
ENV JIRA_TICKET_PREFIX=PROJECT
ENV GITHUB_REPOSITORY=owner/repo
```

## Troubleshooting Environment Issues

### Check Current Values
```bash
echo "JIRA_TICKET_PREFIX: $JIRA_TICKET_PREFIX"
echo "GITHUB_REPOSITORY: $GITHUB_REPOSITORY"
echo "JIRA_TICKET_PATTERN: $JIRA_TICKET_PATTERN"
```

### Test Environment Validation
```bash
# Run built-in validation
npm run build
node dist/core/environment.js
```

### Common Issues

#### Missing JIRA_TICKET_PREFIX
```
Error: JIRA_TICKET_PREFIX environment variable is required
```
**Solution**: Set the environment variable for your Jira project

#### Invalid GitHub Repository Format
```
Error: GITHUB_REPOSITORY must be in 'owner/repo' format
```
**Solution**: Use format like `myorg/myrepo`

#### GitHub CLI Not Authenticated
```
Error: GitHub CLI not authenticated
```
**Solution**: Run `gh auth login`

#### Jira CLI Not Authenticated
```
Error: Jira CLI not authenticated  
```
**Solution**: Run `jira auth login --server https://your-instance.atlassian.net`

## Environment Loading Order

1. **Process Environment**: Direct environment variables
2. **Shell Configuration**: Values from `.bashrc`, `.zshrc`, etc.
3. **CI/CD Variables**: GitHub Actions, Jenkins, etc.
4. **Default Values**: Test environment defaults for testing

## Security Considerations

### Sensitive Information
- Environment variables may contain organizational information
- Do not commit actual values to version control
- Use secrets management in CI/CD environments

### CLI Authentication
- GitHub and Jira CLI tools store authentication tokens
- Ensure tokens have appropriate permissions
- Regularly rotate authentication credentials

### Repository Access
- Ensure GitHub repository access is properly scoped
- Use read-only tokens when possible for analysis
- Validate write permissions only for comment posting

## Development vs Production

### Development
```bash
export JIRA_TICKET_PREFIX=DEVPROJECT  
export GITHUB_REPOSITORY=myorg/myrepo-dev
```

### Staging
```bash
export JIRA_TICKET_PREFIX=STAGINGPROJECT
export GITHUB_REPOSITORY=myorg/myrepo-staging
```

### Production
```bash
export JIRA_TICKET_PREFIX=PRODPROJECT
export GITHUB_REPOSITORY=myorg/myrepo
```

This separation allows testing different configurations without affecting production data.