/**
 * Claude CLI mock responses for testing
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

import { getTestTicketId } from '../../testing/utils/test-helpers';

/**
 * Generate mock Claude analysis response
 * @param {string} ticketId - Jira ticket ID for analysis context
 * @returns {string} Mock Claude analysis response
 */
function generateMockAnalysis(ticketId?: string): string {
  const ticket = ticketId || getTestTicketId();
  return `## ${ticket} Ticket vs PR Analysis

### Context Summary
This PR addresses validation rule issues in the application by adding a new boolean flag \`stopFormValidation\` to the \`TriggerHandler\` class. The modification provides a mechanism to bypass validation rules when necessary.

### Ticket Summary  
The Jira ticket describes an issue where forms cannot be set to "Ready to Read" status for studies with validation rules enabled. Users are encountering validation conflicts that prevent the status transition.

### PR Solution Analysis
The PR introduces a simple but effective solution:

- **Added**: \`public static Boolean stopFormValidation = false;\` to TriggerHandler.cls
- **Purpose**: Provides a way to disable form validation when needed
- **Implementation**: Clean, minimal change that follows existing code patterns

The solution directly addresses the root cause by providing a mechanism to bypass problematic validation rules during status transitions.

### Code Quality Assessment
✅ **Positive aspects:**
- Follows existing code conventions and patterns
- Minimal, focused change reduces risk
- Clear, descriptive variable name
- Proper access modifiers used

⚠️ **Considerations:**
- No visible safeguards to prevent misuse
- Would benefit from documentation about when to use this flag
- Consider adding logging when validation is bypassed

### Confidence Level: 85%

High confidence this solution addresses the immediate problem. The implementation is straightforward and targets the specific validation issue described in the ticket. The approach aligns with common patterns for handling validation bypasses in business applications.

### Recommendations

**Testing:**
1. Verify forms can be set to "Ready to Read" with validation rules enabled
2. Test that normal validation still works when flag is false
3. Validate the flag resets appropriately between operations

**Follow-up:**
1. Add code comments documenting the purpose and usage
2. Consider implementing audit logging when validation is bypassed
3. Review if additional safeguards are needed to prevent accidental misuse

**Deployment:**
1. Monitor production carefully after deployment
2. Verify the fix resolves the issue for affected studies
3. Document the new flag in team knowledge base

---
*This analysis was generated using AI with the Claude CLI*`;
}

/**
 * Claude CLI command mock responses
 */
const claudeCLIResponses = {
  // Basic CLI info
  version: { stdout: 'claude version 1.0.0' },
  help: {
    stdout: `Claude CLI Help
Usage: claude [options] [file]

Options:
  --help     Show help
  --version  Show version
  --model    Specify model to use

Examples:
  claude < prompt.txt     Analyze prompt from file
  claude --help          Show this help message
  claude --version       Show version information`,
  },

  // Authentication and configuration
  authLogin: { stdout: 'Successfully authenticated with Claude' },
  authStatus: { stdout: 'Logged in as test-user' },
  config: { stdout: 'Configuration updated successfully' },

  // Analysis operations
  analyze: (_input?: string): { stdout: string } => ({
    stdout: generateMockAnalysis(),
  }),

  analyzeFromFile: (_filePath?: string): { stdout: string } => ({
    stdout: generateMockAnalysis(),
  }),

  // Model operations
  models: {
    stdout: `Available models:
claude-3-opus-20240229     (most capable)
claude-3-sonnet-20240229   (balanced)  
claude-3-haiku-20240307    (fastest)`,
  },
};

/**
 * Claude service specific error responses
 */
const claudeErrorResponses = {
  notAuthenticated: new Error('Not authenticated with Claude'),
  rateLimited: new Error('API rate limit exceeded'),
  modelNotFound: new Error('Specified model not available'),
  invalidInput: new Error('Invalid input provided'),
  networkError: new Error('Network connection failed'),
  serviceUnavailable: new Error('Claude service temporarily unavailable'),
  tokenLimitExceeded: new Error('Input exceeds token limit'),
  fileNotFound: new Error('Input file not found'),
};

/**
 * Claude CLI command patterns for regex matching
 */
const claudeCommandPatterns = {
  version: /^claude --version$/,
  help: /^claude --help$/,
  analyze: /^claude(?:\s+[^<-].*)?$/,
  analyzeFromFile: /^claude\s*<\s*(.+)$/,
  authLogin: /^claude auth login/,
  authStatus: /^claude auth status/,
  config: /^claude config/,
  models: /^claude models$/,
};

/**
 * Generate dynamic Claude CLI response based on command
 * @param {string} command - Full command string
 * @returns {Object|null} Mock response or null if no match
 */
function getClaudeMockResponse(
  command: string
): { stdout: string; stderr?: string } | null {
  // Version command
  if (claudeCommandPatterns.version.test(command)) {
    return claudeCLIResponses.version;
  }

  // Help command
  if (claudeCommandPatterns.help.test(command)) {
    return claudeCLIResponses.help;
  }

  // Analysis from file (stdin redirect)
  const analyzeFileMatch = command.match(claudeCommandPatterns.analyzeFromFile);
  if (analyzeFileMatch) {
    const filePath = analyzeFileMatch[1];
    return claudeCLIResponses.analyzeFromFile(filePath);
  }

  // Direct analysis command
  if (claudeCommandPatterns.analyze.test(command)) {
    return claudeCLIResponses.analyze(command);
  }

  // Authentication commands
  if (claudeCommandPatterns.authLogin.test(command)) {
    return claudeCLIResponses.authLogin;
  }

  if (claudeCommandPatterns.authStatus.test(command)) {
    return claudeCLIResponses.authStatus;
  }

  // Configuration commands
  if (claudeCommandPatterns.config.test(command)) {
    return claudeCLIResponses.config;
  }

  // Models command
  if (claudeCommandPatterns.models.test(command)) {
    return claudeCLIResponses.models;
  }

  return null;
}

/**
 * Generate sample analysis prompts for testing
 */
function getClaudeTestPrompts(): Record<string, string> {
  const ticketId = getTestTicketId();
  return {
    simple: 'Analyze this code change',
    prAnalysis: `Analyze PR #123 against ticket ${ticketId}`,
    codeReview: 'Review this implementation for potential issues',
    comparison: `Compare the PR solution against ${ticketId} requirements`,
  };
}

/**
 * Generate different analysis response scenarios
 */
function getClaudeResponseScenarios(): Record<string, string> {
  const ticketId = getTestTicketId();
  return {
    positive: generateMockAnalysis(ticketId),
    withConcerns: generateMockAnalysis(ticketId)
      .replace('85%', '65%')
      .replace('High confidence', 'Moderate confidence'),
    needsWork: generateMockAnalysis(ticketId)
      .replace('✅', '⚠️')
      .replace('85%', '45%'),
    comprehensive:
      generateMockAnalysis(ticketId) +
      '\n\n## Additional Analysis\n\nDetailed code review findings...',
  };
}

/**
 * Validate Claude CLI command format
 * @param {string} command - Command to validate
 * @returns {boolean} True if command format is valid
 */
function isValidClaudeCommand(command: string): boolean {
  return Object.values(claudeCommandPatterns).some(pattern =>
    pattern.test(command)
  );
}

export {
  claudeCLIResponses,
  claudeErrorResponses,
  claudeCommandPatterns,
  getClaudeMockResponse,
  generateMockAnalysis,
  getClaudeTestPrompts,
  getClaudeResponseScenarios,
  isValidClaudeCommand,
};
