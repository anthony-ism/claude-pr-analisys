/**
 * Centralized mock data exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Shared test utilities
const { 
    getTestTicketId,
    validateTestEnvironment,
    setupTestEnvironment,
    cleanupTestEnvironment,
    getTestTicketPatterns
} = require('../utils/test-helpers');

// Service mock data
const { 
    getMockPRData,
    mockGitHubResponses
} = require('./github-data');

const { 
    getMockJiraData,
    mockJiraResponses,
    getMockJiraPatterns
} = require('./jira-data');

const { 
    getMockClaudePrompt,
    getMockClaudeResponse,
    mockClaudeResponses,
    getMockPromptVariations
} = require('./claude-data');

// Service CLI mock responses
const {
    githubCLIResponses,
    githubErrorResponses,
    getGitHubMockResponse
} = require('../../services/github/mock-responses');

const {
    jiraCLIResponses,
    jiraErrorResponses,
    getJiraMockResponse
} = require('../../services/jira/mock-responses');

const {
    claudeCLIResponses,
    claudeErrorResponses,
    getClaudeMockResponse
} = require('../../services/claude/mock-responses');

/**
 * Complete mock data sets for testing
 */
const mockData = {
    github: {
        pr: getMockPRData(),
        responses: mockGitHubResponses
    },
    jira: {
        data: getMockJiraData(),
        responses: mockJiraResponses,
        patterns: getMockJiraPatterns()
    },
    claude: {
        prompt: getMockClaudePrompt(),
        response: getMockClaudeResponse(),
        responses: mockClaudeResponses,
        variations: getMockPromptVariations()
    }
};

/**
 * Complete CLI response sets for testing
 */
const cliResponses = {
    github: {
        responses: githubCLIResponses,
        errors: githubErrorResponses,
        getMockResponse: getGitHubMockResponse
    },
    jira: {
        responses: jiraCLIResponses,
        errors: jiraErrorResponses,
        getMockResponse: getJiraMockResponse
    },
    claude: {
        responses: claudeCLIResponses,
        errors: claudeErrorResponses,
        getMockResponse: getClaudeMockResponse
    }
};

/**
 * Test scenarios combining multiple services
 */
const testScenarios = {
    prAnalysisWorkflow: {
        ticketId: getTestTicketId(),
        prNumber: 123,
        githubData: getMockPRData(),
        jiraData: getMockJiraData(),
        claudeAnalysis: getMockClaudeResponse()
    },
    
    validationErrors: {
        missingTicket: {
            prTitle: 'Fix validation issue without ticket',
            expectedError: 'No Jira ticket found in PR title'
        },
        invalidTicket: {
            prTitle: 'INVALID-123: Fix something',
            expectedError: 'Ticket format does not match expected pattern'
        }
    },
    
    cliOperations: {
        githubPRFetch: {
            command: 'gh pr view 123 --json title,body,url',
            response: githubCLIResponses.prJSON(123)
        },
        jiraTicketFetch: {
            command: `jira issue view ${getTestTicketId()}`,
            response: jiraCLIResponses.issueView(getTestTicketId())
        },
        claudeAnalysis: {
            command: 'claude < analysis-prompt.txt',
            response: claudeCLIResponses.analyze()
        }
    }
};

module.exports = {
    // Shared utilities (primary exports)
    getTestTicketId,
    validateTestEnvironment,
    setupTestEnvironment,
    cleanupTestEnvironment,
    getTestTicketPatterns,
    
    // Organized mock data
    mockData,
    cliResponses,
    testScenarios,
    
    // Direct function exports for convenience
    getMockPRData,
    mockGitHubResponses,
    getMockJiraData,
    mockJiraResponses,
    getMockJiraPatterns,
    getMockClaudePrompt,
    getMockClaudeResponse,
    mockClaudeResponses,
    getMockPromptVariations,
    
    // CLI response functions
    getGitHubMockResponse,
    getJiraMockResponse,
    getClaudeMockResponse
};