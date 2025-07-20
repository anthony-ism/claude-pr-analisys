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

// Mock responses (legacy support)
const {
  claudeCLIResponses,
  claudeErrorResponses,
  claudeCommandPatterns,
  getClaudeMockResponse,
  generateMockAnalysis,
  getClaudeTestPrompts,
  getClaudeResponseScenarios,
  isValidClaudeCommand,
} = require('./mock-responses');

export const mockResponses = {
  cliResponses: claudeCLIResponses,
  errorResponses: claudeErrorResponses,
  commandPatterns: claudeCommandPatterns,
  getMockResponse: getClaudeMockResponse,
  generateAnalysis: generateMockAnalysis,
  getTestPrompts: getClaudeTestPrompts,
  getResponseScenarios: getClaudeResponseScenarios,
  isValidCommand: isValidClaudeCommand,
};

// Legacy exports for backward compatibility
export const cliResponses = claudeCLIResponses;
export const errorResponses = claudeErrorResponses;
export const commandPatterns = claudeCommandPatterns;
export const getMockResponse = getClaudeMockResponse;
export const generateAnalysis = generateMockAnalysis;
export const getTestPrompts = getClaudeTestPrompts;
export const getResponseScenarios = getClaudeResponseScenarios;
export const isValidCommand = isValidClaudeCommand;
