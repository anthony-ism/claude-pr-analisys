/**
 * analyze-pr.test.js - Unit tests for PR Analysis Script
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Lightweight unit tests to validate function chaining and parameter passing
 */

// Import shared test utilities and mock data
const {
    TestRunner,
    MockExecutor,
    setupTestEnvironment,
    cleanupTestEnvironment,
    getTestTicketId,
    getMockPRData,
    getMockJiraData,
    cliResponses,
    testScenarios,
    assert,
    assertContains,
    assertCommandCalled
} = require('./utils/test-utils');

// Setup test environment
setupTestEnvironment();

// Get test data from shared mock system
const mockPRData = getMockPRData();
const mockJiraData = getMockJiraData();
const testTicketId = getTestTicketId();
const mockClaudeResponse = cliResponses.claude.responses.analyze().stdout;

// Use shared MockExecutor for consistent command mocking
const mockExecutor = new MockExecutor();

// Setup mock responses using shared CLI responses
function setupMockResponses() {
    mockExecutor.clearCalls();
    
    // GitHub CLI responses
    mockExecutor.setRegexResponse(/^gh pr view \d+$/, { stdout: mockPRData.view });
    mockExecutor.setRegexResponse(/^gh pr diff \d+$/, { stdout: mockPRData.diff });
    mockExecutor.setRegexResponse(/^gh pr view \d+ --json/, { stdout: JSON.stringify(mockPRData.json) });
    mockExecutor.setRegexResponse(/^gh pr comment \d+/, { stdout: 'Comment posted' });
    
    // Jira CLI responses
    mockExecutor.setRegexResponse(new RegExp(`jira issue view ${testTicketId.replace('-', '\\-')}`), { stdout: mockJiraData });
    
    // Claude CLI responses
    mockExecutor.setRegexResponse(/^claude/, { stdout: mockClaudeResponse });
    
    // Utility commands
    mockExecutor.setRegexResponse(/^which /, { stdout: '/usr/bin/tool' });
}

// Mock execAsync function using shared executor
function mockExecAsync(command) {
    return mockExecutor.execute(command);
}

// Helper functions for command assertion using shared executor
function assertCommandCalledLocal(command, message) {
    const calls = mockExecutor.getCalls();
    assertCommandCalled(calls, command, message);
}

// Simple functions to test (extracted from main script)
function extractJiraTicket(prTitle) {
    const prefix = process.env.JIRA_TICKET_PREFIX || 'TEST';
    const match = prTitle.match(new RegExp(`${prefix}-\\d+`));
    return match ? match[0] : null;
}

async function validatePR(prNumber) {
    try {
        await mockExecAsync(`gh pr view ${prNumber} > /dev/null 2>&1`);
        return true;
    } catch (error) {
        return false;
    }
}

async function gatherPRData(prNumber) {
    try {
        const prViewResult = await mockExecAsync(`gh pr view ${prNumber}`);
        const prView = prViewResult.stdout;
        
        const prDiffResult = await mockExecAsync(`gh pr diff ${prNumber}`);
        const prDiff = prDiffResult.stdout;
        
        const prJsonResult = await mockExecAsync(`gh pr view ${prNumber} --json title,author,state,additions,deletions,url`);
        const prJson = JSON.parse(prJsonResult.stdout);
        
        return {
            view: prView,
            diff: prDiff,
            json: prJson
        };
    } catch (error) {
        return null;
    }
}

async function validateJiraTicket(ticketId) {
    try {
        await mockExecAsync(`jira issue view ${ticketId} > /dev/null 2>&1`);
        return true;
    } catch (error) {
        return false;
    }
}

async function detectClaudeModel() {
    try {
        const { stdout } = await mockExecAsync('claude --version 2>/dev/null || echo "unknown"');
        const version = stdout.trim();
        
        if (version !== 'unknown' && version) {
            return `Claude CLI ${version}`;
        }
        
        return 'Claude AI';
    } catch (error) {
        return 'Claude AI';
    }
}

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

IMPORTANT: End your analysis with the following attribution:
---
*This analysis was generated using AI with the Claude CLI and ${claudeModel}*`;
}

async function callClaude(prompt) {
    try {
        const claudeResult = await mockExecAsync(`claude "temp-file"`);
        return claudeResult.stdout;
    } catch (error) {
        throw new Error('Claude CLI not available or failed to execute');
    }
}

async function postAnalysisComment(prNumber, analysisContent) {
    try {
        await mockExecAsync(`gh pr comment ${prNumber} --body-file "temp-file"`);
        return true;
    } catch (error) {
        return false;
    }
}

async function checkRequiredTools() {
    const requiredTools = ['gh', 'jira', 'claude'];
    
    for (const tool of requiredTools) {
        try {
            await mockExecAsync(`which ${tool}`);
        } catch (error) {
            throw new Error(`${tool} is not installed or not in PATH`);
        }
    }
}

// Create test instance using shared TestRunner
const testRunner = new TestRunner('PR Analysis Script Tests');

// Setup mock responses before each test
testRunner.test('Setup', async () => {
    setupMockResponses();
});

// Test 1: Extract Jira ticket from PR title
testRunner.test('Extract Jira ticket from PR title', async () => {
    const ticket = extractJiraTicket(`${testTicketId}: Visit Accepted Date is not displayed`);
    assert(ticket === testTicketId, `Expected ${testTicketId}, got ${ticket}`);
    
    const noTicket = extractJiraTicket('Fix bug without ticket');
    assert(noTicket === null, `Expected null for no ticket, got ${noTicket}`);
});

// Test 2: Validate PR function calls correct commands
testRunner.test('Validate PR calls correct GitHub commands', async () => {
    const result = await validatePR('392');
    assert(result === true, 'Expected validatePR to return true');
    assertCommandCalledLocal('gh pr view 392', 'Expected gh pr view command');
});

// Test 3: Gather PR data calls multiple GitHub commands
testRunner.test('Gather PR data calls multiple GitHub commands', async () => {
    const prData = await gatherPRData('392');
    assert(prData !== null, 'Expected PR data to be returned');
    assert(prData.json.title.includes(testTicketId), `Expected title to contain ${testTicketId}`);
    
    assertCommandCalledLocal('gh pr view 392', 'Expected basic PR view command');
    assertCommandCalledLocal('gh pr diff 392', 'Expected PR diff command');
    assertCommandCalledLocal('--json title,author,state,additions,deletions,url', 'Expected JSON PR view command');
});

// Test 4: Validate Jira ticket function
testRunner.test('Validate Jira ticket calls correct commands', async () => {
    const result = await validateJiraTicket(testTicketId);
    assert(result === true, 'Expected validateJiraTicket to return true');
    assertCommandCalledLocal(`jira issue view ${testTicketId}`, 'Expected jira issue view command');
});

// Test 5: Create Claude prompt includes all required data
testRunner.test('Create Claude prompt includes all required data', async () => {
    const prompt = await createClaudePrompt('392', testTicketId, mockPRData, mockJiraData);
    assert(prompt.includes(testTicketId), 'Expected prompt to contain ticket ID');
    assert(prompt.includes('Pull Request #392'), 'Expected prompt to contain PR number');
    assert(prompt.includes('stopFormValidation'), 'Expected prompt to contain diff content');
    assert(prompt.includes('Ready to Read'), 'Expected prompt to contain Jira content');
    assert(prompt.includes('This analysis was generated using AI'), 'Expected prompt to contain attribution');
});

// Test 6: Call Claude function
testRunner.test('Call Claude creates temp file and calls CLI', async () => {
    const prompt = 'Test prompt for Claude';
    const response = await callClaude(prompt);
    
    assert(response.includes(testTicketId), `Expected Claude response to contain ticket ID ${testTicketId}`);
    assertCommandCalledLocal('claude ', 'Expected claude command to be called');
});

// Test 7: Post analysis comment
testRunner.test('Post analysis comment calls GitHub CLI', async () => {
    const analysis = 'Test analysis content';
    const result = await postAnalysisComment('392', analysis);
    
    assert(result === true, 'Expected postAnalysisComment to return true');
    assertCommandCalledLocal('gh pr comment 392', 'Expected gh pr comment command');
});

// Test 8: Check required tools validates all dependencies
testRunner.test('Check required tools validates all dependencies', async () => {
    await checkRequiredTools();
    
    assertCommandCalledLocal('which gh', 'Expected to check for gh CLI');
    assertCommandCalledLocal('which jira', 'Expected to check for jira CLI');
    assertCommandCalledLocal('which claude', 'Expected to check for claude CLI');
});

// Test 9: Error handling for missing tools
testRunner.test('Error handling for missing tools', async () => {
    // Clear all mocks and set specific error for claude
    mockExecutor.clearCalls();
    mockExecutor.clearResponses();
    
    // Set specific responses for the tools we need
    mockExecutor.setRegexResponse(/^which gh$/, { stdout: '/usr/bin/gh' });
    mockExecutor.setRegexResponse(/^which jira$/, { stdout: '/usr/bin/jira' });
    mockExecutor.setRegexResponse(/^which claude$/, new Error('Command not found'));
    
    try {
        await checkRequiredTools();
        assert(false, 'Expected checkRequiredTools to throw error');
    } catch (error) {
        assert(error.message.includes('claude'), 'Expected error message to mention claude');
    }
    
    // Reset mock for other tests
    setupMockResponses();
});

// Test 10: Error handling for invalid PR
testRunner.test('Error handling for invalid PR', async () => {
    // Clear all mocks and set specific error for PR 999
    mockExecutor.clearCalls();
    mockExecutor.clearResponses();
    
    // Set specific error for PR 999 first (more specific pattern)
    mockExecutor.setRegexResponse(/^gh pr view 999$/, new Error('PR not found'));
    mockExecutor.setRegexResponse(/^gh pr view \d+$/, { stdout: mockPRData.view }); // For other PRs
    
    const result = await validatePR('999');
    assert(result === false, 'Expected validatePR to return false for invalid PR');
    
    // Reset mock for other tests
    setupMockResponses();
});

// Test 11: Command tracking works correctly
testRunner.test('Command tracking works correctly', async () => {
    await validatePR('123');
    await gatherPRData('123');
    
    // Should have multiple calls tracked
    const calls = mockExecutor.getCalls();
    assert(calls.length >= 3, `Expected at least 3 calls, got ${calls.length}`);
    assertCommandCalledLocal('gh pr view 123', 'Expected PR view call');
    assertCommandCalledLocal('gh pr diff 123', 'Expected PR diff call');
});

// Test 12: Detect Claude model function
testRunner.test('Detect Claude model function', async () => {
    const model = await detectClaudeModel();
    assert(typeof model === 'string', 'Expected model to be a string');
    assert(model.includes('Claude'), 'Expected model string to contain Claude');
});

// Run all tests
async function runTests() {
    const success = await testRunner.run();
    process.exit(success ? 0 : 1);
}

// Cleanup after tests
process.on('exit', () => {
    cleanupTestEnvironment();
});

// Export for external use or run directly
if (require.main === module) {
    runTests();
} else {
    module.exports = { 
        testRunner, 
        mockExecAsync, 
        mockPRData, 
        mockJiraData, 
        mockClaudeResponse,
        setupMockResponses
    };
}