/**
 * GitHub service exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

const {
    githubCLIResponses,
    githubErrorResponses,
    githubCommandPatterns,
    getGitHubMockResponse
} = require('./mock-responses');

module.exports = {
    // CLI mock responses
    cliResponses: githubCLIResponses,
    errorResponses: githubErrorResponses,
    commandPatterns: githubCommandPatterns,
    getMockResponse: getGitHubMockResponse
};