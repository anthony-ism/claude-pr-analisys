/**
 * GitHub service operations
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { ErrorDetails } from '../../core/errors';

// Default async exec function
const defaultExecAsync = promisify(exec);

// Dependencies for testing
interface GitHubDependencies {
  execAsync: typeof defaultExecAsync;
}

// Current dependencies (can be overridden for testing)
let deps: GitHubDependencies = {
  execAsync: defaultExecAsync,
};

// GitHub CLI error types
export enum GitHubErrorType {
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PR_NOT_FOUND = 'PR_NOT_FOUND',
  REPOSITORY_NOT_FOUND = 'REPOSITORY_NOT_FOUND',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// GitHub service error
export class GitHubError extends Error {
  public readonly type: GitHubErrorType;
  public readonly details?: ErrorDetails;

  constructor(type: GitHubErrorType, message: string, details?: ErrorDetails) {
    super(message);
    this.name = 'GitHubError';
    this.type = type;
    this.details = details;
  }
}

// GitHub PR data interface
export interface GitHubPRData {
  view: string;
  diff: string;
  json: {
    title: string;
    author: { login: string };
    state: string;
    additions: number;
    deletions: number;
    url: string;
  };
}

// GitHub operation options
export interface GitHubOperationOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Set dependencies for testing
 * @param newDeps New dependencies
 */
export function setDependencies(newDeps: Partial<GitHubDependencies>): void {
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
 * Execute GitHub CLI command with error handling
 * @param command Command to execute
 * @param options Operation options
 * @returns Command result
 */
async function executeGitHubCommand(
  command: string,
  options: GitHubOperationOptions = {}
): Promise<{ stdout: string; stderr: string }> {
  const { timeout = 30000 } = options;

  try {
    const result = await deps.execAsync(command, { timeout });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error: unknown) {
    // Handle different types of errors
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      throw new GitHubError(
        GitHubErrorType.CLI_NOT_FOUND,
        'GitHub CLI (gh) not found. Please install GitHub CLI',
        { command, originalError: error }
      );
    }

    if (
      error &&
      typeof error === 'object' &&
      (('signal' in error && error.signal === 'SIGTERM') ||
        ('killed' in error && error.killed))
    ) {
      throw new GitHubError(
        GitHubErrorType.NETWORK_ERROR,
        `GitHub CLI command timed out after ${timeout}ms`,
        { command, timeout }
      );
    }

    // Check stderr for specific error patterns
    const stderr =
      error &&
      typeof error === 'object' &&
      'stderr' in error &&
      typeof error.stderr === 'string'
        ? error.stderr
        : '';
    if (stderr.includes('Not Found') || stderr.includes('could not resolve')) {
      if (command.includes('pr view')) {
        throw new GitHubError(
          GitHubErrorType.PR_NOT_FOUND,
          'Pull request not found or not accessible',
          { command, stderr }
        );
      }
      throw new GitHubError(
        GitHubErrorType.REPOSITORY_NOT_FOUND,
        'Repository not found or not accessible',
        { command, stderr }
      );
    }

    if (stderr.includes('authentication') || stderr.includes('unauthorized')) {
      throw new GitHubError(
        GitHubErrorType.AUTHENTICATION_ERROR,
        'GitHub authentication failed',
        { command, stderr }
      );
    }

    if (stderr.includes('rate limit')) {
      throw new GitHubError(
        GitHubErrorType.RATE_LIMIT_ERROR,
        'GitHub API rate limit exceeded',
        { command, stderr }
      );
    }

    if (stderr.includes('permission denied') || stderr.includes('forbidden')) {
      throw new GitHubError(
        GitHubErrorType.PERMISSION_DENIED,
        'GitHub permission denied',
        { command, stderr }
      );
    }

    // Generic error
    const message =
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : 'Unknown error occurred';
    throw new GitHubError(
      GitHubErrorType.UNKNOWN_ERROR,
      `GitHub CLI command failed: ${message}`,
      { command, originalError: error }
    );
  }
}

/**
 * Check if GitHub CLI is available and authenticated
 * @param options Operation options
 * @returns True if CLI is available and authenticated
 */
export async function checkGitHubCLI(
  options: GitHubOperationOptions = {}
): Promise<boolean> {
  try {
    await executeGitHubCommand('gh auth status', options);
    return true;
  } catch (error) {
    if (
      error instanceof GitHubError &&
      error.type === GitHubErrorType.CLI_NOT_FOUND
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Validate PR number format
 * @param prNumber PR number to validate
 * @returns True if valid
 */
export function validatePRNumber(prNumber: string): boolean {
  return /^\d+$/.test(prNumber);
}

/**
 * Validate that a PR exists and is accessible
 * @param prNumber PR number
 * @param options Operation options
 * @returns True if PR is valid
 */
export async function validatePR(
  prNumber: string,
  options: GitHubOperationOptions = {}
): Promise<boolean> {
  if (!validatePRNumber(prNumber)) {
    return false;
  }

  try {
    await executeGitHubCommand(
      `gh pr view ${prNumber} > /dev/null 2>&1`,
      options
    );
    return true;
  } catch (error) {
    if (
      error instanceof GitHubError &&
      error.type === GitHubErrorType.PR_NOT_FOUND
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Gather comprehensive PR data from GitHub
 * @param prNumber PR number
 * @param options Operation options
 * @returns PR data object
 */
export async function gatherPRData(
  prNumber: string,
  options: GitHubOperationOptions = {}
): Promise<GitHubPRData | null> {
  try {
    const [viewResult, diffResult, jsonResult] = await Promise.all([
      executeGitHubCommand(`gh pr view ${prNumber}`, options),
      executeGitHubCommand(`gh pr diff ${prNumber}`, options),
      executeGitHubCommand(
        `gh pr view ${prNumber} --json title,author,state,additions,deletions,url`,
        options
      ),
    ]);

    const prJson = JSON.parse(jsonResult.stdout);

    return {
      view: viewResult.stdout,
      diff: diffResult.stdout,
      json: {
        title: prJson.title,
        author: prJson.author,
        state: prJson.state,
        additions: prJson.additions,
        deletions: prJson.deletions,
        url: prJson.url,
      },
    };
  } catch (error) {
    if (error instanceof GitHubError) {
      throw error;
    }
    throw new GitHubError(
      GitHubErrorType.UNKNOWN_ERROR,
      `Failed to gather PR data: ${(error as Error).message}`,
      { prNumber, originalError: error }
    );
  }
}

/**
 * Post comment to a PR
 * @param prNumber PR number
 * @param commentFile Path to file containing comment
 * @param options Operation options
 * @returns True if successful
 */
export async function postPRComment(
  prNumber: string,
  commentFile: string,
  options: GitHubOperationOptions = {}
): Promise<boolean> {
  try {
    await executeGitHubCommand(
      `gh pr comment ${prNumber} --body-file "${commentFile}"`,
      options
    );
    return true;
  } catch (error) {
    if (error instanceof GitHubError) {
      throw error;
    }
    throw new GitHubError(
      GitHubErrorType.UNKNOWN_ERROR,
      `Failed to post PR comment: ${(error as Error).message}`,
      { prNumber, commentFile, originalError: error }
    );
  }
}

// Type guards
export function isGitHubError(error: unknown): error is GitHubError {
  return error instanceof GitHubError;
}
