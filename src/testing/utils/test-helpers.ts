/**
 * Shared test utilities and helpers
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

/**
 * Get test ticket ID for consistent testing across all services
 * Uses environment variable to ensure consistency
 * @returns {string} Test ticket ID in format PREFIX-2055
 */
function getTestTicketId() {
  if (!process.env.JIRA_TICKET_PREFIX) {
    throw new Error(
      'Test environment not properly set up. JIRA_TICKET_PREFIX must be set.'
    );
  }
  return `${process.env.JIRA_TICKET_PREFIX}-2055`;
}

/**
 * Validate that required environment variables are set for testing
 * @param {string[]} requiredVars - Array of required environment variable names
 * @throws {Error} If any required variables are missing
 */
function validateTestEnvironment(requiredVars = ['JIRA_TICKET_PREFIX']) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(
      `Test environment missing required variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Setup test environment with required variables
 * @param {Object} testConfig - Configuration object with environment variables
 */
function setupTestEnvironment(testConfig = {}) {
  const defaults = {
    JIRA_TICKET_PREFIX: 'TEST',
    GITHUB_REPOSITORY: 'test-user/test-repo',
  };

  Object.entries({ ...defaults, ...testConfig }).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

/**
 * Cleanup test environment by removing test-specific variables
 * @param {string[]} varsToClean - Array of variable names to remove
 */
function cleanupTestEnvironment(
  varsToClean = ['JIRA_TICKET_PREFIX', 'GITHUB_REPOSITORY']
) {
  varsToClean.forEach(varName => {
    delete process.env[varName];
  });
}

/**
 * Generate test ticket patterns for validation testing
 * @returns {Object} Object with valid and invalid ticket patterns
 */
function getTestTicketPatterns() {
  const prefix = process.env.JIRA_TICKET_PREFIX || 'TEST';
  return {
    valid: [`${prefix}-1234`, `${prefix}-2055`, `${prefix}-9999`],
    invalid: ['INVALID-123', 'not-a-ticket', '123-INVALID', 'lowercase-123'],
  };
}

export {
  getTestTicketId,
  validateTestEnvironment,
  setupTestEnvironment,
  cleanupTestEnvironment,
  getTestTicketPatterns,
};
