/**
 * Core configuration management
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

import { loadEnvironmentConfig, EnvironmentConfig } from './environment';
import { loadGitHubConfig, GitHubConfig } from '../services/github/config';
import { loadJiraConfig, JiraConfig } from '../services/jira/config';
import { loadClaudeConfig, ClaudeConfig } from '../services/claude/config';
import { ToolConfig, ServiceConfig } from './types';
import { ConfigurationError } from './errors';

// Application configuration interface
export interface AppConfig {
  environment: EnvironmentConfig;
  tool: ToolConfig;
  services: {
    github: GitHubConfig;
    jira: JiraConfig;
    claude: ClaudeConfig;
  };
}

// Configuration cache
let configCache: AppConfig | null = null;

/**
 * Load complete application configuration
 * @param forceReload Force reload from environment (skip cache)
 * @returns Complete application configuration
 */
export function loadAppConfig(forceReload: boolean = false): AppConfig {
  if (configCache && !forceReload) {
    return configCache;
  }

  try {
    const environment = loadEnvironmentConfig();

    const config: AppConfig = {
      environment,
      tool: createToolConfig(environment),
      services: {
        github: loadGitHubConfig(),
        jira: loadJiraConfig(),
        claude: loadClaudeConfig(),
      },
    };

    configCache = config;
    return config;
  } catch (error) {
    console.error(error);
    throw new ConfigurationError('Failed to load application configuration', {
      originalError: error,
    });
  }
}

/**
 * Get service configuration by name
 * @param serviceName Service name
 * @returns Service configuration
 */
export function getServiceConfig(
  serviceName: 'github' | 'jira' | 'claude'
): ServiceConfig {
  const config = loadAppConfig();
  const serviceConfig = config.services[serviceName];

  const baseConfig: ServiceConfig = {
    name: serviceName,
    enabled: true,
    version: serviceConfig.version,
  };

  return baseConfig;
}

/**
 * Validate all configurations
 * @returns Validation results for all services
 */
export function validateAllConfigurations(): {
  environment: boolean;
  github: boolean;
  jira: boolean;
  claude: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let environmentValid = false;
  let githubValid = false;
  let jiraValid = false;
  let claudeValid = false;

  try {
    loadEnvironmentConfig();
    environmentValid = true;
  } catch (error) {
    errors.push(
      `Environment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  try {
    const { validateGitHubEnvironment } = require('../services/github/config');
    const githubValidation = validateGitHubEnvironment();
    githubValid = githubValidation.hasValidRepository;
    if (githubValidation.formatErrors.length > 0) {
      errors.push(
        ...githubValidation.formatErrors.map((e: string) => `GitHub: ${e}`)
      );
    }
  } catch (error) {
    errors.push(
      `GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  try {
    const { validateJiraEnvironment } = require('../services/jira/config');
    const jiraValidation = validateJiraEnvironment();
    jiraValid = jiraValidation.hasValidPrefix;
    if (jiraValidation.formatErrors.length > 0) {
      errors.push(
        ...jiraValidation.formatErrors.map((e: string) => `Jira: ${e}`)
      );
    }
  } catch (error) {
    errors.push(
      `Jira: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  try {
    const { validateClaudeEnvironment } = require('../services/claude/config');
    const claudeValidation = validateClaudeEnvironment();
    claudeValid = claudeValidation.hasValidCLI;
    if (claudeValidation.formatErrors.length > 0) {
      errors.push(
        ...claudeValidation.formatErrors.map((e: string) => `Claude: ${e}`)
      );
    }
  } catch (error) {
    errors.push(
      `Claude: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return {
    environment: environmentValid,
    github: githubValid,
    jira: jiraValid,
    claude: claudeValid,
    errors,
  };
}

/**
 * Get complete setup instructions for all services
 */
export function getSetupInstructions(): string {
  const { getEnvironmentSetupInstructions } = require('./environment');
  const { getGitHubSetupInstructions } = require('../services/github/config');
  const { getJiraSetupInstructions } = require('../services/jira/config');
  const { getClaudeSetupInstructions } = require('../services/claude/config');

  return `# PR Analysis Tool Setup

${getEnvironmentSetupInstructions()}

${getGitHubSetupInstructions()}

${getJiraSetupInstructions()}

${getClaudeSetupInstructions()}

## Quick Start
1. Set required environment variables:
   export GITHUB_REPOSITORY="your-org/your-repo"
   export JIRA_TICKET_PREFIX="PROJ"

2. Install CLI tools:
   # GitHub CLI (required)
   brew install gh
   gh auth login

   # Jira CLI (optional)
   npm install -g jira-cli

   # Claude CLI (optional)
   npm install -g @anthropic-ai/claude-code

3. Test configuration:
   npm run test:config
`;
}

/**
 * Clear configuration cache (useful for testing)
 */
export function clearConfigCache(): void {
  configCache = null;
}

// Helper function to create tool configuration
function createToolConfig(environment: EnvironmentConfig): ToolConfig {
  return {
    environment: environment.environment,
    debug: environment.debug,
    tempDir: environment.tempDir,
    maxRetries: environment.maxRetries,
    timeout: environment.timeout,
  };
}

// Export additional types for external use
export type { EnvironmentConfig, ToolConfig, ServiceConfig };
