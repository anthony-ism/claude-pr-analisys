/**
 * Claude service exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

const {
    claudeCLIResponses,
    claudeErrorResponses,
    claudeCommandPatterns,
    getClaudeMockResponse,
    generateMockAnalysis,
    getClaudeTestPrompts,
    getClaudeResponseScenarios,
    isValidClaudeCommand
} = require('./mock-responses');

module.exports = {
    // CLI mock responses
    cliResponses: claudeCLIResponses,
    errorResponses: claudeErrorResponses,
    commandPatterns: claudeCommandPatterns,
    getMockResponse: getClaudeMockResponse,
    generateAnalysis: generateMockAnalysis,
    getTestPrompts: getClaudeTestPrompts,
    getResponseScenarios: getClaudeResponseScenarios,
    isValidCommand: isValidClaudeCommand
};