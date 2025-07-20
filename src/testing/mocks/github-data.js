/**
 * GitHub mock data for testing
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

const { getTestTicketId } = require('../utils/test-helpers');

/**
 * Generate mock PR data for testing using current environment
 * @returns {Object} Mock PR data object
 */
function getMockPRData() {
    const ticketId = getTestTicketId();
    return {
        view: `title: ${ticketId}: Unable to set the forms to Ready to Read for the study con…
state: MERGED
author: rajanrana1
additions: 15
deletions: 0`,
        diff: `diff --git a/BIRC/force-app/main/default/classes/TriggerHandler.cls b/BIRC/force-app/main/default/classes/TriggerHandler.cls
index ccdfba89c..6c513312d 100644
--- a/BIRC/force-app/main/default/classes/TriggerHandler.cls
+++ b/BIRC/force-app/main/default/classes/TriggerHandler.cls
@@ -1,5 +1,6 @@
 public with sharing class TriggerHandler {
   public static Boolean allowReadOnlySave = false;
+  public static Boolean stopFormValidation = false;`,
        json: {
            title: `${ticketId}: Unable to set the forms to Ready to Read for the study con…`,
            author: { login: 'rajanrana1' },
            state: 'MERGED',
            additions: 15,
            deletions: 0,
            url: 'https://github.com/BostonImageReadingCenter/salesforce-new/pull/393'
        }
    };
}

/**
 * Mock GitHub CLI responses for testing
 */
const mockGitHubResponses = {
    prView: (prNumber) => {
        const ticketId = getTestTicketId();
        return {
            stdout: `title: ${ticketId}: Test PR title
state: OPEN
author: test-user
url: https://github.com/test-org/test-repo/pull/${prNumber}`
        };
    },
    
    prDiff: (prNumber) => ({
        stdout: `diff --git a/test.js b/test.js
index 1234567..abcdefg 100644
--- a/test.js
+++ b/test.js
@@ -1 +1,2 @@
 console.log('test');
+console.log('updated');`
    }),
    
    prJSON: (prNumber) => {
        const ticketId = getTestTicketId();
        return {
            stdout: JSON.stringify({
                title: `${ticketId}: Test PR title`,
                author: { login: 'test-user' },
                state: 'OPEN',
                additions: 5,
                deletions: 1,
                url: `https://github.com/test-org/test-repo/pull/${prNumber}`
            })
        };
    },
    
    prComment: { stdout: 'Comment posted successfully' },
    
    version: { stdout: 'gh version 2.40.1 (2023-12-13)' },
    
    authStatus: { stdout: 'Logged in to github.com as test-user (oauth_token)' }
};

module.exports = {
    getMockPRData,
    mockGitHubResponses
};