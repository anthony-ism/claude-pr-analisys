/**
 * Claude service exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Configuration and types
export {
  ClaudeConfig,
  loadClaudeConfig,
  validateClaudeEnvironment,
  getClaudeSetupInstructions,
} from './config';
export {
  ClaudeCommandResult,
  ClaudeAnalysisRequest,
  ClaudeAnalysisResponse,
  ClaudeVersionInfo,
  ClaudeError,
  ClaudeErrorType,
  ClaudeOperationOptions,
  ClaudePromptTemplate,
  ClaudePromptSection,
  ClaudeModel,
  ClaudeAnalysisMetadata,
  isClaudeError,
  isClaudeCommandResult,
} from './types';

// Operations
export {
  checkClaudeCLI,
  getClaudeVersion,
  createAnalysisFile,
  analyzeWithClaude,
  detectClaudeModel,
  setDependencies as setClaudeDependencies,
  resetDependencies as resetClaudeDependencies,
} from './operations';

// Mock responses (optional - only available in development builds)
let mockResponses: Record<string, unknown> | null = null;
let cliResponses: Record<string, string> | null = null;
let errorResponses: Record<string, string> | null = null;
let commandPatterns: Record<string, RegExp> | null = null;
let getMockResponse: ((command: string) => string | null) | null = null;
let generateAnalysis: ((prData: unknown, jiraData: unknown) => string) | null =
  null;
let getTestPrompts: (() => string[]) | null = null;
let getResponseScenarios: (() => Record<string, string>) | null = null;
let isValidCommand: ((command: string) => boolean) | null = null;

try {
  const mockModule = require('./mock-responses');
  cliResponses = mockModule.claudeCLIResponses;
  errorResponses = mockModule.claudeErrorResponses;
  commandPatterns = mockModule.claudeCommandPatterns;
  getMockResponse = mockModule.getClaudeMockResponse;
  generateAnalysis = mockModule.generateMockAnalysis;
  getTestPrompts = mockModule.getClaudeTestPrompts;
  getResponseScenarios = mockModule.getClaudeResponseScenarios;
  isValidCommand = mockModule.isValidClaudeCommand;

  mockResponses = {
    cliResponses,
    errorResponses,
    commandPatterns,
    getMockResponse,
    generateAnalysis,
    getTestPrompts,
    getResponseScenarios,
    isValidCommand,
  };
} catch (err) {
  // Mock responses not available in production build
}

export {
  mockResponses,
  cliResponses,
  errorResponses,
  commandPatterns,
  getMockResponse,
  generateAnalysis,
  getTestPrompts,
  getResponseScenarios,
  isValidCommand,
};
