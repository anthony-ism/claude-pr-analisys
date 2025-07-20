/**
 * Jira CLI mock responses for testing
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

const { getTestTicketId } = require('../../testing/utils/test-helpers');

/**
 * Jira CLI command mock responses
 */
const jiraCLIResponses = {
  // Basic CLI info
  version: { stdout: 'Version: 1.4.0' },
  me: { stdout: 'test-user@example.com' },
  init: { stdout: 'Jira CLI initialized successfully' },

  // Issue operations
  issueView: ticketId => {
    const ticket = ticketId || getTestTicketId();
    return {
      stdout: `🐞 Bug  🚧 Ready to Test  ⌛ Sat, 19 Jul 25  👷 Test User  🔑️ ${ticket}  💭 2 comments

# Unable to set the forms to "Ready to Read" for the study configured to apply validation rules

⏱️  Thu, 17 Jul 25  🔎 Test User  🚀 Highest  📦 None  🏷️  None  👀 2 watchers

## Description

When attempting to set forms to "Ready to Read" status for studies that have validation rules configured, the system fails to complete the operation. This appears to be related to validation rule conflicts during the status transition.

## Steps to Reproduce

1. Navigate to a study with validation rules enabled
2. Attempt to set forms to "Ready to Read" status  
3. Observe the validation error preventing the status change

## Expected Behavior

Forms should transition to "Ready to Read" status regardless of validation rule configuration.

## Actual Behavior

Validation rules prevent the status transition, blocking the workflow.

## Additional Information

This issue affects multiple studies and is blocking the review process.`,
    };
  },

  issueList: {
    stdout: `Issues in ${process.env.JIRA_TICKET_PREFIX || 'TEST'}

${getTestTicketId()}  Unable to set forms to Ready to Read   Bug     Ready to Test   test-user
TEST-1234  Another test issue                              Story   In Progress     test-user
TEST-5678  Feature request                                 Story   To Do           test-user`,
  },

  issueCreate: _summary => ({
    stdout: `Issue ${getTestTicketId()} created successfully`,
  }),

  issueUpdate: ticketId => ({
    stdout: `Issue ${ticketId} updated successfully`,
  }),
};

/**
 * Jira service specific error responses
 */
const jiraErrorResponses = {
  issueNotFound: new Error('Issue not found'),
  notAuthenticated: new Error('Not authenticated with Jira'),
  permissionDenied: new Error('Permission denied'),
  invalidProject: new Error('Project not found'),
  networkError: new Error('Network connection failed'),
  invalidFormat: new Error('Invalid issue format'),
  serverError: new Error('Jira server error'),
  rateLimited: new Error('API rate limit exceeded'),
};

/**
 * Jira CLI command patterns for regex matching
 */
const jiraCommandPatterns = {
  issueView: /^jira issue view ([A-Z]+-\d+)(?:\s|$)/,
  issueList: /^jira issue list(?:\s|$)/,
  issueCreate: /^jira issue create/,
  issueUpdate: /^jira issue update ([A-Z]+-\d+)/,
  version: /^jira version$/,
  me: /^jira me$/,
  init: /^jira init/,
  help: /^jira --help$/,
};

/**
 * Generate dynamic Jira CLI response based on command
 * @param {string} command - Full command string
 * @returns {Object|null} Mock response or null if no match
 */
function getJiraMockResponse(command) {
  // Issue view command
  const issueViewMatch = command.match(jiraCommandPatterns.issueView);
  if (issueViewMatch) {
    const ticketId = issueViewMatch[1];
    return jiraCLIResponses.issueView(ticketId);
  }

  // Issue list command
  if (jiraCommandPatterns.issueList.test(command)) {
    return jiraCLIResponses.issueList;
  }

  // Issue create command
  if (jiraCommandPatterns.issueCreate.test(command)) {
    return jiraCLIResponses.issueCreate();
  }

  // Issue update command
  const issueUpdateMatch = command.match(jiraCommandPatterns.issueUpdate);
  if (issueUpdateMatch) {
    const ticketId = issueUpdateMatch[1];
    return jiraCLIResponses.issueUpdate(ticketId);
  }

  // Version command
  if (jiraCommandPatterns.version.test(command)) {
    return jiraCLIResponses.version;
  }

  // Me command (authentication check)
  if (jiraCommandPatterns.me.test(command)) {
    return jiraCLIResponses.me;
  }

  // Init command
  if (jiraCommandPatterns.init.test(command)) {
    return jiraCLIResponses.init;
  }

  // Help command
  if (jiraCommandPatterns.help.test(command)) {
    return { stdout: 'Jira CLI help text...' };
  }

  return null;
}

/**
 * Generate test ticket patterns for validation testing
 */
function getJiraTestPatterns() {
  const prefix = process.env.JIRA_TICKET_PREFIX || 'TEST';
  return {
    validTickets: [`${prefix}-1234`, `${prefix}-2055`, `${prefix}-9999`],
    invalidFormats: [
      'INVALID-123',
      'not-a-ticket',
      '123-INVALID',
      'lowercase-123',
    ],
    prTitlesWithTickets: [
      `${prefix}-1234: Fix validation issue`,
      `Feature: ${prefix}-2055 - Add new functionality`,
      `Bugfix for ${prefix}-9999 and related issues`,
      `${prefix}-1234 Update documentation`,
    ],
    prTitlesWithoutTickets: [
      'Fix validation issue without ticket',
      'Feature without ticket reference',
      'Random commit message',
      'Update dependencies',
    ],
  };
}

/**
 * Validate Jira CLI command format
 * @param {string} command - Command to validate
 * @returns {boolean} True if command format is valid
 */
function isValidJiraCommand(command) {
  return Object.values(jiraCommandPatterns).some(pattern =>
    pattern.test(command)
  );
}

module.exports = {
  jiraCLIResponses,
  jiraErrorResponses,
  jiraCommandPatterns,
  getJiraMockResponse,
  getJiraTestPatterns,
  isValidJiraCommand,
};
