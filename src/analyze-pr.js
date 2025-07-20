#!/usr/bin/env node

/**
 * analyze-pr.js - Smart PR Analysis Script with Claude Integration
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Gathers PR and Jira data, sends to Claude for analysis, posts result as PR comment
 */

const {
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
    getUserInput,
    getUserConfirmation
} = require('./utils/pr-utils');

/**
 * Create comprehensive Claude prompt for PR analysis
 * @param {string} prNumber - GitHub PR number
 * @param {string} ticketId - Jira ticket ID
 * @param {Object} prData - PR data from GitHub
 * @param {string} jiraData - Jira ticket content
 * @returns {Promise<string>} Formatted Claude prompt
 */
async function createClaudePrompt(prNumber, ticketId, prData, jiraData) {
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
 * Save Claude prompt to file for manual execution
 * @param {string} prompt - Claude prompt content
 * @returns {string} Path to saved prompt file
 */
async function callClaude(prompt) {
    printStatus('yellow', 'Preparing Claude prompt...');
    
    // Write prompt to timestamped file
    const promptFile = createTimestampedFile('claude-prompt', '.txt', prompt);
    
    console.log(`Prompt prepared (${prompt.length} characters)`);
    console.log(`Prompt saved to: ${promptFile}`);
    
    return prompt;
}

/**
 * Main analysis function
 * @param {string} prNumber - GitHub PR number
 */
async function main(prNumber) {
    printStatus('green', `Starting Smart PR Analysis for #${prNumber}`);
    printStatus('green', '='.repeat(50));
    
    // Step 1: Validate PR
    if (!(await validatePR(prNumber))) {
        process.exit(1);
    }
    
    // Step 2: Gather PR data
    const prData = await gatherPRData(prNumber);
    if (!prData) {
        process.exit(1);
    }
    
    printStatus('green', `PR Title: ${prData.json.title}`);
    printStatus('green', `PR Author: ${prData.json.author.login}`);
    
    // Step 3: Extract and validate Jira ticket
    const jiraTicket = extractJiraTicket(prData.json.title);
    if (!jiraTicket) {
        const jiraConfig = loadJiraConfig();
        printStatus('red', 'Error: No Jira ticket found in PR title');
        printStatus('yellow', `PR title should contain a ${jiraConfig.example} pattern`);
        process.exit(1);
    }
    
    printStatus('green', `Extracted Jira ticket: ${jiraTicket}`);
    
    if (!(await validateJiraTicket(jiraTicket))) {
        printStatus('red', `Error: Cannot access Jira ticket ${jiraTicket}`);
        printStatus('yellow', 'Please ensure you are authenticated with Jira CLI');
        process.exit(1);
    }
    
    // Step 4: Gather Jira data
    const jiraData = await gatherJiraData(jiraTicket);
    if (!jiraData) {
        process.exit(1);
    }
    
    printStatus('green', 'Data gathering complete!');
    
    // Step 5: Create Claude prompt
    const claudePrompt = await createClaudePrompt(prNumber, jiraTicket, prData, jiraData);
    
    // Step 6: Prepare Claude prompt
    const analysis = await callClaude(claudePrompt);
    
    printStatus('green', 'PR Analysis completed!');
    printStatus('yellow', 'Next steps:');
    console.log('1. Run the saved prompt through Claude CLI or Web interface');
    console.log('2. Save Claude\'s analysis to a text file');
    console.log('3. Use comment-pr.js to post the analysis as a PR comment');
    console.log(`\nExample: node scripts/comment-pr.js ${prNumber} temp/claude-output-[timestamp].txt`);
}

/**
 * Display usage information
 */
function usage() {
    console.log(`
Smart PR Analysis Script
========================

Usage: node analyze-pr.js <pr_number>

Author: Anthony Rizzo, Co-pilot: Claude
Description: Gathers PR and Jira data, prepares comprehensive prompt for Claude analysis

Arguments:
  pr_number         The GitHub pull request number to analyze

Examples:
  node analyze-pr.js 391                    # Prepares analysis prompt
  node analyze-pr.js 392                    # Prepares analysis prompt

Requirements:
  - Node.js
  - gh (GitHub CLI) - authenticated
  - jira (Jira CLI) - authenticated  

Process:
1. Gathers PR details and diff from GitHub
2. Extracts Jira ticket ID from PR title
3. Gathers Jira ticket details
4. Prepares comprehensive prompt for Claude analysis
5. Saves prompt to temp/claude-prompt-[timestamp].txt

This approach leverages Claude's analytical capabilities with proper codebase context gathering.

Next Steps:
After running this script, use the generated prompt with Claude, then use comment-pr.js 
to post the analysis as a PR comment.

Created by: Anthony Rizzo with Claude as co-pilot
`);
}

/**
 * Entry point
 */
async function main_entry() {
    if (process.argv.length !== 3) {
        usage();
        process.exit(1);
    }
    
    const prNumber = process.argv[2];
    
    if (!validatePRNumber(prNumber)) {
        printStatus('red', 'Error: PR number must be numeric');
        usage();
        process.exit(1);
    }
    
    try {
        await checkRequiredTools(['gh', 'jira']);
        await main(prNumber);
    } catch (error) {
        printStatus('red', `Unexpected error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main_entry();
}

module.exports = { 
    main, 
    createClaudePrompt, 
    callClaude,
    usage
};