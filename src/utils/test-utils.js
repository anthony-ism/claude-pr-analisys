/**
 * test-utils.js - Shared testing utilities and framework
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Common testing functionality for PR automation script tests
 */

const fs = require('fs');
const path = require('path');

// Import shared test utilities and mock data
const testHelpers = require('../testing/utils/test-helpers');
const { 
    getTestTicketId, 
    validateTestEnvironment 
} = testHelpers;
const sharedSetupEnvironment = testHelpers.setupTestEnvironment;
const sharedCleanupEnvironment = testHelpers.cleanupTestEnvironment;

const {
    mockData,
    cliResponses,
    testScenarios
} = require('../testing/mocks');

/**
 * Setup test environment with required environment variables
 * MUST be called before running any tests that use Jira functionality
 * Uses shared test environment setup with TEST prefix
 */
function setupTestEnvironment() {
    sharedSetupEnvironment({
        JIRA_TICKET_PREFIX: 'TEST',
        GITHUB_REPOSITORY: 'test-org/test-repo'
    });
}

/**
 * Cleanup test environment variables  
 * Uses shared cleanup function
 */
function cleanupTestEnvironment() {
    sharedCleanupEnvironment();
}

/**
 * Enhanced test runner with reporting capabilities
 */
class TestRunner {
    constructor(name = 'Test Suite') {
        this.name = name;
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.startTime = null;
        this.endTime = null;
        this.results = [];
    }
    
    /**
     * Add a test to the suite
     * @param {string} name - Test name
     * @param {Function} fn - Test function
     */
    test(name, fn) {
        this.tests.push({ name, fn });
    }
    
    /**
     * Run all tests in the suite
     * @returns {Promise<boolean>} True if all tests passed
     */
    async run() {
        console.log(`🧪 Running ${this.name}\n`);
        this.startTime = Date.now();
        
        for (const { name, fn } of this.tests) {
            const testStartTime = Date.now();
            try {
                await fn();
                const duration = Date.now() - testStartTime;
                console.log(`✅ ${name} (${duration}ms)`);
                this.passed++;
                this.results.push({ name, status: 'passed', duration, error: null });
            } catch (error) {
                const duration = Date.now() - testStartTime;
                console.log(`❌ ${name} (${duration}ms)`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
                this.results.push({ name, status: 'failed', duration, error: error.message });
            }
        }
        
        this.endTime = Date.now();
        this.generateReport();
        return this.failed === 0;
    }
    
    /**
     * Generate test report
     */
    generateReport() {
        const totalDuration = this.endTime - this.startTime;
        const total = this.passed + this.failed;
        
        console.log(`\n📊 ${this.name} Results:`);
        console.log(`   Tests: ${total}`);
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log(`   Duration: ${totalDuration}ms`);
        console.log(`   Success Rate: ${total > 0 ? Math.round((this.passed / total) * 100) : 0}%`);
        
        if (this.failed > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results
                .filter(r => r.status === 'failed')
                .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
        }
    }
    
    /**
     * Get test results for external reporting
     * @returns {Object} Test results summary
     */
    getResults() {
        return {
            name: this.name,
            total: this.passed + this.failed,
            passed: this.passed,
            failed: this.failed,
            duration: this.endTime - this.startTime,
            results: this.results
        };
    }
}

/**
 * Enhanced mock command executor for testing CLI integrations
 */
class MockExecutor {
    constructor() {
        this.calls = [];
        this.responses = new Map();
        this.regexResponses = new Map();
        this.defaultResponse = { stdout: 'mock response', stderr: '' };
        this.debug = false;
    }
    
    /**
     * Enable debug logging for troubleshooting
     * @param {boolean} enabled - Whether to enable debug logging
     */
    setDebug(enabled = true) {
        this.debug = enabled;
    }
    
    /**
     * Set response for a specific command pattern
     * @param {string} pattern - Command pattern to match (substring)
     * @param {Object|Error} response - Response object or Error to throw
     */
    setResponse(pattern, response) {
        this.responses.set(pattern, response);
    }
    
    /**
     * Set response for a regex command pattern
     * @param {RegExp} regex - Regex pattern to match
     * @param {Object|Error} response - Response object or Error to throw
     */
    setRegexResponse(regex, response) {
        this.regexResponses.set(regex, response);
    }
    
    /**
     * Clear all recorded calls
     */
    clearCalls() {
        this.calls = [];
    }
    
    /**
     * Clear all response patterns
     */
    clearResponses() {
        this.responses.clear();
        this.regexResponses.clear();
    }
    
    /**
     * Get all recorded command calls
     * @returns {string[]} Array of executed commands
     */
    getCalls() {
        return [...this.calls];
    }
    
    /**
     * Normalize command for better matching (remove redirections, extra spaces)
     * @param {string} command - Raw command string
     * @returns {string} Normalized command
     */
    normalizeCommand(command) {
        // Remove common redirections and normalize spaces
        return command
            .replace(/\s*>\s*\/dev\/null\s*2>&1/, '') // Remove > /dev/null 2>&1
            .replace(/\s*2>\/dev\/null/, '')          // Remove 2>/dev/null  
            .replace(/\s+/g, ' ')                     // Normalize spaces
            .trim();
    }
    
    /**
     * Execute a mocked command with enhanced pattern matching
     * @param {string} command - Command to execute
     * @returns {Promise} Promise resolving to mocked response
     */
    async execute(command) {
        this.calls.push(command);
        const normalizedCommand = this.normalizeCommand(command);
        
        if (this.debug) {
            console.log(`MockExecutor: Executing "${command}"`);
            console.log(`MockExecutor: Normalized "${normalizedCommand}"`);
        }
        
        // Try regex patterns first (more specific)
        for (const [regex, response] of this.regexResponses.entries()) {
            if (regex.test(normalizedCommand)) {
                if (this.debug) {
                    console.log(`MockExecutor: Matched regex ${regex.source}`);
                }
                if (response instanceof Error) {
                    throw response;
                }
                return response;
            }
        }
        
        // Try substring patterns
        for (const [pattern, response] of this.responses.entries()) {
            if (normalizedCommand.includes(pattern)) {
                if (this.debug) {
                    console.log(`MockExecutor: Matched pattern "${pattern}"`);
                }
                if (response instanceof Error) {
                    throw response;
                }
                return response;
            }
        }
        
        if (this.debug) {
            console.log(`MockExecutor: No match found, using default response`);
        }
        
        return this.defaultResponse;
    }
}

/**
 * Mock readline interface for testing user interactions
 */
class MockReadline {
    constructor() {
        this.responses = [];
        this.currentIndex = 0;
        this.debug = false;
    }
    
    /**
     * Enable debug logging
     * @param {boolean} enabled - Whether to enable debug logging
     */
    setDebug(enabled = true) {
        this.debug = enabled;
    }
    
    /**
     * Set responses for questions in order
     * @param {string[]} responses - Array of responses to return
     */
    setResponses(responses) {
        this.responses = responses;
        this.currentIndex = 0;
    }
    
    /**
     * Add a single response
     * @param {string} response - Response to add
     */
    addResponse(response) {
        this.responses.push(response);
    }
    
    /**
     * Clear all responses
     */
    clearResponses() {
        this.responses = [];
        this.currentIndex = 0;
    }
    
    /**
     * Create a mock readline interface
     * @param {Object} options - Interface options (ignored in mock)
     * @returns {Object} Mock readline interface
     */
    createInterface(options) {
        return {
            question: (questionText, callback) => {
                if (this.debug) {
                    console.log(`MockReadline: Question "${questionText}"`);
                }
                
                // Return next response or default 'y'
                const response = this.currentIndex < this.responses.length 
                    ? this.responses[this.currentIndex] 
                    : 'y';
                
                this.currentIndex++;
                
                if (this.debug) {
                    console.log(`MockReadline: Responding "${response}"`);
                }
                
                // Simulate async behavior
                setImmediate(() => callback(response));
            },
            close: () => {
                if (this.debug) {
                    console.log(`MockReadline: Interface closed`);
                }
            }
        };
    }
}

/**
 * Assert that a condition is true
 * @param {boolean} condition - Condition to check
 * @param {string} message - Error message if assertion fails
 */
function assert(condition, message = 'Assertion failed') {
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * Assert that an array contains an item
 * @param {Array} array - Array to search
 * @param {*} item - Item to find (uses includes for strings)
 * @param {string} message - Error message if assertion fails
 */
function assertContains(array, item, message) {
    const found = array.some(element => {
        if (typeof element === 'string' && typeof item === 'string') {
            return element.includes(item);
        }
        return element === item;
    });
    
    if (!found) {
        throw new Error(message || `Expected array to contain item: ${item}`);
    }
}

/**
 * Assert that a command was called
 * @param {string[]} calls - Array of command calls
 * @param {string} command - Command to check for
 * @param {string} message - Error message if assertion fails
 */
function assertCommandCalled(calls, command, message) {
    assertContains(calls, command, message || `Expected command to be called: ${command}`);
}

/**
 * Assert that a file exists
 * @param {string} filePath - Path to file
 * @param {string} message - Error message if assertion fails
 */
function assertFileExists(filePath, message) {
    try {
        const exists = fs.existsSync(filePath);
        assert(exists, message || `Expected file to exist: ${filePath}`);
    } catch (error) {
        throw new Error(message || `Error checking file existence: ${error.message}`);
    }
}

/**
 * Assert that two objects are equal (deep comparison for simple objects)
 * @param {*} actual - Actual value
 * @param {*} expected - Expected value
 * @param {string} message - Error message if assertion fails
 */
function assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

/**
 * Assert that a value is truthy
 * @param {*} value - Value to check
 * @param {string} message - Error message if assertion fails
 */
function assertTruthy(value, message) {
    assert(!!value, message || `Expected truthy value, got: ${value}`);
}

/**
 * Assert that a value is falsy
 * @param {*} value - Value to check
 * @param {string} message - Error message if assertion fails
 */
function assertFalsy(value, message) {
    assert(!value, message || `Expected falsy value, got: ${value}`);
}

/**
 * Assert that a function throws an error
 * @param {Function} fn - Function that should throw
 * @param {string} message - Error message if assertion fails
 * @returns {Promise<Error>} The thrown error
 */
async function assertThrows(fn, message) {
    try {
        await fn();
        throw new Error(message || 'Expected function to throw an error');
    } catch (error) {
        if (error.message === (message || 'Expected function to throw an error')) {
            throw error;
        }
        return error;
    }
}

/**
 * Create a temporary test file
 * @param {string} content - File content
 * @param {string} extension - File extension (default: .txt)
 * @returns {string} Path to created file
 */
function createTestFile(content, extension = '.txt') {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, `test-${Date.now()}${extension}`);
    fs.writeFileSync(filePath, content);
    return filePath;
}

/**
 * Clean up test files
 * @param {string[]} filePaths - Array of file paths to remove
 */
function cleanupTestFiles(filePaths) {
    filePaths.forEach(filePath => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.warn(`Warning: Could not clean up test file ${filePath}: ${error.message}`);
        }
    });
}

/**
 * Get mock PR data using shared mock system
 * @returns {Object} Mock PR data
 */
function getMockPRData() {
    return mockData.github.pr;
}

/**
 * Get mock Jira data using shared mock system  
 * @returns {Object} Mock Jira data
 */
function getMockJiraData() {
    return mockData.jira.data;
}

/**
 * Legacy mock data aliases for backward compatibility
 * @deprecated Use getMockPRData() and getMockJiraData() instead
 */
const mockPRData = mockData.github.pr;
const mockJiraData = mockData.jira.data;

/**
 * Create a test dependencies object for injection
 * @param {MockExecutor} mockExecutor - Mock executor instance
 * @param {MockReadline} mockReadline - Mock readline instance
 * @returns {Object} Dependencies object
 */
function createTestDependencies(mockExecutor, mockReadline) {
    return {
        execAsync: mockExecutor.execute.bind(mockExecutor),
        readline: mockReadline
    };
}

/**
 * Setup enhanced mocks with better patterns using shared CLI responses
 * @param {MockExecutor} mockExecutor - Mock executor to configure
 * @param {MockReadline} mockReadline - Mock readline to configure
 */
function setupEnhancedMocks(mockExecutor, mockReadline) {
    // Clear previous state
    mockExecutor.clearCalls();
    mockReadline.clearResponses();
    
    // Use shared CLI responses for consistent mocking
    const { github, jira, claude } = cliResponses;
    
    // GitHub CLI patterns
    mockExecutor.setRegexResponse(/^gh pr view \d+$/, github.responses.prView(123));
    mockExecutor.setRegexResponse(/^gh pr diff \d+$/, github.responses.prDiff(123));
    mockExecutor.setRegexResponse(/^gh pr view \d+ --json/, github.responses.prJSON(123));
    mockExecutor.setRegexResponse(/^gh pr comment \d+/, github.responses.prComment);
    mockExecutor.setRegexResponse(/^gh --version/, github.responses.version);
    
    // Jira CLI patterns
    const ticketId = getTestTicketId();
    mockExecutor.setRegexResponse(new RegExp(`^jira issue view ${ticketId.replace('-', '\\-')}$`), jira.responses.issueView(ticketId));
    mockExecutor.setRegexResponse(/^jira issue list/, jira.responses.issueList);
    mockExecutor.setRegexResponse(/^jira version/, jira.responses.version);
    
    // Claude CLI patterns
    mockExecutor.setRegexResponse(/^claude --version/, claude.responses.version);
    mockExecutor.setRegexResponse(/^claude/, claude.responses.analyze());
    
    // Utility commands
    mockExecutor.setRegexResponse(/^which \w+$/, { stdout: '/usr/bin/tool' });
    
    // Setup default readline responses
    mockReadline.setResponses(['y', 'yes', 'y']);
}

module.exports = {
    // Core testing classes
    TestRunner,
    MockExecutor,
    MockReadline,
    
    // Environment setup (uses shared functions)
    setupTestEnvironment,
    cleanupTestEnvironment,
    getTestTicketId,
    validateTestEnvironment,
    
    // Assertion functions
    assert,
    assertContains,
    assertCommandCalled,
    assertFileExists,
    assertEqual,
    assertTruthy,
    assertFalsy,
    assertThrows,
    
    // File utilities
    createTestFile,
    cleanupTestFiles,
    
    // Mock data (new shared system)
    getMockPRData,
    getMockJiraData,
    mockData,
    cliResponses,
    testScenarios,
    
    // Legacy aliases for compatibility
    mockPRData,
    mockJiraData,
    
    // Test helpers
    createTestDependencies,
    setupEnhancedMocks
};