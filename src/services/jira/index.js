/**
 * Jira service exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

const {
    jiraCLIResponses,
    jiraErrorResponses,
    jiraCommandPatterns,
    getJiraMockResponse,
    getJiraTestPatterns,
    isValidJiraCommand
} = require('./mock-responses');

module.exports = {
    // CLI mock responses
    cliResponses: jiraCLIResponses,
    errorResponses: jiraErrorResponses,
    commandPatterns: jiraCommandPatterns,
    getMockResponse: getJiraMockResponse,
    getTestPatterns: getJiraTestPatterns,
    isValidCommand: isValidJiraCommand
};