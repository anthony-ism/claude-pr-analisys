/**
 * Jira service type definitions
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Jira ticket ID format (e.g., RIZDEV-2055)
export type JiraTicketId = string;

// Jira CLI command types
export type JiraCommand =
  | 'jira issue view'
  | 'jira issue list'
  | 'jira issue create';

// Jira ticket data structure
export interface JiraTicketData {
  key: JiraTicketId;
  summary: string;
  description: string;
  status: string;
  assignee?: string;
  reporter: string;
  created: string;
  updated: string;
}

// Jira ticket extraction result
export interface JiraExtractionResult {
  ticketId: JiraTicketId | null;
  isValid: boolean;
  source: string; // PR title or other source
}

// Jira CLI error response
export interface JiraAPIError {
  errorMessage: string;
  status?: number;
}

// Jira service interface
export interface JiraService {
  extractTicketId(title: string): string | null;
  validateTicket(ticketId: string): Promise<boolean>;
  getTicketData(ticketId: string): Promise<string | null>;
  getTicketExample(): string;
}
