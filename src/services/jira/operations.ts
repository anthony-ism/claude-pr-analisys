/**
 * Jira service operations
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { loadJiraConfig } from './config';

// Default async exec function
const defaultExecAsync = promisify(exec);

// Dependencies for testing
interface JiraDependencies {
  execAsync: typeof defaultExecAsync;
}

// Current dependencies (can be overridden for testing)
let deps: JiraDependencies = {
  execAsync: defaultExecAsync,
};

// Jira CLI error types
export enum JiraErrorType {
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  ISSUE_NOT_FOUND = 'ISSUE_NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Jira service error
export class JiraError extends Error {
  public readonly type: JiraErrorType;
  public readonly details?: any;

  constructor(type: JiraErrorType, message: string, details?: any) {
    super(message);
    this.name = 'JiraError';
    this.type = type;
    this.details = details;
  }
}

// Jira operation options
export interface JiraOperationOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Set dependencies for testing
 * @param newDeps New dependencies
 */
export function setDependencies(newDeps: Partial<JiraDependencies>): void {
  deps = { ...deps, ...newDeps };
}

/**
 * Reset dependencies to defaults
 */
export function resetDependencies(): void {
  deps = {
    execAsync: defaultExecAsync,
  };
}

/**
 * Execute Jira CLI command with error handling
 * @param command Command to execute
 * @param options Operation options
 * @returns Command result
 */
async function executeJiraCommand(
  command: string,
  options: JiraOperationOptions = {}
): Promise<{ stdout: string; stderr: string }> {
  const { timeout = 30000 } = options;

  try {
    const result = await deps.execAsync(command, { timeout });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error: any) {
    // Handle different types of errors
    if (error.code === 'ENOENT') {
      throw new JiraError(
        JiraErrorType.CLI_NOT_FOUND,
        'Jira CLI not found. Please install jira-cli',
        { command, originalError: error }
      );
    }

    if (error.signal === 'SIGTERM' || error.killed) {
      throw new JiraError(
        JiraErrorType.NETWORK_ERROR,
        `Jira CLI command timed out after ${timeout}ms`,
        { command, timeout }
      );
    }

    // Check stderr for specific error patterns
    const stderr = error.stderr || '';
    if (
      stderr.includes('Issue not found') ||
      stderr.includes('does not exist')
    ) {
      throw new JiraError(
        JiraErrorType.ISSUE_NOT_FOUND,
        'Jira issue not found',
        { command, stderr }
      );
    }

    if (stderr.includes('Project not found')) {
      throw new JiraError(
        JiraErrorType.PROJECT_NOT_FOUND,
        'Jira project not found',
        { command, stderr }
      );
    }

    if (stderr.includes('authentication') || stderr.includes('unauthorized')) {
      throw new JiraError(
        JiraErrorType.AUTHENTICATION_ERROR,
        'Jira authentication failed',
        { command, stderr }
      );
    }

    if (stderr.includes('rate limit')) {
      throw new JiraError(
        JiraErrorType.RATE_LIMIT_ERROR,
        'Jira API rate limit exceeded',
        { command, stderr }
      );
    }

    if (stderr.includes('permission denied') || stderr.includes('forbidden')) {
      throw new JiraError(
        JiraErrorType.PERMISSION_DENIED,
        'Jira permission denied',
        { command, stderr }
      );
    }

    if (stderr.includes('server error') || stderr.includes('internal error')) {
      throw new JiraError(JiraErrorType.SERVER_ERROR, 'Jira server error', {
        command,
        stderr,
      });
    }

    // Generic error
    throw new JiraError(
      JiraErrorType.UNKNOWN_ERROR,
      `Jira CLI command failed: ${error.message}`,
      { command, originalError: error }
    );
  }
}

/**
 * Check if Jira CLI is available and authenticated
 * @param options Operation options
 * @returns True if CLI is available and authenticated
 */
export async function checkJiraCLI(
  options: JiraOperationOptions = {}
): Promise<boolean> {
  try {
    await executeJiraCommand('jira me', options);
    return true;
  } catch (error) {
    if (
      error instanceof JiraError &&
      error.type === JiraErrorType.CLI_NOT_FOUND
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Extract Jira ticket ID from PR title
 * @param prTitle PR title
 * @returns Ticket ID or null if not found
 */
export function extractJiraTicket(prTitle: string): string | null {
  const config = loadJiraConfig();
  const match = prTitle.match(config.pattern);
  return match ? match[0] : null;
}

/**
 * Validate that a Jira ticket exists and is accessible
 * @param ticketId Ticket ID
 * @param options Operation options
 * @returns True if ticket is valid
 */
export async function validateJiraTicket(
  ticketId: string,
  options: JiraOperationOptions = {}
): Promise<boolean> {
  if (!ticketId || !ticketId.includes('-')) {
    return false;
  }

  try {
    await executeJiraCommand(
      `jira issue view ${ticketId} > /dev/null 2>&1`,
      options
    );
    return true;
  } catch (error) {
    if (
      error instanceof JiraError &&
      error.type === JiraErrorType.ISSUE_NOT_FOUND
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Gather Jira ticket data
 * @param ticketId Ticket ID
 * @param options Operation options
 * @returns Ticket data or null if error
 */
export async function gatherJiraData(
  ticketId: string,
  options: JiraOperationOptions = {}
): Promise<string | null> {
  try {
    const result = await executeJiraCommand(
      `jira issue view ${ticketId}`,
      options
    );
    return result.stdout;
  } catch (error) {
    if (error instanceof JiraError) {
      throw error;
    }
    throw new JiraError(
      JiraErrorType.UNKNOWN_ERROR,
      `Failed to gather Jira data: ${(error as Error).message}`,
      { ticketId, originalError: error }
    );
  }
}

/**
 * Get Jira configuration and validate environment
 * @returns Jira configuration with loaded and validated settings
 */
export function getJiraConfig() {
  return loadJiraConfig();
}

// Type guards
export function isJiraError(error: any): error is JiraError {
  return error instanceof JiraError;
}
