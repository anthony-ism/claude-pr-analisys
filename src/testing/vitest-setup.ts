/**
 * Vitest Global Setup
 * Author: Anthony Rizzo, Co-pilot: Claude  
 * Description: Global setup for Vitest test environment
 */

export async function setup() {
  // Set up environment variables for tests
  process.env.JIRA_TICKET_PREFIX = 'TEST';
  process.env.GITHUB_REPOSITORY = 'test-org/test-repo';
  
  // Additional test environment setup
  console.log('🧪 Test environment initialized');
}

export async function teardown() {
  // Cleanup after all tests
  console.log('🧹 Test environment cleaned up');
}