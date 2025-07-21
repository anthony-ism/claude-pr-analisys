/**
 * Environment configuration and validation
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

import { config } from 'dotenv';
import { Environment, ValidationResult } from './types';
import { ConfigurationError } from './errors';

// Load environment variables from .env file
config();

// Required environment variables
export const REQUIRED_ENV_VARS = {
  GITHUB_REPOSITORY: 'GITHUB_REPOSITORY',
  JIRA_TICKET_PREFIX: 'JIRA_TICKET_PREFIX',
} as const;

// Optional environment variables
export const OPTIONAL_ENV_VARS = {
  CLAUDE_MODEL: 'CLAUDE_MODEL',
  CLAUDE_CLI_PATH: 'CLAUDE_CLI_PATH',
  NODE_ENV: 'NODE_ENV',
  DEBUG: 'DEBUG',
  TEMP_DIR: 'TEMP_DIR',
  MAX_RETRIES: 'MAX_RETRIES',
  TIMEOUT: 'TIMEOUT',
  JIRA_USER_EMAIL: 'JIRA_USER_EMAIL',
  JIRA_SERVER_URL: 'JIRA_SERVER_URL',
} as const;

// Environment configuration interface
export interface EnvironmentConfig {
  // Required
  githubRepository: string;
  jiraTicketPrefix: string;

  // Optional with defaults
  environment: Environment;
  debug: boolean;
  tempDir: string;
  maxRetries: number;
  timeout: number;

  // Service-specific (optional)
  claudeModel?: string;
  claudeCliPath?: string;
  jiraUserEmail?: string;
  jiraServerUrl?: string;
}

/**
 * Load and validate environment configuration
 * @returns Validated environment configuration
 * @throws ConfigurationError if required variables are missing
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const validation = validateEnvironment();

  if (!validation.isValid) {
    throw new ConfigurationError('Invalid environment configuration', {
      errors: validation.errors,
      warnings: validation.warnings,
    });
  }

  return {
    // Required
    githubRepository: process.env.GITHUB_REPOSITORY!,
    jiraTicketPrefix: process.env.JIRA_TICKET_PREFIX!,

    // Optional with defaults
    environment: getEnvironment(),
    debug: getDebugMode(),
    tempDir: process.env.TEMP_DIR || './temp',
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    timeout: parseInt(process.env.TIMEOUT || '30000', 10),

    // Service-specific (only include if defined)
    ...(process.env.CLAUDE_MODEL && { claudeModel: process.env.CLAUDE_MODEL }),
    ...(process.env.CLAUDE_CLI_PATH && {
      claudeCliPath: process.env.CLAUDE_CLI_PATH,
    }),
    ...(process.env.JIRA_USER_EMAIL && { jiraUserEmail: process.env.JIRA_USER_EMAIL }),
    ...(process.env.JIRA_SERVER_URL && { jiraServerUrl: process.env.JIRA_SERVER_URL }),
  };
}

/**
 * Validate environment variables
 * @returns Validation result with errors and warnings
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const [, envVar] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!process.env[envVar]) {
      errors.push(`Required environment variable ${envVar} is not set`);
    }
  }

  // Validate formats
  if (
    process.env.GITHUB_REPOSITORY &&
    !isValidRepositoryFormat(process.env.GITHUB_REPOSITORY)
  ) {
    errors.push('GITHUB_REPOSITORY must be in format "owner/repo"');
  }

  if (
    process.env.JIRA_TICKET_PREFIX &&
    !isValidJiraPrefix(process.env.JIRA_TICKET_PREFIX)
  ) {
    warnings.push(
      'JIRA_TICKET_PREFIX should be alphanumeric (e.g., "PROJ", "DEV")'
    );
  }

  // Validate numeric values
  if (
    process.env.MAX_RETRIES &&
    !isValidNumber(process.env.MAX_RETRIES, 1, 10)
  ) {
    warnings.push('MAX_RETRIES should be a number between 1 and 10');
  }

  if (
    process.env.TIMEOUT &&
    !isValidNumber(process.env.TIMEOUT, 1000, 300000)
  ) {
    warnings.push(
      'TIMEOUT should be a number between 1000 and 300000 (milliseconds)'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get current environment from NODE_ENV
 */
export function getEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();

  switch (nodeEnv) {
    case 'production':
    case 'prod':
      return Environment.PRODUCTION;
    case 'test':
    case 'testing':
      return Environment.TESTING;
    case 'development':
    case 'dev':
    default:
      return Environment.DEVELOPMENT;
  }
}

/**
 * Get debug mode from DEBUG environment variable
 */
export function getDebugMode(): boolean {
  const debug = process.env.DEBUG?.toLowerCase();
  return debug === 'true' || debug === '1' || debug === 'yes';
}

/**
 * Get environment setup instructions
 */
export function getEnvironmentSetupInstructions(): string {
  return `🔧 Environment Setup:

Quick Start - Copy the example file:
cp .env.example .env

Then edit .env with your actual values.

Required:
export GITHUB_REPOSITORY="owner/repo"        # GitHub repository in owner/repo format
export JIRA_TICKET_PREFIX="PROJ"             # Jira project prefix (e.g., PROJ, DEV)

Optional:
export NODE_ENV="development"                 # Environment: development|testing|production
export DEBUG="true"                          # Enable debug logging
export TEMP_DIR="./temp"                     # Temporary file directory
export MAX_RETRIES="3"                       # Maximum retry attempts
export TIMEOUT="30000"                       # Timeout in milliseconds

Service-specific (optional):
export CLAUDE_MODEL="claude-3-sonnet-20240229"  # Claude model
export CLAUDE_CLI_PATH="/custom/path/claude"    # Custom Claude CLI path
export JIRA_USER_EMAIL="user@company.com"       # Jira user email
export JIRA_SERVER_URL="https://company.atlassian.net/"  # Jira server URL

Example:
export GITHUB_REPOSITORY="myorg/myproject"
export JIRA_TICKET_PREFIX="DEV"
export NODE_ENV="development"
export DEBUG="true"`;
}

// Validation helpers
function isValidRepositoryFormat(repo: string): boolean {
  return /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(repo);
}

function isValidJiraPrefix(prefix: string): boolean {
  return /^[A-Z][A-Z0-9]*$/.test(prefix);
}

function isValidNumber(value: string, min: number, max: number): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max;
}
