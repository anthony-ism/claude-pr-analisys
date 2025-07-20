/**
 * GitHub service configuration
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// GitHub service configuration interface
export interface GitHubConfig {
  token: string;
  repository: string;
  owner: string;
  repo: string;
}

// GitHub environment validation result
export interface GitHubValidation {
  hasValidToken: boolean;
  hasValidRepository: boolean;
  formatErrors: string[];
}

// Required environment variables for GitHub service
export const GITHUB_ENV_VARS = {
  GITHUB_TOKEN: 'GITHUB_TOKEN',
  GITHUB_REPOSITORY: 'GITHUB_REPOSITORY',
} as const;

/**
 * Load and validate GitHub configuration from environment variables
 * @returns Validated GitHub configuration
 * @throws Error if required environment variables are missing or invalid
 */
export function loadGitHubConfig(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  const validation = validateGitHubEnvironment(token, repository);

  if (!validation.hasValidToken || !validation.hasValidRepository) {
    const errors = [
      !validation.hasValidToken && 'GITHUB_TOKEN is required',
      !validation.hasValidRepository && 'GITHUB_REPOSITORY is required',
      ...validation.formatErrors,
    ].filter(Boolean);

    throw new Error(`GitHub configuration error: ${errors.join(', ')}`);
  }

  const [owner, repo] = repository!.split('/');

  return {
    token: token!,
    repository: repository!,
    owner,
    repo,
  };
}

/**
 * Validate GitHub environment variables
 * @param token GitHub personal access token
 * @param repository Repository in format "owner/repo"
 * @returns Validation result
 */
export function validateGitHubEnvironment(
  token?: string,
  repository?: string
): GitHubValidation {
  const formatErrors: string[] = [];

  const hasValidToken = Boolean(token && token.length > 0);
  let hasValidRepository = Boolean(repository && repository.length > 0);

  if (repository && !repository.includes('/')) {
    formatErrors.push('GITHUB_REPOSITORY must be in format "owner/repo"');
    hasValidRepository = false;
  }

  if (repository && repository.split('/').length !== 2) {
    formatErrors.push('GITHUB_REPOSITORY must have exactly one "/" separator');
    hasValidRepository = false;
  }

  return {
    hasValidToken,
    hasValidRepository,
    formatErrors,
  };
}

/**
 * Get GitHub configuration setup instructions
 * @returns Formatted setup instructions
 */
export function getGitHubSetupInstructions(): string {
  return `🔧 GitHub Setup:
  export GITHUB_TOKEN=your_github_personal_access_token
  export GITHUB_REPOSITORY=owner/repository-name

To create a GitHub personal access token:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate new token with 'repo' scope
3. Copy the token and set it as GITHUB_TOKEN environment variable`;
}