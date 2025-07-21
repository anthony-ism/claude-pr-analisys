/**
 * GitHub service exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Configuration and types
export {
  GitHubConfig,
  loadGitHubConfig,
  validateGitHubEnvironment,
  getGitHubSetupInstructions,
} from './config';

// Operations
export {
  GitHubError,
  GitHubErrorType,
  GitHubPRData,
  GitHubOperationOptions,
  checkGitHubCLI,
  validatePRNumber,
  validatePR,
  gatherPRData,
  postPRComment,
  setDependencies as setGitHubDependencies,
  resetDependencies as resetGitHubDependencies,
  isGitHubError,
} from './operations';

// Mock responses (optional - only available in development builds)
let mockResponses: Record<string, unknown> | null = null;
let cliResponses: Record<string, string> | null = null;
let errorResponses: Record<string, string> | null = null;
let commandPatterns: Record<string, RegExp> | null = null;
let getMockResponse: ((_command: string) => string | null) | null = null;

try {
  const mockModule = require('./mock-responses');
  cliResponses = mockModule.githubCLIResponses;
  errorResponses = mockModule.githubErrorResponses;
  commandPatterns = mockModule.githubCommandPatterns;
  getMockResponse = mockModule.getGitHubMockResponse;

  mockResponses = {
    cliResponses,
    errorResponses,
    commandPatterns,
    getMockResponse,
  };
} catch (_err) {
  // Mock responses not available in production build
}

export {
  mockResponses,
  cliResponses,
  errorResponses,
  commandPatterns,
  getMockResponse,
};
