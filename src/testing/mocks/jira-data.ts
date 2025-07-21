/**
 * Jira mock data for testing
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

import { getTestTicketId } from '../utils/test-helpers';

export interface JiraMockResponse {
  stdout: string;
  stderr?: string;
}

export interface JiraMockResponses {
  issueView: (_ticketId: string) => JiraMockResponse;
  version: JiraMockResponse;
  me: JiraMockResponse;
  issueList: JiraMockResponse;
}

export interface JiraPatterns {
  validTickets: string[];
  invalidFormats: string[];
  prTitles: {
    valid: string[];
    invalid: string[];
  };
}

/**
 * Generate mock Jira data for testing using current environment
 */
export function getMockJiraData(ticketId?: string): string {
  const ticket = ticketId || getTestTicketId();
  return `🐞 Bug  🚧 Ready to Test  ⌛ Sat, 19 Jul 25  👷 Sumyouktha Rajendra Kumar  🔑️ ${ticket}  💭 2 comments  🧵 2 linked

# Unable to set the forms to "Ready to Read" for the study configured to apply validation rules

⏱️  Thu, 17 Jul 25  🔎 Sumyouktha Rajendra Kumar  🚀 Highest  📦 None  🏷️  None  👀 2 watchers

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

This issue affects multiple studies and is blocking the review process.`;
}

/**
 * Mock Jira CLI responses for testing
 */
export const mockJiraResponses: JiraMockResponses = {
  issueView: (ticketId: string): JiraMockResponse => ({
    stdout: getMockJiraData(ticketId),
  }),

  version: { stdout: 'Version: 1.4.0' },

  me: { stdout: 'test-user@example.com' },

  issueList: {
    stdout: `Issues in TEST

${getTestTicketId()}  Unable to set forms to Ready to Read   Bug     Ready to Test   test-user
TEST-1234  Another test issue                              Story   In Progress     test-user`,
  },
};

/**
 * Generate mock Jira ticket patterns for testing
 */
export function getMockJiraPatterns(): JiraPatterns {
  const prefix = process.env.JIRA_TICKET_PREFIX || 'TEST';
  return {
    validTickets: [`${prefix}-1234`, `${prefix}-2055`, `${prefix}-9999`],
    invalidFormats: ['INVALID-123', 'not-a-ticket', '123-${prefix}'],
    prTitles: {
      valid: [
        `${prefix}-1234: Fix validation issue`,
        `Feature: ${prefix}-2055 - Add new functionality`,
        `Bugfix for ${prefix}-9999 and related issues`,
      ],
      invalid: [
        'Fix validation issue without ticket',
        'INVALID-123: Wrong format',
        'Feature without ticket reference',
      ],
    },
  };
}
