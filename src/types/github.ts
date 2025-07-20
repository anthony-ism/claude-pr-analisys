/**
 * GitHub-specific type definitions
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// GitHub PR JSON response structure
export interface GitHubPRJson {
  title: string;
  author: {
    login: string;
  };
  state: string;
  additions: number;
  deletions: number;
  url: string;
}

// Comprehensive PR data gathered from GitHub CLI
export interface PRData {
  view: string; // Output from `gh pr view`
  diff: string; // Output from `gh pr diff`
  json: GitHubPRJson; // Parsed JSON from `gh pr view --json`
}

// GitHub CLI command types
export type GitHubCommand =
  | 'gh pr view'
  | 'gh pr diff'
  | 'gh pr comment'
  | 'gh pr list';

// PR state enumeration
export type PRState = 'open' | 'closed' | 'merged';

// PR comment posting options
export interface CommentOptions {
  prNumber: string;
  bodyFile?: string;
  body?: string;
}

// GitHub API error response
export interface GitHubAPIError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}
