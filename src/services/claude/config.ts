/**
 * Claude service configuration
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Claude service configuration interface
export interface ClaudeConfig {
  cliPath: string;
  model?: string;
  version: string;
}

// Claude environment validation result
export interface ClaudeValidation {
  hasValidCLI: boolean;
  hasValidVersion: boolean;
  formatErrors: string[];
}

// Optional environment variables for Claude service
export const CLAUDE_OPTIONAL_ENV_VARS = {
  CLAUDE_MODEL: 'CLAUDE_MODEL',
  CLAUDE_CLI_PATH: 'CLAUDE_CLI_PATH',
} as const;

/**
 * Load and validate Claude configuration from environment variables
 * @returns Validated Claude configuration
 * @throws Error if required tools are not available
 */
export function loadClaudeConfig(): ClaudeConfig {
  const cliPath = process.env.CLAUDE_CLI_PATH || 'claude';
  const model = process.env.CLAUDE_MODEL; // Optional

  // Note: We can't validate CLI availability at config load time
  // since it requires async operations. This will be handled in operations.

  return {
    cliPath,
    ...(model && { model }),
    version: 'unknown', // Will be detected at runtime
  };
}

/**
 * Validate Claude environment variables
 * @param cliPath Path to Claude CLI
 * @param model Optional model specification
 * @returns Validation result
 */
export function validateClaudeEnvironment(
  cliPath?: string,
  model?: string
): ClaudeValidation {
  const formatErrors: string[] = [];

  const hasValidCLI = Boolean(cliPath && cliPath.length > 0);
  const hasValidVersion = true; // Will be validated at runtime

  if (model && typeof model !== 'string') {
    formatErrors.push('CLAUDE_MODEL must be a string if provided');
  }

  if (cliPath && typeof cliPath !== 'string') {
    formatErrors.push('CLAUDE_CLI_PATH must be a valid path string');
  }

  return {
    hasValidCLI,
    hasValidVersion,
    formatErrors,
  };
}

/**
 * Get Claude configuration setup instructions
 * @returns Formatted setup instructions
 */
export function getClaudeSetupInstructions(): string {
  return `🔧 Claude Setup:
  # Claude CLI is optional - uses @anthropic-ai/claude-code
  
  Optional:
  export CLAUDE_MODEL=claude-3-sonnet-20240229     # Specify model
  export CLAUDE_CLI_PATH=/custom/path/to/claude    # Custom CLI path

To install Claude CLI:
1. npm install -g @anthropic-ai/claude-code
2. Or use npx claude-code for one-time usage
3. Authentication is handled by the CLI automatically

Note: Claude operations use the claude CLI tool which abstracts away
API tokens and authentication. All analysis is performed locally.`;
}
