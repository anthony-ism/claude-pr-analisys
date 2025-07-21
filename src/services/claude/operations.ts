/**
 * Claude service operations
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { loadClaudeConfig } from './config';
import {
  ClaudeCommandResult,
  ClaudeAnalysisRequest,
  ClaudeAnalysisResponse,
  ClaudeVersionInfo,
  ClaudeError,
  ClaudeErrorType,
  ClaudeOperationOptions,
} from './types';

// Default async exec function
const defaultExecAsync = promisify(exec);

// Dependencies for testing
interface ClaudeDependencies {
  execAsync: typeof defaultExecAsync;
  fs: typeof fs;
}

// Current dependencies (can be overridden for testing)
let deps: ClaudeDependencies = {
  execAsync: defaultExecAsync,
  fs,
};

/**
 * Set dependencies for testing
 * @param newDeps New dependencies
 */
export function setDependencies(newDeps: Partial<ClaudeDependencies>): void {
  deps = { ...deps, ...newDeps };
}

/**
 * Reset dependencies to defaults
 */
export function resetDependencies(): void {
  deps = {
    execAsync: defaultExecAsync,
    fs,
  };
}

/**
 * Execute Claude CLI command with error handling
 * @param command Command to execute
 * @param options Operation options
 * @returns Command result
 */
async function executeClaudeCommand(
  command: string,
  options: ClaudeOperationOptions = {}
): Promise<ClaudeCommandResult> {
  const { timeout = 30000 } = options;

  try {
    const result = await deps.execAsync(command, { timeout });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
    };
  } catch (error: unknown) {
    // Handle different types of errors
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      throw new ClaudeError(
        ClaudeErrorType.CLI_NOT_FOUND,
        'Claude CLI not found. Please install @anthropic-ai/claude-code',
        { command, originalError: error }
      );
    }

    if (
      error &&
      typeof error === 'object' &&
      (('signal' in error && error.signal === 'SIGTERM') ||
        ('killed' in error && error.killed))
    ) {
      throw new ClaudeError(
        ClaudeErrorType.NETWORK_ERROR,
        `Claude CLI command timed out after ${timeout}ms`,
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
    if (stderr.includes('rate limit')) {
      throw new ClaudeError(
        ClaudeErrorType.RATE_LIMIT_ERROR,
        'Claude API rate limit exceeded',
        { command, stderr }
      );
    }

    if (stderr.includes('authentication') || stderr.includes('unauthorized')) {
      throw new ClaudeError(
        ClaudeErrorType.AUTHENTICATION_ERROR,
        'Claude authentication failed',
        { command, stderr }
      );
    }

    if (stderr.includes('model') && stderr.includes('not found')) {
      throw new ClaudeError(
        ClaudeErrorType.MODEL_NOT_FOUND,
        'Specified Claude model not available',
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
    throw new ClaudeError(
      ClaudeErrorType.UNKNOWN_ERROR,
      `Claude CLI command failed: ${message}`,
      { command, originalError: error }
    );
  }
}

/**
 * Check if Claude CLI is available
 * @param options Operation options
 * @returns True if CLI is available
 */
export async function checkClaudeCLI(
  options: ClaudeOperationOptions = {}
): Promise<boolean> {
  try {
    const config = loadClaudeConfig();
    await executeClaudeCommand(`${config.cliPath} --version`, options);
    return true;
  } catch (error) {
    if (
      error instanceof ClaudeError &&
      error.type === ClaudeErrorType.CLI_NOT_FOUND
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Get Claude CLI version information
 * @param options Operation options
 * @returns Version information
 */
export async function getClaudeVersion(
  options: ClaudeOperationOptions = {}
): Promise<ClaudeVersionInfo> {
  const config = loadClaudeConfig();

  try {
    const versionResult = await executeClaudeCommand(
      `${config.cliPath} --version`,
      options
    );
    const version = versionResult.stdout.trim();

    // Try to get available models (this might not be supported by all Claude CLIs)
    let availableModels: string[] = [];
    try {
      const modelsResult = await executeClaudeCommand(
        `${config.cliPath} models`,
        options
      );
      availableModels = modelsResult.stdout
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.trim());
    } catch {
      // Models command might not be available
      availableModels = [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ];
    }

    return {
      version,
      cliPath: config.cliPath,
      availableModels,
    };
  } catch (error) {
    if (error instanceof ClaudeError) {
      throw error;
    }
    throw new ClaudeError(
      ClaudeErrorType.UNKNOWN_ERROR,
      `Failed to get Claude version: ${(error as Error).message}`,
      { originalError: error }
    );
  }
}

/**
 * Create timestamped file for Claude analysis
 * @param content File content
 * @param suffix File suffix
 * @returns File path
 */
export function createAnalysisFile(
  content: string,
  suffix: string = 'txt'
): string {
  const tempDir = path.join(process.cwd(), 'temp');

  // Ensure temp directory exists
  if (!deps.fs.existsSync(tempDir)) {
    deps.fs.mkdirSync(tempDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filename = `claude-prompt-${timestamp}.${suffix}`;
  const filePath = path.join(tempDir, filename);

  deps.fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Analyze content using Claude CLI
 * @param request Analysis request
 * @param options Operation options
 * @returns Analysis response
 */
export async function analyzeWithClaude(
  request: ClaudeAnalysisRequest,
  options: ClaudeOperationOptions = {}
): Promise<ClaudeAnalysisResponse> {
  const config = loadClaudeConfig();
  const startTime = new Date();

  try {
    // Create temporary file with prompt
    const promptFile = createAnalysisFile(request.prompt);

    // Build command
    let command = `${config.cliPath}`;
    if (request.model || config.model) {
      command += ` --model ${request.model || config.model}`;
    }
    command += ` < "${promptFile}"`;

    // Execute analysis
    const result = await executeClaudeCommand(command, options);

    // Clean up temp file
    try {
      deps.fs.unlinkSync(promptFile);
    } catch {
      // Ignore cleanup errors
    }

    if (result.exitCode !== 0) {
      throw new ClaudeError(
        ClaudeErrorType.UNKNOWN_ERROR,
        `Claude analysis failed with exit code ${result.exitCode}`,
        { stderr: result.stderr }
      );
    }

    return {
      content: result.stdout,
      model: request.model || config.model || 'claude-default',
      timestamp: startTime,
    };
  } catch (error) {
    if (error instanceof ClaudeError) {
      throw error;
    }
    throw new ClaudeError(
      ClaudeErrorType.UNKNOWN_ERROR,
      `Claude analysis failed: ${(error as Error).message}`,
      { originalError: error }
    );
  }
}

/**
 * Detect Claude model from CLI
 * @param options Operation options
 * @returns Model information string
 */
export async function detectClaudeModel(
  options: ClaudeOperationOptions = {}
): Promise<string> {
  try {
    const versionInfo = await getClaudeVersion(options);
    const config = loadClaudeConfig();

    if (config.model) {
      return `Claude CLI ${versionInfo.version} (${config.model})`;
    }

    return `Claude CLI ${versionInfo.version}`;
  } catch (error) {
    if (
      error instanceof ClaudeError &&
      error.type === ClaudeErrorType.CLI_NOT_FOUND
    ) {
      return 'Claude AI (CLI not available)';
    }
    return 'Claude AI';
  }
}
