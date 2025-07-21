/**
 * pr-utils.ts - Shared utilities for PR automation scripts
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Common functionality for GitHub PR and Jira integration
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import type { JiraConfig } from '../services/jira/config';
import { exec, ExecOptions } from 'child_process';

// Service imports
import {
  checkGitHubCLI,
  validatePRNumber as validateGitHubPRNumber,
  validatePR as validateGitHubPR,
  GitHubOperationOptions,
} from '../services/github';

import { checkJiraCLI, getJiraConfig } from '../services/jira';

import { checkClaudeCLI } from '../services/claude';

import { loadAppConfig } from '../core';

// Default dependencies for production use
interface UtilDependencies {
  execAsync: (
    command: string,
    options?: ExecOptions
  ) => Promise<{ stdout: string; stderr: string }>;
  readline: typeof readline;
  fs: typeof fs;
}

const defaultDeps: UtilDependencies = {
  execAsync: promisify(exec),
  readline,
  fs,
};

// Current dependencies (can be overridden for testing)
let deps: UtilDependencies = { ...defaultDeps };

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
} as const;

type ColorName = keyof typeof colors;

/**
 * Print colored status message to console
 * @param color Color name for the output
 * @param message Message to print
 */
export function printStatus(color: ColorName, message: string): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Set dependencies for testing
 * @param newDeps New dependencies
 */
export function setDependencies(newDeps: Partial<UtilDependencies>): void {
  deps = { ...deps, ...newDeps };
}

/**
 * Reset dependencies to defaults
 */
export function resetDependencies(): void {
  deps = { ...defaultDeps };
}

/**
 * Validate PR number format
 * @param prNumber PR number to validate
 * @returns True if valid
 */
export function validatePRNumber(prNumber: string): boolean {
  return validateGitHubPRNumber(prNumber);
}

/**
 * Validate that a PR exists and is accessible
 * @param prNumber PR number
 * @param options Operation options
 * @returns True if PR is valid
 */
export async function validatePR(
  prNumber: string,
  options?: GitHubOperationOptions
): Promise<boolean> {
  return validateGitHubPR(prNumber, options);
}

// Re-export service functions with PR-utils interface
export { gatherPRData } from '../services/github';

/**
 * Load Jira configuration
 * @returns Jira configuration object
 */
export function loadJiraConfig(): JiraConfig {
  return getJiraConfig();
}

// Re-export Jira service functions
export { extractJiraTicket } from '../services/jira';
export { validateJiraTicket } from '../services/jira';
export { gatherJiraData } from '../services/jira';

// Re-export Claude service functions
export { detectClaudeModel } from '../services/claude';

/**
 * Check if all required CLI tools are available
 * @returns Object indicating which tools are available
 */
export async function checkRequiredTools(): Promise<{
  github: boolean;
  jira: boolean;
  claude: boolean;
  allRequired: boolean;
}> {
  const [githubAvailable, jiraAvailable, claudeAvailable] = await Promise.all([
    checkGitHubCLI().catch(() => false),
    checkJiraCLI().catch(() => false),
    checkClaudeCLI().catch(() => false),
  ]);

  return {
    github: githubAvailable,
    jira: jiraAvailable,
    claude: claudeAvailable,
    allRequired: githubAvailable, // Only GitHub is required
  };
}

/**
 * Create timestamped file for analysis
 * @param content File content
 * @param prefix File prefix
 * @param extension File extension
 * @returns File path
 */
export function createTimestampedFile(
  content: string,
  prefix: string = 'analysis',
  extension: string = 'md'
): string {
  const config = loadAppConfig();
  const tempDir = config.tool.tempDir;

  // Ensure temp directory exists
  if (!deps.fs.existsSync(tempDir)) {
    deps.fs.mkdirSync(tempDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${prefix}-${timestamp}.${extension}`;
  const filePath = path.join(tempDir, filename);

  deps.fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Validate that a file exists and is readable
 * @param filePath Path to the file
 * @returns True if file is valid
 */
export async function validateFile(filePath: string): Promise<boolean> {
  try {
    await deps.fs.promises.access(filePath, deps.fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

// Re-export GitHub service functions
export { postPRComment } from '../services/github';

/**
 * Get user input from command line
 * @param question Question to ask
 * @returns User input
 */
export async function getUserInput(question: string): Promise<string> {
  const rl = deps.readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Get user confirmation (y/n)
 * @param question Question to ask
 * @param defaultValue Default value if user just presses enter
 * @returns True if user confirms
 */
export async function getUserConfirmation(
  question: string,
  defaultValue: boolean = true
): Promise<boolean> {
  const defaultText = defaultValue ? 'Y/n' : 'y/N';
  const fullQuestion = `${question} (${defaultText}): `;

  const answer = await getUserInput(fullQuestion);

  if (answer === '') {
    return defaultValue;
  }

  return answer.toLowerCase().startsWith('y');
}

/**
 * Display help information for the PR utilities
 */
export function displayHelp(): void {
  printStatus('cyan', '📚 PR Utils Help:');
  printStatus('white', '');
  printStatus('white', 'Environment Variables:');
  printStatus(
    'yellow',
    '  GITHUB_REPOSITORY - GitHub repository (owner/repo format)'
  );
  printStatus(
    'yellow',
    '  JIRA_TICKET_PREFIX - Jira project prefix (e.g., PROJ, DEV)'
  );
  printStatus('white', '');
  printStatus('white', 'Optional Environment Variables:');
  printStatus('yellow', '  CLAUDE_MODEL - Claude model to use');
  printStatus('yellow', '  CLAUDE_CLI_PATH - Custom Claude CLI path');
  printStatus('yellow', '  DEBUG - Enable debug logging (true/false)');
  printStatus('white', '');
  printStatus('white', 'Required CLI Tools:');
  printStatus('green', '  ✅ GitHub CLI (gh) - Required');
  printStatus('yellow', '  ⚠️  Jira CLI - Optional for Jira integration');
  printStatus('yellow', '  ⚠️  Claude CLI - Optional for AI analysis');
}

// Additional exports expected by tests
export function validateEnvironment(): boolean {
  try {
    const githubRepo = process.env.GITHUB_REPOSITORY;
    const jiraPrefix = process.env.JIRA_TICKET_PREFIX;
    return !!(githubRepo && jiraPrefix);
  } catch {
    return false;
  }
}

export function getGitHubPatterns(): Record<string, RegExp> {
  return {
    prNumber: /^\d+$/,
    repository: /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/,
  };
}

export function getJiraPatterns(): Record<string, RegExp> {
  const prefix = process.env.JIRA_TICKET_PREFIX || 'TEST';
  return {
    ticket: new RegExp(`^${prefix}-\\d+$`),
    title: new RegExp(`${prefix}-\\d+`),
  };
}
