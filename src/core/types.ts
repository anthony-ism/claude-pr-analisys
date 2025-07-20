/**
 * Core types for the PR analysis tool
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Base service configuration interface
export interface ServiceConfig {
  name: string;
  enabled: boolean;
  version: string;
}

// Application environment
export enum Environment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  PRODUCTION = 'production',
}

// Tool configuration
export interface ToolConfig {
  environment: Environment;
  debug: boolean;
  tempDir: string;
  maxRetries: number;
  timeout: number;
}

// Analysis context
export interface AnalysisContext {
  prNumber: string;
  ticketId?: string;
  repository: string;
  branch?: string;
  timestamp: Date;
}

// Analysis result
export interface AnalysisResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata: AnalysisMetadata;
}

// Analysis metadata
export interface AnalysisMetadata {
  context: AnalysisContext;
  services: ServiceUsage[];
  performance: PerformanceMetrics;
  model?: string;
}

// Service usage tracking
export interface ServiceUsage {
  service: string;
  operations: string[];
  success: boolean;
  duration: number;
  errors?: string[];
}

// Performance metrics
export interface PerformanceMetrics {
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  serviceBreakdown: Record<string, number>;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
