/**
 * Claude mock data for testing
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

const { getTestTicketId } = require('../utils/test-helpers');

export interface ClaudeMockResponse {
  stdout: string;
  stderr?: string;
}

export interface ClaudeMockResponses {
  analyze: (prompt?: string) => ClaudeMockResponse;
  version: ClaudeMockResponse;
  help: ClaudeMockResponse;
  config: ClaudeMockResponse;
}

export interface MockPRData {
  view: string;
  diff: string;
  json: {
    title: string;
    author: {
      login: string;
    };
    state: string;
    additions: number;
    deletions: number;
    url: string;
  };
}

export interface PromptVariations {
  bugFix: string;
  feature: string;
  refactor: string;
}

/**
 * Generate mock Claude prompt for testing
 */
export function getMockClaudePrompt(
  prNumber?: string,
  ticketId?: string,
  prData?: MockPRData | null,
  jiraData?: string
): string {
  const ticket = ticketId || (getTestTicketId() as string);
  const prNum = prNumber || '123';

  return `I need you to analyze a GitHub pull request against its associated Jira ticket and provide a comprehensive analysis.

## Pull Request #${prNum}

### PR Details:
${prData ? prData.view : 'Mock PR view data'}

### PR Changes (diff):
${prData ? prData.diff : 'Mock PR diff data'}

### PR Metadata:
- Title: ${prData ? prData.json.title : `${ticket}: Mock PR title`}
- Author: ${prData ? prData.json.author.login : 'test-user'}
- State: ${prData ? prData.json.state : 'OPEN'}
- Additions: ${prData ? prData.json.additions : 15}
- Deletions: ${prData ? prData.json.deletions : 0}
- URL: ${prData ? prData.json.url : `https://github.com/test-org/test-repo/pull/${prNum}`}

## Jira Ticket ${ticket}

### Ticket Details:
${jiraData || 'Mock Jira ticket data'}

## Analysis Request

IMPORTANT: Before analyzing, please first gather context by:

1. **Examine the diff** to identify all unique files that were modified
2. **Read the modified files** to understand the current codebase context
3. **Read any files referenced** in the modified files (imports, dependencies, related classes, etc.) to understand the broader context
4. **Use search tools** to find related functionality if needed

Once you have gathered sufficient context, provide a comprehensive analysis comparing the PR changes against the Jira ticket requirements. Your analysis should include:

1. **Context Summary**: Brief overview of the codebase area being modified
2. **Ticket Summary**: Brief summary of the issue from Jira
3. **PR Solution Analysis**: How the PR addresses the issue with full context
4. **Code Quality Assessment**: Review of the implementation approach and patterns used
5. **Confidence Level**: How confident you are this solves the problem (with percentage)
6. **Recommendations**: Follow-up tasks and testing suggestions

Format your response as a GitHub comment that can be posted directly to the PR. Use markdown formatting and include:
- Clear section headers
- Bullet points for key findings
- Confidence assessment with reasoning
- Actionable recommendations

Make the analysis thorough but concise, focusing on whether the PR actually solves the problem described in the Jira ticket with proper understanding of the codebase context.

IMPORTANT: End your analysis with the following attribution:
---
*This analysis was generated using AI with the Claude CLI*`;
}

/**
 * Generate mock Claude response for testing
 */
export function getMockClaudeResponse(ticketId?: string): string {
  const ticket = ticketId || (getTestTicketId() as string);
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
 * Mock Claude CLI responses for testing
 */
export const mockClaudeResponses: ClaudeMockResponses = {
  analyze: (_prompt?: string): ClaudeMockResponse => ({
    stdout: getMockClaudeResponse(),
  }),

  version: { stdout: 'claude version 1.0.0' },

  help: {
    stdout: `Claude CLI Help
Usage: claude [options] [file]
Options:
  --help     Show help
  --version  Show version
  --model    Specify model to use`,
  },

  config: {
    stdout: 'Claude CLI configured successfully',
  },
};

/**
 * Generate sample prompts for different scenarios
 */
export function getMockPromptVariations(): PromptVariations {
  const ticketId = getTestTicketId() as string;
  return {
    bugFix: getMockClaudePrompt(
      '123',
      ticketId,
      null,
      'Bug: Form validation issue'
    ),
    feature: getMockClaudePrompt(
      '124',
      `${ticketId.split('-')[0]}-1234`,
      null,
      'Feature: New functionality'
    ),
    refactor: getMockClaudePrompt(
      '125',
      `${ticketId.split('-')[0]}-5678`,
      null,
      'Refactor: Code cleanup'
    ),
  };
}
