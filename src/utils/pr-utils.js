/**
 * pr-utils.js - Shared utilities for PR automation scripts
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Common functionality for GitHub PR and Jira integration
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Default dependencies for production use
const defaultDeps = {
    execAsync: promisify(exec),
    readline: readline
};

// Current dependencies (can be overridden for testing)
let deps = { ...defaultDeps };

// Jira configuration cache
let jiraConfig = null;

/**
 * Load Jira configuration from environment variables
 * @returns {Object} Jira configuration object
 */
function loadJiraConfig() {
    if (jiraConfig) {
        return jiraConfig;
    }
    
    const prefix = process.env.JIRA_TICKET_PREFIX;
    if (!prefix) {
        printStatus('red', '❌ FATAL ERROR: JIRA_TICKET_PREFIX environment variable is required');
        printStatus('yellow', 'Please set the environment variable:');
        printStatus('yellow', '  export JIRA_TICKET_PREFIX=YOUR_PROJECT_PREFIX');
        printStatus('yellow', 'Examples:');
        printStatus('yellow', '  export JIRA_TICKET_PREFIX=RIZDEV');
        printStatus('yellow', '  export JIRA_TICKET_PREFIX=PROJ');
        printStatus('yellow', '  export JIRA_TICKET_PREFIX=TEAM');
        process.exit(1);
    }
    
    const customPattern = process.env.JIRA_TICKET_PATTERN;
    const pattern = customPattern 
        ? new RegExp(customPattern)
        : new RegExp(`${prefix}-\\d+`);
    
    jiraConfig = {
        prefix,
        pattern,
        example: `${prefix}-1234`
    };
    
    return jiraConfig;
}

/**
 * Set dependencies for testing (dependency injection)
 * @param {Object} newDeps - Object with execAsync and readline overrides
 */
function setDependencies(newDeps) {
    deps = { ...defaultDeps, ...newDeps };
}

/**
 * Reset dependencies to defaults (for cleanup after testing)
 */
function resetDependencies() {
    deps = { ...defaultDeps };
}

// Color codes for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

/**
 * Print colored status message to console
 * @param {string} color - Color name (red, green, yellow, blue)
 * @param {string} message - Message to display
 */
function printStatus(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Validate PR number format
 * @param {string} prNumber - PR number to validate
 * @returns {boolean} True if valid numeric PR number
 */
function validatePRNumber(prNumber) {
    return /^\d+$/.test(prNumber);
}

/**
 * Validate that a PR exists and is accessible
 * @param {string} prNumber - GitHub PR number
 * @returns {Promise<boolean>} True if PR is valid and accessible
 */
async function validatePR(prNumber) {
    printStatus('yellow', `Validating PR #${prNumber}...`);
    
    try {
        await deps.execAsync(`gh pr view ${prNumber} > /dev/null 2>&1`);
        printStatus('green', `PR #${prNumber} found and accessible`);
        return true;
    } catch (error) {
        printStatus('red', `Error: PR #${prNumber} not found or not accessible`);
        return false;
    }
}

/**
 * Gather comprehensive PR data from GitHub
 * @param {string} prNumber - GitHub PR number
 * @returns {Promise<Object|null>} PR data object with view, diff, and json properties
 */
async function gatherPRData(prNumber) {
    printStatus('yellow', 'Gathering PR data...');
    
    try {
        // Get PR basic info
        const prViewResult = await deps.execAsync(`gh pr view ${prNumber}`);
        const prView = prViewResult.stdout;
        
        // Get PR diff
        const prDiffResult = await deps.execAsync(`gh pr diff ${prNumber}`);
        const prDiff = prDiffResult.stdout;
        
        // Get PR JSON data for structured info
        const prJsonResult = await deps.execAsync(`gh pr view ${prNumber} --json title,author,state,additions,deletions,url`);
        const prJson = JSON.parse(prJsonResult.stdout);
        
        return {
            view: prView,
            diff: prDiff,
            json: prJson
        };
    } catch (error) {
        printStatus('red', `Error gathering PR data: ${error.message}`);
        return null;
    }
}

/**
 * Ensure temp directory exists in current working directory
 * @returns {string} Path to temp directory
 */
function ensureTempDir() {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
}

/**
 * Create a timestamped file in temp directory
 * @param {string} prefix - File prefix (e.g., 'claude-prompt')
 * @param {string} extension - File extension (e.g., '.txt')
 * @param {string} content - File content
 * @returns {string} Full path to created file
 */
function createTimestampedFile(prefix, extension, content) {
    const tempDir = ensureTempDir();
    const filename = `${prefix}-${Date.now()}${extension}`;
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
}

/**
 * Validate that a file exists and is readable
 * @param {string} filePath - Path to file to validate
 * @returns {Promise<boolean>} True if file exists and is readable
 */
async function validateFile(filePath) {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
        const stats = await fs.promises.stat(filePath);
        return stats.isFile() && stats.size > 0;
    } catch (error) {
        return false;
    }
}

/**
 * Check that required CLI tools are installed and accessible
 * @param {string[]} toolList - Array of tool names to check
 * @returns {Promise<void>} Throws error if any tool is missing
 */
async function checkRequiredTools(toolList) {
    for (const tool of toolList) {
        try {
            await deps.execAsync(`which ${tool}`);
        } catch (error) {
            printStatus('red', `Error: ${tool} is not installed or not in PATH`);
            printStatus('yellow', `Please install ${tool} and ensure it's authenticated`);
            throw new Error(`${tool} is not installed or not in PATH`);
        }
    }
    
    printStatus('green', 'All required tools found and available');
}

/**
 * Get user input from command line
 * @param {string} question - Question to ask user
 * @returns {Promise<string>} User's response
 */
function getUserInput(question) {
    return new Promise((resolve) => {
        const rl = deps.readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

/**
 * Get user confirmation (y/n)
 * @param {string} question - Question to ask user
 * @returns {Promise<boolean>} True if user confirms
 */
function getUserConfirmation(question) {
    return new Promise((resolve) => {
        const rl = deps.readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

/**
 * Extract Jira ticket ID from PR title
 * @param {string} prTitle - GitHub PR title
 * @returns {string|null} Jira ticket ID or null if not found
 */
function extractJiraTicket(prTitle) {
    const config = loadJiraConfig();
    const match = prTitle.match(config.pattern);
    return match ? match[0] : null;
}

/**
 * Validate that a Jira ticket exists and is accessible
 * @param {string} ticketId - Jira ticket ID (e.g., RIZDEV-2055)
 * @returns {Promise<boolean>} True if ticket is valid and accessible
 */
async function validateJiraTicket(ticketId) {
    printStatus('yellow', `Validating Jira ticket ${ticketId}...`);
    
    try {
        await deps.execAsync(`jira issue view ${ticketId} > /dev/null 2>&1`);
        printStatus('green', `Jira ticket ${ticketId} found and accessible`);
        return true;
    } catch (error) {
        printStatus('red', `Error: Jira ticket ${ticketId} not found or not accessible`);
        return false;
    }
}

/**
 * Gather Jira ticket data
 * @param {string} ticketId - Jira ticket ID
 * @returns {Promise<string|null>} Jira ticket content or null if error
 */
async function gatherJiraData(ticketId) {
    printStatus('yellow', 'Gathering Jira ticket data...');
    
    try {
        const jiraResult = await deps.execAsync(`jira issue view ${ticketId}`);
        return jiraResult.stdout;
    } catch (error) {
        printStatus('red', `Error gathering Jira data: ${error.message}`);
        return null;
    }
}

/**
 * Detect Claude CLI version and model information
 * @returns {Promise<string>} Claude model identification string
 */
async function detectClaudeModel() {
    try {
        // Try to get Claude model info
        const { stdout } = await deps.execAsync('claude --version 2>/dev/null || echo "unknown"');
        const version = stdout.trim();
        
        if (version !== 'unknown' && version) {
            return `Claude CLI ${version}`;
        }
        
        // Alternative: check if we can get model info from claude config
        try {
            const { stdout: configOut } = await deps.execAsync('claude config get model 2>/dev/null || echo "unknown"');
            const model = configOut.trim();
            if (model !== 'unknown' && model) {
                return `Claude ${model}`;
            }
        } catch (error) {
            // Ignore config errors
        }
        
        return 'Claude AI';
    } catch (error) {
        return 'Claude AI';
    }
}

/**
 * Post a comment to a GitHub PR using a file
 * @param {string} prNumber - GitHub PR number
 * @param {string} filePath - Path to file containing comment content
 * @returns {Promise<boolean>} True if comment posted successfully
 */
async function postPRComment(prNumber, filePath) {
    printStatus('yellow', `Posting comment to PR #${prNumber}...`);
    
    try {
        await deps.execAsync(`gh pr comment ${prNumber} --body-file "${filePath}"`);
        printStatus('green', `Comment posted successfully to PR #${prNumber}`);
        return true;
    } catch (error) {
        printStatus('red', `Error posting comment: ${error.message}`);
        return false;
    }
}

module.exports = {
    // Console utilities
    colors,
    printStatus,
    
    // Validation utilities
    validatePRNumber,
    validatePR,
    validateFile,
    
    // GitHub utilities
    gatherPRData,
    postPRComment,
    
    // File utilities
    ensureTempDir,
    createTimestampedFile,
    
    // Tool utilities
    checkRequiredTools,
    
    // User interaction utilities
    getUserInput,
    getUserConfirmation,
    
    // Jira utilities
    loadJiraConfig,
    extractJiraTicket,
    validateJiraTicket,
    gatherJiraData,
    
    // Claude utilities
    detectClaudeModel,
    
    // Testing utilities (dependency injection)
    setDependencies,
    resetDependencies
};