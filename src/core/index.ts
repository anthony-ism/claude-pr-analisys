/**
 * Core module exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Configuration
export {
  AppConfig,
  EnvironmentConfig,
  ToolConfig,
  ServiceConfig,
  loadAppConfig,
  getServiceConfig,
  validateAllConfigurations,
  getSetupInstructions,
  clearConfigCache,
} from './config';

// Environment
export {
  REQUIRED_ENV_VARS,
  OPTIONAL_ENV_VARS,
  loadEnvironmentConfig,
  validateEnvironment,
  getEnvironment,
  getDebugMode,
  getEnvironmentSetupInstructions,
} from './environment';

// Types
export {
  Environment,
  AnalysisContext,
  AnalysisResult,
  AnalysisMetadata,
  ServiceUsage,
  PerformanceMetrics,
  ValidationResult,
} from './types';

// Errors
export {
  ErrorType,
  ErrorSeverity,
  AppError,
  ConfigurationError,
  ValidationError,
  ServiceError,
  AggregateError,
  ErrorUtils,
} from './errors';
