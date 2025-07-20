/**
 * Claude service types
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Claude CLI command result
export interface ClaudeCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Claude analysis request
export interface ClaudeAnalysisRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Claude analysis response
export interface ClaudeAnalysisResponse {
  content: string;
  model: string;
  timestamp: Date;
  tokensUsed?: number;
}

// Claude CLI version information
export interface ClaudeVersionInfo {
  version: string;
  cliPath: string;
  availableModels: string[];
}

// Claude CLI error types
export enum ClaudeErrorType {
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Claude service error
export class ClaudeError extends Error {
  public readonly type: ClaudeErrorType;
  public readonly details?: any;

  constructor(type: ClaudeErrorType, message: string, details?: any) {
    super(message);
    this.name = 'ClaudeError';
    this.type = type;
    this.details = details;
  }
}

// Claude CLI operation options
export interface ClaudeOperationOptions {
  timeout?: number;
  model?: string;
  maxRetries?: number;
  retryDelay?: number;
}

// Claude prompt template
export interface ClaudePromptTemplate {
  title: string;
  sections: ClaudePromptSection[];
  footer?: string;
}

// Claude prompt section
export interface ClaudePromptSection {
  title: string;
  content: string;
  required: boolean;
}

// Claude model information
export interface ClaudeModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  capabilities: string[];
}

// Claude analysis metadata
export interface ClaudeAnalysisMetadata {
  prNumber: string;
  ticketId: string;
  timestamp: Date;
  model: string;
  promptLength: number;
  responseLength: number;
  confidence?: number;
}

// Type guards
export function isClaudeError(error: any): error is ClaudeError {
  return error instanceof ClaudeError;
}

export function isClaudeCommandResult(
  result: any
): result is ClaudeCommandResult {
  return (
    typeof result === 'object' &&
    typeof result.stdout === 'string' &&
    typeof result.stderr === 'string' &&
    typeof result.exitCode === 'number'
  );
}
