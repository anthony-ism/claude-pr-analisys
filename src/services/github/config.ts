/**
 * GitHub service configuration
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// GitHub service configuration interface
export interface GitHubConfig {
  repository: string;
  owner: string;
  repo: string;
  version: string;
}

// GitHub environment validation result
export interface GitHubValidation {
  hasValidRepository: boolean;
  formatErrors: string[];
}

// Required environment variables for GitHub service
export const GITHUB_ENV_VARS = {
  GITHUB_REPOSITORY: 'GITHUB_REPOSITORY',
} as const;

/**
 * Load and validate GitHub configuration from environment variables
 * @returns Validated GitHub configuration
 * @throws Error if required environment variables are missing or invalid
 */
export function loadGitHubConfig(): GitHubConfig {
  const repository = process.env.GITHUB_REPOSITORY;

  const validation = validateGitHubEnvironment(repository);

  if (!validation.hasValidRepository) {
    const errors = [
      'GITHUB_REPOSITORY is required',
      ...validation.formatErrors,
    ].filter(Boolean);

    throw new Error(`GitHub configuration error: ${errors.join(', ')}`);
  }

  const [owner, repo] = repository!.split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY must be in format "owner/repo"');
  }

  return {
    repository: repository!,
    owner,
    repo,
    version: 'latest', // GitHub CLI version will be detected at runtime
  };
}

/**
 * Validate GitHub environment variables
 * @param repository Repository in format "owner/repo"
 * @returns Validation result
 */
export function validateGitHubEnvironment(
  repository?: string
): GitHubValidation {
  const formatErrors: string[] = [];

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
  export GITHUB_REPOSITORY=owner/repository-name

To use GitHub CLI:
1. Install GitHub CLI: brew install gh (or see https://cli.github.com/)
2. Authenticate: gh auth login
3. Set repository: export GITHUB_REPOSITORY=owner/repo-name`;
}
