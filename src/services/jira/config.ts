/**
 * Jira service configuration
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Jira service configuration interface
export interface JiraConfig {
  prefix: string;
  pattern: RegExp;
  example: string;
  apiToken: string;
  serverUrl: string;
  userEmail: string;
}

// Jira environment validation result
export interface JiraValidation {
  hasValidPrefix: boolean;
  hasValidUrl: boolean;
  hasValidEmail: boolean;
  hasValidToken: boolean;
  formatErrors: string[];
}

// Required environment variables for Jira service
export const JIRA_ENV_VARS = {
  JIRA_TICKET_PREFIX: 'JIRA_TICKET_PREFIX',
  JIRA_API_TOKEN: 'JIRA_API_TOKEN',
  JIRA_SERVER_URL: 'JIRA_SERVER_URL',
  JIRA_USER_EMAIL: 'JIRA_USER_EMAIL',
} as const;

// Optional environment variables for Jira service
export const JIRA_OPTIONAL_ENV_VARS = {
  JIRA_TICKET_PATTERN: 'JIRA_TICKET_PATTERN',
} as const;

/**
 * Load and validate Jira configuration from environment variables
 * @returns Validated Jira configuration
 * @throws Error if required environment variables are missing or invalid
 */
export function loadJiraConfig(): JiraConfig {
  const prefix = process.env.JIRA_TICKET_PREFIX;
  const apiToken = process.env.JIRA_API_TOKEN;
  const serverUrl = process.env.JIRA_SERVER_URL;
  const userEmail = process.env.JIRA_USER_EMAIL;
  const customPattern = process.env.JIRA_TICKET_PATTERN;

  const validation = validateJiraEnvironment(prefix, apiToken, serverUrl, userEmail);

  if (!validation.hasValidPrefix || !validation.hasValidToken || 
      !validation.hasValidUrl || !validation.hasValidEmail) {
    const errors = [
      !validation.hasValidPrefix && 'JIRA_TICKET_PREFIX is required',
      !validation.hasValidToken && 'JIRA_API_TOKEN is required',
      !validation.hasValidUrl && 'JIRA_SERVER_URL is required',
      !validation.hasValidEmail && 'JIRA_USER_EMAIL is required',
      ...validation.formatErrors,
    ].filter(Boolean);

    throw new Error(`Jira configuration error: ${errors.join(', ')}`);
  }

  const example = `${prefix}-1234`;
  const pattern = customPattern 
    ? new RegExp(customPattern)
    : new RegExp(`${prefix}-\\d+`);

  return {
    prefix: prefix!,
    pattern,
    example,
    apiToken: apiToken!,
    serverUrl: serverUrl!,
    userEmail: userEmail!,
  };
}

/**
 * Validate Jira environment variables
 * @param prefix Jira ticket prefix
 * @param apiToken Jira API token
 * @param serverUrl Jira server URL
 * @param userEmail User email for Jira
 * @returns Validation result
 */
export function validateJiraEnvironment(
  prefix?: string,
  apiToken?: string,
  serverUrl?: string,
  userEmail?: string
): JiraValidation {
  const formatErrors: string[] = [];

  const hasValidPrefix = Boolean(prefix && prefix.length > 0);
  const hasValidToken = Boolean(apiToken && apiToken.length > 0);
  let hasValidUrl = Boolean(serverUrl && serverUrl.length > 0);
  let hasValidEmail = Boolean(userEmail && userEmail.length > 0);

  if (serverUrl && !serverUrl.startsWith('https://')) {
    formatErrors.push('JIRA_SERVER_URL must start with https://');
    hasValidUrl = false;
  }

  if (userEmail && !userEmail.includes('@')) {
    formatErrors.push('JIRA_USER_EMAIL must be a valid email address');
    hasValidEmail = false;
  }

  if (prefix && !/^[A-Z]+$/.test(prefix)) {
    formatErrors.push('JIRA_TICKET_PREFIX must contain only uppercase letters');
  }

  return {
    hasValidPrefix,
    hasValidUrl,
    hasValidEmail,
    hasValidToken,
    formatErrors,
  };
}

/**
 * Get Jira configuration setup instructions
 * @returns Formatted setup instructions
 */
export function getJiraSetupInstructions(): string {
  return `🔧 Jira Setup:
  export JIRA_TICKET_PREFIX=YOUR_PREFIX          # e.g., RIZDEV, PROJ
  export JIRA_API_TOKEN=your_jira_api_token
  export JIRA_SERVER_URL=https://your-company.atlassian.net
  export JIRA_USER_EMAIL=your.email@company.com

Optional:
  export JIRA_TICKET_PATTERN="CUSTOM-\\d+"       # Override default pattern

To create a Jira API token:
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create API token
3. Copy the token and set it as JIRA_API_TOKEN environment variable`;
}