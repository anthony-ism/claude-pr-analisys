#!/usr/bin/env node

/**
 * Minimal E2E Integration Test
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Minimal end-to-end testing using built JavaScript
 */

const path = require('path');
const fs = require('fs');

async function runMinimalE2ETest() {
  console.log('🚀 Starting Minimal E2E Integration Tests');
  console.log('=' .repeat(50));

  let passed = 0;
  let failed = 0;

  // Set test environment
  process.env.GITHUB_REPOSITORY = 'test-org/test-repo';
  process.env.JIRA_TICKET_PREFIX = 'COV';

  // Test 1: Environment configuration validation
  try {
    console.log('\n📋 Testing: Environment Configuration');
    const { loadEnvironmentConfig } = require('../../dist/core/environment');
    const config = loadEnvironmentConfig();
    
    if (!config.githubRepository || !config.jiraTicketPrefix) {
      throw new Error('Environment configuration failed to load required variables');
    }
    
    console.log('✅ Environment Configuration - PASSED');
    console.log('  ✓ GitHub Repository:', config.githubRepository);
    console.log('  ✓ Jira Prefix:', config.jiraTicketPrefix);
    passed++;
  } catch (error) {
    console.log('❌ Environment Configuration - FAILED');
    console.log('  Error:', error.message);
    failed++;
  }

  // Test 2: PR utilities functionality
  try {
    console.log('\n📋 Testing: PR Utilities');
    const { validatePRNumber } = require('../../dist/utils/pr-utils');
    
    const validTest = validatePRNumber('123');
    const invalidTest = validatePRNumber('abc');
    
    if (!validTest || invalidTest) {
      throw new Error('PR number validation not working correctly');
    }
    
    console.log('✅ PR Utilities - PASSED');
    console.log('  ✓ Valid PR number (123):', validTest);
    console.log('  ✓ Invalid PR number (abc):', invalidTest);
    passed++;
  } catch (error) {
    console.log('❌ PR Utilities - FAILED');
    console.log('  Error:', error.message);
    failed++;
  }

  // Test 3: Jira ticket extraction
  try {
    console.log('\n📋 Testing: Jira Ticket Extraction');
    const { extractJiraTicket } = require('../../dist/utils/pr-utils');
    
    const ticket = extractJiraTicket('COV-456: Add code coverage reporting to unit tests');
    
    if (ticket !== 'COV-456') {
      throw new Error(`Expected COV-456, got ${ticket}`);
    }
    
    console.log('✅ Jira Ticket Extraction - PASSED');
    console.log('  ✓ Extracted ticket:', ticket);
    passed++;
  } catch (error) {
    console.log('❌ Jira Ticket Extraction - FAILED');
    console.log('  Error:', error.message);
    failed++;
  }

  // Test 4: File system operations
  try {
    console.log('\n📋 Testing: File System Operations');
    
    // Check that temp directory can be created
    const tempDir = path.resolve(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    if (!fs.existsSync(tempDir)) {
      throw new Error('Failed to create temp directory');
    }
    
    console.log('✅ File System Operations - PASSED');
    console.log('  ✓ Temp directory created/verified:', tempDir);
    passed++;
  } catch (error) {
    console.log('❌ File System Operations - FAILED');
    console.log('  Error:', error.message);
    failed++;
  }

  // Test 5: Code coverage workflow scenario validation
  try {
    console.log('\n📋 Testing: Code Coverage Workflow Scenario');
    
    // Test the workflow scenario - extract ticket from PR title that contains code coverage
    const prTitle = 'COV-456: Add code coverage reporting to unit tests';
    const { extractJiraTicket } = require('../../dist/utils/pr-utils');
    const ticket = extractJiraTicket(prTitle);
    
    if (!ticket || !ticket.startsWith('COV-')) {
      throw new Error('Code coverage workflow ticket extraction failed');
    }
    
    // Validate scenario components
    const scenarioValid = 
      prTitle.toLowerCase().includes('code coverage') &&
      prTitle.toLowerCase().includes('unit tests') &&
      ticket === 'COV-456';
    
    if (!scenarioValid) {
      throw new Error('Code coverage scenario validation failed');
    }
    
    console.log('✅ Code Coverage Workflow Scenario - PASSED');
    console.log('  ✓ PR Title:', prTitle);
    console.log('  ✓ Extracted Ticket:', ticket);
    console.log('  ✓ Scenario validated for code coverage feature');
    passed++;
  } catch (error) {
    console.log('❌ Code Coverage Workflow Scenario - FAILED');
    console.log('  Error:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 E2E Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All E2E tests passed! The application is ready for use.');
    console.log('\n📋 Next Steps:');
    console.log('  1. Set up proper Jira credentials (JIRA_SERVER_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN)');
    console.log('  2. Create test pull requests with Jira ticket references');
    console.log('  3. Test the complete analyze-pr workflow');
    console.log('  4. Implement the code coverage feature following the E2E scenario');
    
    return true;
  } else {
    console.log('\n❌ Some E2E tests failed. Please review the errors above.');
    return false;
  }
}

// Main execution
if (require.main === module) {
  runMinimalE2ETest().then(passed => {
    process.exit(passed ? 0 : 1);
  }).catch(error => {
    console.error('E2E Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runMinimalE2ETest };