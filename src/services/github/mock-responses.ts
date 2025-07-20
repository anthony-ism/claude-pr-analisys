/**
 * GitHub CLI mock responses for testing
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

const { getTestTicketId } = require('../../testing/utils/test-helpers');

/**
 * GitHub CLI command mock responses
 */
const githubCLIResponses = {
  // Basic CLI info
  version: { stdout: 'gh version 2.40.1 (2023-12-13)' },
  authStatus: { stdout: 'Logged in to github.com as test-user (oauth_token)' },
  authLogin: { stdout: 'Authentication complete' },

  // PR operations
  prView: prNumber => {
    const ticketId = getTestTicketId();
    return {
      stdout: `title: ${ticketId}: Unable to set forms to Ready to Read
state: OPEN
author: test-user
assignees: test-user
reviewers: reviewer1, reviewer2
url: https://github.com/test-org/test-repo/pull/${prNumber}
additions: +15
deletions: -0`,
    };
  },

  prDiff: _prNumber => ({
    stdout: `diff --git a/TriggerHandler.cls b/TriggerHandler.cls
index ccdfba89c..6c513312d 100644
--- a/TriggerHandler.cls
+++ b/TriggerHandler.cls
@@ -1,5 +1,6 @@
 public with sharing class TriggerHandler {
   public static Boolean allowReadOnlySave = false;
+  public static Boolean stopFormValidation = false;`,
  }),

  prJSON: prNumber => {
    const ticketId = getTestTicketId();
    return {
      stdout: JSON.stringify({
        title: `${ticketId}: Unable to set forms to Ready to Read`,
        author: { login: 'test-user' },
        state: 'OPEN',
        additions: 15,
        deletions: 0,
        url: `https://github.com/test-org/test-repo/pull/${prNumber}`,
      }),
    };
  },

  prComment: (prNumber, _content) => ({
    stdout: `Comment added to pull request #${prNumber}`,
  }),

  prList: {
    stdout: `Showing 2 of 2 open pull requests in test-org/test-repo
#123  Fix validation issue      test-user
#124  Add new feature          test-user`,
  },
};

/**
 * GitHub service specific error responses
 */
const githubErrorResponses = {
  prNotFound: new Error('Pull request not found'),
  notAuthenticated: new Error('Not authenticated with GitHub'),
  permissionDenied: new Error('Permission denied'),
  rateLimited: new Error('API rate limit exceeded'),
  networkError: new Error('Network connection failed'),
};

/**
 * GitHub CLI command patterns for regex matching
 */
const githubCommandPatterns = {
  prView: /^gh pr view (\d+)(?:\s|$)/,
  prDiff: /^gh pr diff (\d+)(?:\s|$)/,
  prComment: /^gh pr comment (\d+)/,
  prJSON: /^gh pr view (\d+) --json/,
  version: /^gh --version$/,
  authStatus: /^gh auth status$/,
};

/**
 * Generate dynamic GitHub CLI response based on command
 * @param {string} command - Full command string
 * @returns {Object|null} Mock response or null if no match
 */
function getGitHubMockResponse(command) {
  // PR view command
  const prViewMatch = command.match(githubCommandPatterns.prView);
  if (prViewMatch) {
    const prNumber = prViewMatch[1];
    return githubCLIResponses.prView(prNumber);
  }

  // PR diff command
  const prDiffMatch = command.match(githubCommandPatterns.prDiff);
  if (prDiffMatch) {
    const prNumber = prDiffMatch[1];
    return githubCLIResponses.prDiff(prNumber);
  }

  // PR JSON command
  const prJSONMatch = command.match(githubCommandPatterns.prJSON);
  if (prJSONMatch) {
    const prNumber = prJSONMatch[1];
    return githubCLIResponses.prJSON(prNumber);
  }

  // PR comment command
  const prCommentMatch = command.match(githubCommandPatterns.prComment);
  if (prCommentMatch) {
    const prNumber = prCommentMatch[1];
    return githubCLIResponses.prComment(prNumber);
  }

  // Version command
  if (githubCommandPatterns.version.test(command)) {
    return githubCLIResponses.version;
  }

  // Auth status command
  if (githubCommandPatterns.authStatus.test(command)) {
    return githubCLIResponses.authStatus;
  }

  return null;
}

module.exports = {
  githubCLIResponses,
  githubErrorResponses,
  githubCommandPatterns,
  getGitHubMockResponse,
};
