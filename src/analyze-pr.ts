#!/usr/bin/env node

/**
 * analyze-pr.ts - Smart PR Analysis Script with Claude Integration
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Gathers PR and Jira data, sends to Claude for analysis, posts result as PR comment
 */

import {
  printStatus,
  validatePRNumber,
  validatePR,
  gatherPRData,
  loadJiraConfig,
  extractJiraTicket,
  validateJiraTicket,
  gatherJiraData,
  detectClaudeModel,
  checkRequiredTools,
  createTimestampedFile,
  getUserConfirmation,
} from './utils/pr-utils';

import { GitHubPRData } from './services/github';
import { analyzeWithClaude, ClaudeAnalysisRequest } from './services/claude';
import {
  loadAppConfig,
  AnalysisContext,
  AnalysisResult,
  AnalysisMetadata,
} from './core';

/**
 * Create comprehensive Claude prompt for PR analysis
 * @param prNumber GitHub PR number
 * @param ticketId Jira ticket ID
 * @param prData PR data from GitHub
 * @param jiraData Jira ticket content
 * @returns Formatted Claude prompt
 */
async function createClaudePrompt(
  prNumber: string,
  ticketId: string,
  prData: GitHubPRData,
  jiraData: string
): Promise<string> {
  const claudeModel = await detectClaudeModel();

  return `I need you to analyze a GitHub pull request against its associated Jira ticket and provide a comprehensive analysis.

## Pull Request #${prNumber}

### PR Details:
${prData.view}

### PR Changes (diff):
${prData.diff}

### PR Metadata:
- Title: ${prData.json.title}
- Author: ${prData.json.author.login}
- State: ${prData.json.state}
- Additions: ${prData.json.additions}
- Deletions: ${prData.json.deletions}
- URL: ${prData.json.url}

## Jira Ticket ${ticketId}

### Ticket Details:
${jiraData}

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
*This analysis was generated using AI with the Claude CLI and ${claudeModel}*`;
}

/**
 * Analyze PR using Claude CLI
 * @param prompt Claude prompt content
 * @param context Analysis context
 * @returns Analysis result
 */
async function callClaude(
  prompt: string,
  context: AnalysisContext
): Promise<AnalysisResult> {
  const startTime = new Date();

  try {
    printStatus('yellow', 'Analyzing with Claude...');

    const config = loadAppConfig();
    const request: ClaudeAnalysisRequest = {
      prompt,
      ...(config.services.claude.model && {
        model: config.services.claude.model,
      }),
    };

    const response = await analyzeWithClaude(request);

    const endTime = new Date();
    const metadata: AnalysisMetadata = {
      context,
      services: [
        {
          service: 'claude',
          operations: ['analyze'],
          success: true,
          duration: endTime.getTime() - startTime.getTime(),
        },
      ],
      performance: {
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        serviceBreakdown: {
          claude: endTime.getTime() - startTime.getTime(),
        },
      },
      model: response.model,
    };

    printStatus('green', 'Claude analysis completed!');

    return {
      success: true,
      content: response.content,
      metadata,
    };
  } catch (error) {
    printStatus(
      'red',
      `Claude analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    // Fallback: Save prompt to file for manual execution
    printStatus('yellow', 'Saving prompt for manual execution...');
    const promptFile = createTimestampedFile(prompt, 'claude-prompt', 'txt');

    printStatus('yellow', `Prompt saved to: ${promptFile}`);
    printStatus(
      'yellow',
      'You can manually run this prompt through Claude CLI or Web interface'
    );

    const endTime = new Date();
    const metadata: AnalysisMetadata = {
      context,
      services: [
        {
          service: 'claude',
          operations: ['analyze'],
          success: false,
          duration: endTime.getTime() - startTime.getTime(),
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      ],
      performance: {
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        serviceBreakdown: {
          claude: endTime.getTime() - startTime.getTime(),
        },
      },
    };

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata,
    };
  }
}

/**
 * Main analysis function
 * @param prNumber GitHub PR number
 */
async function main(prNumber: string): Promise<AnalysisResult> {
  const startTime = new Date();
  const config = loadAppConfig();

  printStatus('green', `Starting Smart PR Analysis for #${prNumber}`);
  printStatus('green', '='.repeat(50));

  const context: AnalysisContext = {
    prNumber,
    repository: config.environment.githubRepository,
    timestamp: startTime,
  };

  try {
    // Step 1: Validate PR
    if (!(await validatePR(prNumber))) {
      throw new Error('PR validation failed');
    }

    // Step 2: Gather PR data
    const prData = await gatherPRData(prNumber);
    if (!prData) {
      throw new Error('Failed to gather PR data');
    }

    printStatus('green', `PR Title: ${prData.json.title}`);
    printStatus('green', `PR Author: ${prData.json.author.login}`);

    // Step 3: Extract and validate Jira ticket
    const jiraTicket = extractJiraTicket(prData.json.title);
    if (!jiraTicket) {
      const jiraConfig = loadJiraConfig();
      throw new Error(
        `No Jira ticket found in PR title. Title should contain pattern: ${jiraConfig.example}`
      );
    }

    context.ticketId = jiraTicket;
    printStatus('green', `Extracted Jira ticket: ${jiraTicket}`);

    if (!(await validateJiraTicket(jiraTicket))) {
      throw new Error(
        `Cannot access Jira ticket ${jiraTicket}. Please ensure you are authenticated with Jira CLI`
      );
    }

    // Step 4: Gather Jira data
    const jiraData = await gatherJiraData(jiraTicket);
    if (!jiraData) {
      throw new Error('Failed to gather Jira data');
    }

    printStatus('green', 'Data gathering complete!');

    // Step 5: Create Claude prompt
    const claudePrompt = await createClaudePrompt(
      prNumber,
      jiraTicket,
      prData,
      jiraData
    );

    // Step 6: Analyze with Claude
    const result = await callClaude(claudePrompt, context);

    if (result.success && result.content) {
      // Save analysis to file
      const analysisFile = createTimestampedFile(
        result.content,
        'claude-analysis',
        'md'
      );
      printStatus('green', `Analysis saved to: ${analysisFile}`);

      // Ask if user wants to post as comment
      const shouldPost = await getUserConfirmation(
        'Post analysis as PR comment?',
        false
      );
      if (shouldPost) {
        const { postPRComment } = await import('./utils/pr-utils');
        const posted = await postPRComment(prNumber, analysisFile);
        if (posted) {
          printStatus('green', 'Analysis posted as PR comment!');
        } else {
          printStatus('red', 'Failed to post comment');
        }
      }
    }

    return result;
  } catch (error) {
    const endTime = new Date();
    const metadata: AnalysisMetadata = {
      context,
      services: [],
      performance: {
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        serviceBreakdown: {},
      },
    };

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata,
    };
  }
}

/**
 * Display usage information
 */
function usage(): void {
  console.log(`
Smart PR Analysis Script
========================

Usage: node analyze-pr.js <pr_number>

Author: Anthony Rizzo, Co-pilot: Claude
Description: Gathers PR and Jira data, analyzes with Claude, optionally posts as comment

Arguments:
  pr_number         The GitHub pull request number to analyze

Examples:
  node analyze-pr.js 391                    # Analyze PR #391
  node analyze-pr.js 392                    # Analyze PR #392

Requirements:
  - Node.js
  - gh (GitHub CLI) - authenticated
  - jira (Jira CLI) - authenticated (optional)
  - Claude CLI - authenticated (optional)

Process:
1. Gathers PR details and diff from GitHub
2. Extracts Jira ticket ID from PR title
3. Gathers Jira ticket details
4. Analyzes PR against ticket using Claude
5. Saves analysis and optionally posts as PR comment

Environment Variables:
  GITHUB_REPOSITORY     - GitHub repository (owner/repo format)
  JIRA_TICKET_PREFIX    - Jira project prefix (e.g., PROJ, DEV)
  CLAUDE_MODEL          - Claude model to use (optional)
  CLAUDE_CLI_PATH       - Custom Claude CLI path (optional)

Created by: Anthony Rizzo with Claude as co-pilot
`);
}

/**
 * Entry point
 */
async function main_entry(): Promise<void> {
  if (process.argv.length !== 3) {
    usage();
    process.exit(1);
  }

  const prNumber = process.argv[2]!;

  if (!validatePRNumber(prNumber)) {
    printStatus('red', 'Error: PR number must be numeric');
    usage();
    process.exit(1);
  }

  try {
    const tools = await checkRequiredTools();
    if (!tools.github) {
      printStatus(
        'red',
        'Error: GitHub CLI (gh) is required but not available'
      );
      printStatus(
        'yellow',
        'Please install and authenticate GitHub CLI: https://cli.github.com/'
      );
      process.exit(1);
    }

    if (!tools.jira) {
      printStatus(
        'yellow',
        'Warning: Jira CLI not available - Jira integration will be limited'
      );
    }

    if (!tools.claude) {
      printStatus(
        'yellow',
        'Warning: Claude CLI not available - analysis will be saved as prompt file'
      );
    }

    const result = await main(prNumber);

    if (!result.success) {
      printStatus('red', `Analysis failed: ${result.error}`);
      process.exit(1);
    }

    printStatus('green', 'PR Analysis completed successfully!');
  } catch (error) {
    printStatus(
      'red',
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  void main_entry();
}

// Export for testing and module use
export { main, createClaudePrompt, callClaude, usage };
